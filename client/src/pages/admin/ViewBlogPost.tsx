import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaEye, FaTrash, FaCalendar, FaUser, FaClock, FaTags, FaFolder } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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

const ViewBlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const history = useHistory();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlogPost();
    }
  }, [id]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      
      // Fetch the blog post with category and tag information
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories!inner(
            blog_categories!inner(name)
          ),
          blog_post_tags!inner(
            blog_tags!inner(name)
          )
        `)
        .eq('id', id)
        .single();

      if (postError) {
        throw postError;
      }

      // Transform the data to match our interface
      const transformedPost: BlogPost = {
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
        categories: post.blog_post_categories?.map((c: any) => ({ name: c.blog_categories.name })) || [],
        tags: post.blog_post_tags?.map((t: any) => ({ name: t.blog_tags.name })) || []
      };

      setBlogPost(transformedPost);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!blogPost || !window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      // Delete related records first
      await supabase.from('blog_post_tags').delete().eq('post_id', blogPost.id);
      await supabase.from('blog_post_categories').delete().eq('post_id', blogPost.id);
      
      // Delete the blog post
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', blogPost.id);

      if (error) {
        throw error;
      }

      alert('Blog post deleted successfully!');
      history.push('/admin/blog');
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading blog post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            <p className="mt-2 text-gray-600">{error || 'Blog post not found'}</p>
            <button
              onClick={() => history.push('/admin/blog')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Blog Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => history.push('/admin/blog')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Back to Blog Management"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">View Blog Post</h1>
                <p className="text-gray-600 mt-1">Preview and manage your blog post</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => history.push(`/admin/blog/${blogPost.id}/edit`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaEdit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Blog Post Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {blogPost.featured_image_url && (
            <div className="relative">
              <img 
                src={blogPost.featured_image_url} 
                alt={blogPost.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  blogPost.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {blogPost.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Meta Information */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaCalendar className="w-4 h-4" />
                <span>
                  {blogPost.published_at 
                    ? new Date(blogPost.published_at).toLocaleDateString()
                    : 'Not published yet'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaUser className="w-4 h-4" />
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span>
                  {Math.ceil(blogPost.content.split(' ').length / 200)} min read
                </span>
              </div>
            </div>

            {/* Categories and Tags */}
            <div className="flex items-center gap-3 mb-6">
              {blogPost.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <FaFolder className="w-4 h-4 text-gray-500" />
                  {blogPost.categories.map((category, index) => (
                    <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
              {blogPost.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <FaTags className="w-4 h-4 text-gray-500" />
                  {blogPost.tags.map((tag, index) => (
                    <span key={index} className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Title and Header */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {blogPost.title}
            </h1>
            
            {blogPost.excerpt && (
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                {blogPost.excerpt}
              </h2>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {blogPost.content}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created: {new Date(blogPost.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(blogPost.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBlogPost;
