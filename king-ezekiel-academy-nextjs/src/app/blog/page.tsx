"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaSearch, FaCalendar, FaUser, FaEye } from 'react-icons/fa';
import { createClient } from '@/lib/supabase';
import SEOHead from '@/components/SEO/SEOHead';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  status: 'draft' | 'published';
  published_at: string;
  created_at: string;
  updated_at: string;
  categories: Array<{ name: string }>;
  tags: Array<{ name: string }>;
}

const Blog: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const postsPerPage = 9;

  const fetchBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      const supabase = createClient();
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories(
            blog_categories(name)
          ),
          blog_post_tags(
            blog_tags(name)
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('blog_post_categories.blog_categories.name', selectedCategory);
      }

      // Apply tag filter
      if (selectedTag) {
        query = query.eq('blog_post_tags.blog_tags.name', selectedTag);
      }

      // Apply pagination
      const from = (currentPage - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      query = query.range(from, to);

      const { data: posts, error: postsError } = await query;

      if (postsError) {
        console.error('Error fetching blog posts:', postsError);
        console.log('Error code:', postsError.code);
        console.log('Error message:', postsError.message);
        
        // Handle specific error cases
        if (postsError.code === 'PGRST303' || postsError.message?.includes('JWT expired')) {
          setError('Authentication required. Please sign in again.');
        } else if (postsError.code === 'PGRST116' || postsError.message?.includes('JWT')) {
          setError('Access denied. Blog posts are not publicly accessible. Admin needs to disable RLS policies.');
        } else if (postsError.code === '401' || postsError.message?.includes('Unauthorized')) {
          setError('Blog access blocked by Row Level Security (RLS) policies. The admin needs to disable RLS on the blog_posts table.');
        } else if (postsError.code === 'PGRST301' || postsError.message?.includes('permission denied')) {
          setError('Permission denied. Blog posts table has restricted access. Admin needs to disable RLS policies.');
        } else {
          setError(`Failed to load blog posts: ${postsError.message || 'Unknown error'}`);
        }
        return;
      }

      // Transform the data
      const transformedPosts: BlogPost[] = posts?.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        featured_image_url: post.featured_image_url,
        status: post.status,
        published_at: post.published_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        categories: post.blog_post_categories?.filter((c: any) => c.blog_categories)?.map((c: any) => ({ name: c.blog_categories.name })) || [],
        tags: post.blog_post_tags?.filter((t: any) => t.blog_tags)?.map((t: any) => ({ name: t.blog_tags.name })) || []
      })) || [];

      if (currentPage === 1) {
        setBlogPosts(transformedPosts);
      } else {
        setBlogPosts(prev => [...prev, ...transformedPosts]);
      }

      setHasMore(transformedPosts.length === postsPerPage);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedTag, searchTerm, postsPerPage]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // Reset other filters when searching
    setSelectedCategory('');
    setSelectedTag('');
    fetchBlogPosts();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setSelectedTag('');
    setCurrentPage(1);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    blogPosts.forEach(post => {
      post.categories.forEach(cat => categories.add(cat.name));
    });
    return Array.from(categories);
  };

  const getUniqueTags = () => {
    const tags = new Set<string>();
    blogPosts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag.name));
    });
    return Array.from(tags);
  };

  const filteredPosts = blogPosts.filter(post => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Blog Access Error</h1>
            <p className="mt-2 text-gray-600 mb-4">{error}</p>
            
            {error.includes('RLS') || error.includes('security policies') ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-3">Quick Fix Required</h3>
                <p className="text-yellow-700 mb-4">
                  The blog posts are currently blocked by database security policies. This needs to be fixed by an administrator.
                </p>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Admin Action Required:</p>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://supabase.com/dashboard/project/hclguhbswctxfahhzrrr" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                    <li>Click "SQL Editor" in the left sidebar</li>
                    <li>Run this command: <code className="bg-yellow-200 px-2 py-1 rounded font-mono">ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;</code></li>
                    <li>Click "Run" button</li>
                  </ol>
                </div>
              </div>
            ) : null}
            
            <button
              onClick={() => fetchBlogPosts()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Blog - King Ezekiel Academy"
        description="Discover insights, tips, and strategies to help you master digital skills and grow your business. Expert advice from industry professionals."
      />
      
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover insights, tips, and strategies to help you master digital skills and grow your business.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                    placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                </div>
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category and Tag Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                     {category}
                </option>
              ))}
            </select>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tags</option>
              {getUniqueTags().map((tag) => (
                <option key={tag} value={tag}>
                    {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading && currentPage === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading blog posts...</p>
          </div>
          ) : error ? (
          <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No blog posts found.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedTag('');
                  setCurrentPage(1);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Featured Image */}
                  {post.featured_image_url && (
                      <div className="w-full h-48 relative overflow-hidden">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                          className="w-full h-full object-cover"
                        />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                      {/* Categories */}
                      {post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories.slice(0, 2).map((category, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                          <FaCalendar className="w-4 h-4" />
                        <span>{getReadingTime(post.content)} min read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUser className="w-4 h-4" />
                          <span>Admin</span>
                        </div>
                    </div>

                    {/* Read More Button */}
                      <Link
                        href={`/blog/${post.slug}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Read Article
                        <FaEye className="w-4 h-4 ml-2" />
                      </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default Blog;