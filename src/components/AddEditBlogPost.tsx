import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface BlogPostForm {
  title: string;
  header: string;
  body: string;
  conclusion: string;
  image: string;
  youtube_link: string;
  button_text: string;
  button_url: string;
  status: 'draft' | 'published';
  featured: boolean;
  reading_time: number;
}

const AddEditBlogPost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<BlogPostForm>({
    title: '',
    header: '',
    body: '',
    conclusion: '',
    image: '',
    youtube_link: '',
    button_text: '',
    button_url: '',
    status: 'draft',
    featured: false,
    reading_time: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetching, setFetching] = useState(isEditMode);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id || !isEditMode) return;
      
      try {
        setFetching(true);
        setError('');

        const { data: post, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (post) {
          setFormData({
            title: post.title || '',
            header: post.header || '',
            body: post.body || '',
            conclusion: post.conclusion || '',
            image: post.image || '',
            youtube_link: post.youtube_link || '',
            button_text: post.button_text || '',
            button_url: post.button_url || '',
            status: post.status || 'draft',
            featured: post.featured || false,
            reading_time: post.reading_time || 1,
          });
        }
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError(err.message || 'Failed to fetch blog post');
      } finally {
        setFetching(false);
      }
    };

    if (user?.role === 'admin' && isEditMode && id) {
      fetchPost();
    }
  }, [user, id, isEditMode]);

  const calculateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return Math.max(1, minutes);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-calculate reading time when body changes
      if (name === 'body') {
        const readingTime = calculateReadingTime(value);
        setFormData(prev => ({ ...prev, reading_time: readingTime }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.header.trim()) {
      setError('Header is required');
      return;
    }

    if (!formData.body.trim()) {
      setError('Body content is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const postData: any = {
        title: formData.title.trim(),
        header: formData.header.trim(),
        body: formData.body.trim(),
        conclusion: formData.conclusion.trim() || null,
        image: formData.image.trim() || null,
        youtube_link: formData.youtube_link.trim() || null,
        button_text: formData.button_text.trim() || null,
        button_url: formData.button_url.trim() || null,
        status: formData.status,
        featured: formData.featured,
        reading_time: formData.reading_time,
        updated_at: new Date().toISOString(),
      };

      if (isEditMode) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (updateError) {
          throw updateError;
        }

        setSuccess('Blog post updated successfully');
      } else {
        // Create new post
        postData.author_id = user?.id;
        postData.created_at = new Date().toISOString();
        
        if (formData.status === 'published') {
          postData.published_at = new Date().toISOString();
        }

        const { error: insertError } = await supabase
          .from('blog_posts')
          .insert(postData);

        if (insertError) {
          throw insertError;
        }

        setSuccess('Blog post created successfully');
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/blog');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving blog post:', err);
      setError(err.message || 'Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading blog post...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isEditMode ? 'Edit Blog Post' : 'Add New Blog Post'}
              </h1>
              <p className="text-gray-600">Create or update your blog post</p>
            </div>
            <button
              onClick={() => navigate('/admin/blog')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Blog
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter blog post title"
            />
          </div>

          {/* Header */}
          <div>
            <label htmlFor="header" className="block text-sm font-medium text-gray-700 mb-2">
              Header/Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              id="header"
              name="header"
              value={formData.header}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a brief header or excerpt for the blog post"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Body Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              required
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="Enter the main content of your blog post"
            />
            <p className="mt-2 text-sm text-gray-500">
              Estimated reading time: {formData.reading_time} minute{formData.reading_time !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Conclusion */}
          <div>
            <label htmlFor="conclusion" className="block text-sm font-medium text-gray-700 mb-2">
              Conclusion (Optional)
            </label>
            <textarea
              id="conclusion"
              name="conclusion"
              value={formData.conclusion}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a conclusion or summary (optional)"
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image URL (Optional)
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className="mt-4">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* YouTube Link */}
          <div>
            <label htmlFor="youtube_link" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Link (Optional)
            </label>
            <input
              type="url"
              id="youtube_link"
              name="youtube_link"
              value={formData.youtube_link}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a YouTube video URL. The link will only display when added.
            </p>
          </div>

          {/* Button (CTA) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call-to-Action Button (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add a button that appears before the conclusion section. The button will only display when both text and URL are provided.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="button_text" className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  id="button_text"
                  name="button_text"
                  value={formData.button_text}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Get Started, Learn More, Sign Up"
                />
              </div>
              <div>
                <label htmlFor="button_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Button URL
                </label>
                <input
                  type="url"
                  id="button_url"
                  name="button_url"
                  value={formData.button_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/page"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Both fields are required for the button to display.
            </p>
          </div>

          {/* Status and Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label htmlFor="reading_time" className="block text-sm font-medium text-gray-700 mb-2">
                Reading Time (minutes)
              </label>
              <input
                type="number"
                id="reading_time"
                name="reading_time"
                value={formData.reading_time}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Featured Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Feature this post
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/blog')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditBlogPost;
