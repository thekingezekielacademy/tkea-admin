import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  header: string;
  body: string;
  conclusion?: string;
  image?: string;
  youtube_link?: string;
  button_text?: string;
  button_url?: string;
  button_click_count?: number;
  author_id: string;
  status: 'draft' | 'published';
  published_at?: string;
  viewers: number;
  likes: number;
  view_count: number;
  like_count: number;
  reading_time: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
}

const BlogManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPosts();
    }
  }, [user, filterStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch blog posts first
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus === 'published') {
        query = query.eq('status', 'published');
      } else if (filterStatus === 'draft') {
        query = query.eq('status', 'draft');
      }

      const { data: postsData, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Get unique author IDs
      const authorIds = Array.from(new Set((postsData || []).map((p: any) => p.author_id).filter(Boolean)));
      
      // Fetch author profiles separately
      const authorProfilesMap = new Map<string, { name: string; email: string }>();
      
      if (authorIds.length > 0) {
        // Since author_id references auth.users, we need to get profiles by matching auth.users.id
        // We'll fetch profiles where id matches author_id
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', authorIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            authorProfilesMap.set(profile.id, {
              name: profile.name || 'Unknown',
              email: profile.email || '',
            });
          });
        }
      }

      // Transform the data
      const transformedPosts: BlogPost[] = (postsData || []).map((post: any) => {
        const authorInfo = authorProfilesMap.get(post.author_id) || { name: 'Unknown', email: '' };
        
        return {
          id: post.id,
          title: post.title || 'Untitled',
          header: post.header || '',
          body: post.body || '',
          conclusion: post.conclusion || '',
          image: post.image || '',
          youtube_link: post.youtube_link || '',
          button_text: post.button_text || '',
          button_url: post.button_url || '',
          button_click_count: post.button_click_count || 0,
          author_id: post.author_id,
          status: post.status || 'draft',
          published_at: post.published_at,
          viewers: post.viewers || post.view_count || 0,
          likes: post.likes || post.like_count || 0,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          reading_time: post.reading_time || 1,
          featured: post.featured || false,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author_name: authorInfo.name,
          author_email: authorInfo.email,
        };
      });

      setPosts(transformedPosts);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.message || 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      setError('');
      setSuccess('');

      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Blog post deleted successfully');
      setDeleteConfirm(null);
      fetchPosts();
    } catch (err: any) {
      console.error('Error deleting blog post:', err);
      setError(err.message || 'Failed to delete blog post');
      setDeleteConfirm(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.header.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading blog posts...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
              <p className="text-gray-600">Manage your blog posts</p>
            </div>
            <button
              onClick={() => navigate('/admin/blog/add')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Post</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Posts</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or header..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Posts</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blog Posts Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">No blog posts found</p>
              <button
                onClick={() => navigate('/admin/blog/add')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Button Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {post.image && (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="h-12 w-12 rounded-lg object-cover mr-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{post.header}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{post.author_name}</div>
                        <div className="text-sm text-gray-500">{post.author_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.view_count || post.viewers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.like_count || post.likes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{post.button_click_count || 0}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {post.youtube_link && (
                              <span className="text-xs text-red-600" title="Has YouTube link">🎥</span>
                            )}
                            {post.button_text && post.button_url && (
                              <span className="text-xs text-indigo-600" title="Has CTA button">🔗</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const views = post.view_count || post.viewers || 0;
                          const clicks = post.button_click_count || 0;
                          if (views === 0 || clicks === 0) {
                            return <span className="text-gray-400">—</span>;
                          }
                          const conversionRate = ((clicks / views) * 100).toFixed(2);
                          const rate = parseFloat(conversionRate);
                          return (
                            <span className={`font-medium ${
                              rate >= 5 ? 'text-green-600' : 
                              rate >= 2 ? 'text-yellow-600' : 
                              rate > 0 ? 'text-orange-600' : 
                              'text-gray-400'
                            }`} title={`${clicks} clicks / ${views} views`}>
                              {conversionRate}%
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {post.featured ? (
                          <span className="text-indigo-600">⭐ Featured</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => setDeleteConfirm(post.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this blog post? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
