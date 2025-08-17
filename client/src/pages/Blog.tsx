import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FaSearch, FaClock, FaUser, FaTags, FaFolder, FaArrowRight } from 'react-icons/fa';

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
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 9;

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      
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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
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

  // Fetch blog posts when dependencies change
  useEffect(() => {
    fetchBlogPosts();
  }, [currentPage, selectedCategory, selectedTag]);

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
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Our Blog
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Discover insights, tips, and strategies to help you master digital skills and grow your business
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category and Tag Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Categories:</span>
              <div className="flex flex-wrap gap-2">
                {getUniqueCategories().map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {getUniqueTags().map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading && currentPage === 1 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading blog posts...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory || selectedTag
                ? 'Try adjusting your search or filters.'
                : 'No published blog posts yet. Check back later for new content.'
              }
            </p>
            {!searchTerm && !selectedCategory && !selectedTag && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Admin users can create blog posts from the admin panel.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Test</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    To test the blog functionality, you need to:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Go to Supabase Dashboard → SQL Editor</li>
                    <li>Run: <code className="bg-blue-100 px-1 rounded">ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;</code></li>
                    <li>Create a blog post from Admin Panel</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Featured Image */}
                  {post.featured_image_url && (
                    <div className="relative">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        {post.categories.length > 0 && (
                          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                            {post.categories[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {tag.name}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-4 h-4" />
                        <span>{getReadingTime(post.content)} min read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUser className="w-4 h-4" />
                        <span>King Ezekiel Academy</span>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <button
                      onClick={() => navigate(`/blog/${post.slug}`)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Read Article
                      <FaArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
