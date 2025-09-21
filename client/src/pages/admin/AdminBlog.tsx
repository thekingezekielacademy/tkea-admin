import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FaPlus, FaEdit, FaTrash, FaEye, FaArrowLeft } from 'react-icons/fa';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  author_id: string;
  status: 'draft' | 'published';
  published_at: string | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
}

const AdminBlog: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const POSTS_PER_PAGE = 10;

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBlogPosts(0, false);
    }
  }, [user]);

  const loadMorePosts = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchBlogPosts(nextPage, true);
  };

  const fetchBlogPosts = async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      console.log(`🔍 Fetching blog posts page ${page}...`);
      
      // Fetch blog posts with categories and tags, using pagination
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          categories:blog_post_categories(
            category_id,
            blog_categories(id, name, slug)
          ),
          tags:blog_post_tags(
            tag_id,
            blog_tags(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false })
        .range(page * POSTS_PER_PAGE, (page * POSTS_PER_PAGE) + POSTS_PER_PAGE - 1);

      if (postsError) {
        console.error('Supabase error:', postsError);
        if (postsError.code === 'PGRST303' || postsError.message?.includes('JWT expired')) {
          setError('Authentication expired. Please refresh the page and try again.');
        } else {
          setError(`Database error: ${postsError.message}`);
        }
        return;
      }

      console.log(`📊 Supabase response for page ${page}:`, { data: posts, error: postsError });

      // Transform the data to match our interface
      const transformedPosts: BlogPost[] = (posts || []).map(post => ({
        ...post,
        categories: post.categories?.map(cat => ({
          id: cat.blog_categories?.id || '',
          name: cat.blog_categories?.name || '',
          slug: cat.blog_categories?.slug || ''
        })) || [],
        tags: post.tags?.map(tag => ({
          id: tag.blog_tags?.id || '',
          name: tag.blog_tags?.name || '',
          slug: tag.blog_tags?.slug || ''
        })) || []
      }));
      
      console.log(`✅ Blog posts data received for page ${page}:`, transformedPosts);
      console.log(`🔍 Sample blog post data:`, transformedPosts[0]);
      console.log(`🔄 Transformed blog posts for page ${page}:`, transformedPosts);
      
      if (append) {
        setBlogPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setBlogPosts(transformedPosts);
      }
      
      // Check if there are more posts
      const hasMore = posts && posts.length === POSTS_PER_PAGE;
      setHasMorePosts(hasMore);
      console.log(`📊 Has more blog posts:`, hasMore);
      
    } catch (err) {
      setError('Failed to fetch blog posts');
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        // First delete related records (foreign key constraints)
        await supabase.from('blog_post_tags').delete().eq('post_id', postId);
        await supabase.from('blog_post_categories').delete().eq('post_id', postId);
        
        // Then delete the blog post
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', postId);

        if (deleteError) {
          throw deleteError;
        }

        // Remove from local state after successful deletion
        setBlogPosts(prev => prev.filter(post => post.id !== postId));
        
        // Show success message
        alert('Blog post deleted successfully!');
      } catch (err) {
        setError('Failed to delete blog post');
        console.error('Error deleting blog post:', err);
        alert('Failed to delete blog post. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'published' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Published
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Draft
      </span>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => history.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Back to Admin"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Blog</h1>
                <p className="text-gray-600 mt-1">Create and manage your blog posts</p>
              </div>
            </div>
            <button
              onClick={() => history.push('/admin/blog/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add Blog Post
            </button>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading blog posts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => fetchBlogPosts(0, false)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first blog post.</p>
            <button
              onClick={() => history.push('/admin/blog/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Create Your First Post
            </button>
          </div>
        ) : (
          <>
            {/* Post Count Display */}
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{blogPosts.length}</span> blog posts
                {hasMorePosts && (
                  <span className="text-gray-500"> • More available</span>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative">
                                  <img 
                  src={post.featured_image_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(post.status)}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    {post.categories && post.categories.length > 0 && (
                      <span className="text-sm text-gray-500 capitalize">{post.categories[0].name}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{post.title || 'Untitled'}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : 'No content available')}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags && post.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag.name || 'Untagged'}
                      </span>
                    ))}
                    {post.tags && post.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{post.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created: {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown'}</span>
                    <span>Updated: {post.updated_at ? new Date(post.updated_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => history.push(`/admin/blog/${post.id}/edit`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FaEdit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => history.push(`/admin/blog/${post.id}/view`)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <FaEye className="w-4 h-4 mr-2" />
                      View
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMorePosts && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMorePosts}
                disabled={loadingMore}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <FaPlus className="w-5 h-5 mr-2" />
                    Load More Posts
                  </>
                )}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBlog;
