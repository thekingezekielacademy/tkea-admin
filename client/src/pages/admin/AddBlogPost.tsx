import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaEye } from 'react-icons/fa';
import TagsInput from '../../components/TagsInput';
import { supabase } from '../../lib/supabase';

interface BlogPostData {
  title: string;
  header: string;
  body: string;
  conclusion: string;
  image: string;
  status: 'draft' | 'published';
  reading_time: number;
  featured: boolean;
  // For form handling
  selectedCategory: string;
  selectedTags: string[];
}

const AddBlogPost: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [blogData, setBlogData] = useState<BlogPostData>({
    title: '',
    header: '',
    body: '',
    conclusion: '',
    image: '',
    status: 'draft',
    reading_time: 1,
    featured: false,
    selectedCategory: '',
    selectedTags: []
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Business & Entrepreneurship',
    'Branding & Public Relations',
    'Content & Communication',
    'Digital Advertising',
    'Email & SEO Strategies',
    'UI/UX Design',
    'Visual Communication',
    'Video Editing & Creation',
    'Data Science & Analytics',
    'Artificial Intelligence & Cloud',
    'Project & Workflow Management',
    'Information Security'
  ];

  const fetchExistingBlogPost = useCallback(async () => {
    if (!id) return;
    
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

      // Extract body and conclusion from content
      const content = post.content || '';
      const conclusionIndex = content.indexOf('## Conclusion\n\n');
      const conclusion = conclusionIndex !== -1 ? content.substring(conclusionIndex + 18).trim() : '';
      const body = conclusionIndex !== -1 ? content.substring(0, conclusionIndex).trim() : content;

      // Set the form data
      setBlogData({
        title: post.title || '',
        header: post.excerpt || '',
        body: body,
        conclusion: conclusion,
        image: post.featured_image_url || '',
        status: post.status || 'draft',
        reading_time: post.reading_time || 1,
        featured: post.featured || false,
        selectedCategory: post.blog_post_categories?.[0]?.blog_categories?.name || '',
        selectedTags: post.blog_post_tags?.map(pt => pt.blog_tags.name) || []
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching existing blog post:', error);
      setLoading(false);
    }
  }, [id]);

  // Fetch existing blog post data when editing
  useEffect(() => {
    if (isEditing && id) {
      fetchExistingBlogPost();
    }
  }, [isEditing, id, fetchExistingBlogPost]);

  const handleInputChange = (field: keyof BlogPostData, value: string | string[] | number | boolean) => {
    setBlogData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryAndTags = async (blogPostId: string) => {
    // Insert category relationship if selected
    if (blogData.selectedCategory) {
      try {
        // First, get the category ID from the name
        const { data: categoryData, error: categoryLookupError } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('name', blogData.selectedCategory)
          .single();

        if (categoryLookupError) {
          console.log('Category not found, creating new one:', blogData.selectedCategory);
          // Create the category if it doesn't exist
          const { data: newCategory, error: createCategoryError } = await supabase
            .from('blog_categories')
            .insert([{ 
              name: blogData.selectedCategory,
              slug: blogData.selectedCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            }])
            .select()
            .single();

          if (createCategoryError) {
            console.error('Error creating category:', createCategoryError);
          } else {
            // Now create the relationship
            const { error: categoryError } = await supabase
              .from('blog_post_categories')
              .insert([{
                post_id: blogPostId,
                category_id: newCategory.id
              }]);

            if (categoryError) {
              console.error('Error saving category relationship:', categoryError);
            }
          }
        } else if (categoryData) {
          const { error: categoryError } = await supabase
            .from('blog_post_categories')
            .insert([{
              post_id: blogPostId,
              category_id: categoryData.id
            }]);

          if (categoryError) {
            console.error('Error saving category relationship:', categoryError);
          }
        }
      } catch (error) {
        console.error('Error handling category:', error);
      }
    }

    // Insert tags relationships
    if (blogData.selectedTags.length > 0) {
      for (const tagName of blogData.selectedTags) {
        try {
          // First, ensure the tag exists
          let { data: existingTag } = await supabase
            .from('blog_tags')
            .select('id')
            .eq('name', tagName)
            .single();

          if (!existingTag) {
            // Create new tag if it doesn't exist
            const { data: newTag, error: tagError } = await supabase
              .from('blog_tags')
              .insert([{ 
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              }])
              .select()
              .single();

            if (tagError) {
              console.error('Error creating tag:', tagError);
              continue;
            }
            existingTag = newTag;
          }

          // Create post-tag relationship
          const { error: postTagError } = await supabase
            .from('blog_post_tags')
            .insert([{
              post_id: blogPostId,
              tag_id: existingTag.id
            }]);

          if (postTagError) {
            console.error('Error saving tag relationship:', postTagError);
          }
        } catch (error) {
          console.error('Error handling tag:', tagName, error);
        }
      }
    }
  };

  const updateCategoryAndTags = async () => {
    if (!id) return;

    try {
      // Remove existing relationships
      await supabase.from('blog_post_categories').delete().eq('post_id', id);
      await supabase.from('blog_post_tags').delete().eq('post_id', id);

      // Add new relationships
      await handleCategoryAndTags(id);
    } catch (error) {
      console.error('Error updating category and tags:', error);
    }
  };

  const handleSave = async () => {
    if (!blogData.title || !blogData.header || !blogData.body || !blogData.conclusion) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      let blogPostId: string;
      
      if (isEditing && id) {
        // Update existing blog post
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .update({
            title: blogData.title,
            slug: blogData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: blogData.body + (blogData.conclusion ? '\n\n## Conclusion\n\n' + blogData.conclusion : ''),
            excerpt: blogData.header,
            featured_image_url: blogData.image || null,
            status: 'draft',
            published_at: null
          })
          .eq('id', id)
          .select()
          .single();

        if (blogError) {
          throw blogError;
        }
        
        blogPostId = id;
        console.log('Blog post updated successfully');
      } else {
        // Insert new blog post
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .insert([{
            title: blogData.title,
            slug: blogData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: blogData.body + (blogData.conclusion ? '\n\n## Conclusion\n\n' + blogData.conclusion : ''),
            excerpt: blogData.header,
            featured_image_url: blogData.image || null,
            status: 'draft',
            published_at: null
          }])
          .select()
          .single();

        if (blogError) {
          throw blogError;
        }
        
        blogPostId = blogPost.id;
        console.log('Blog post created successfully');
      }

      // Handle category and tags
      if (isEditing && id) {
        // Update existing relationships
        await updateCategoryAndTags();
      } else {
        // Insert new relationships
        if (blogData.selectedCategory) {
          const { error: categoryError } = await supabase
            .from('blog_post_categories')
            .insert([{
              post_id: blogPostId,
              category_id: blogData.selectedCategory
            }]);

          if (categoryError) {
            console.error('Error saving category:', categoryError);
          }
        }

        // Insert tags relationships
        if (blogData.selectedTags.length > 0) {
          for (const tagName of blogData.selectedTags) {
            // First, ensure the tag exists
            let { data: existingTag } = await supabase
              .from('blog_tags')
              .select('id')
              .eq('name', tagName)
              .single();

            if (!existingTag) {
              // Create new tag if it doesn't exist
              const { data: newTag, error: tagError } = await supabase
                .from('blog_tags')
                .insert([{ name: tagName }])
                .select()
                .single();

              if (tagError) {
                console.error('Error creating tag:', tagError);
                continue;
              }
              existingTag = newTag;
            }

            // Create post-tag relationship
            const { error: postTagError } = await supabase
              .from('blog_post_tags')
              .insert([{
                post_id: blogPostId,
                tag_id: existingTag.id
              }]);

            if (postTagError) {
              console.error('Error saving tag relationship:', postTagError);
            }
          }
        }
      }
      
      alert(isEditing ? 'Blog post updated successfully!' : 'Blog post saved successfully!');
      history.push('/admin/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Failed to save blog post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!blogData.title || !blogData.header || !blogData.body || !blogData.conclusion) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      let blogPostId: string;
      
      if (isEditing && id) {
        // Update existing blog post
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .update({
            title: blogData.title,
            slug: blogData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: blogData.body + (blogData.conclusion ? '\n\n## Conclusion\n\n' + blogData.conclusion : ''),
            excerpt: blogData.header,
            featured_image_url: blogData.image || null,
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (blogError) {
          throw blogError;
        }
        
        blogPostId = id;
        console.log('Blog post updated and published successfully');
      } else {
        // Insert new blog post
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .insert([{
            title: blogData.title,
            slug: blogData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            content: blogData.body + (blogData.conclusion ? '\n\n## Conclusion\n\n' + blogData.conclusion : ''),
            excerpt: blogData.header,
            featured_image_url: blogData.image || null,
            status: 'published',
            published_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (blogError) {
          throw blogError;
        }
        
        blogPostId = blogPost.id;
        console.log('Blog post created and published successfully');
      }

      // Handle category and tags
      if (isEditing && id) {
        // Update existing relationships
        await updateCategoryAndTags();
      } else {
        // Insert new relationships
        await handleCategoryAndTags(blogPostId);
      }
      
      alert(isEditing ? 'Blog post updated and published successfully!' : 'Blog post published successfully!');
      history.push('/admin/blog');
    } catch (error) {
      console.error('Error publishing blog post:', error);
      alert('Failed to publish blog post. Please try again.');
    } finally {
      setSaving(false);
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
                <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Blog Post' : 'Add Blog Post'}</h1>
                <p className="text-gray-600 mt-1">{isEditing ? 'Update your existing blog post' : 'Create a new blog post for your audience'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors ${
                  previewMode
                    ? 'border-primary-300 text-primary-700 bg-primary-50'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FaEye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              {blogData.image && (
                <img 
                  src={blogData.image} 
                  alt={blogData.title || 'Blog Post'}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  blogData.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {blogData.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                {blogData.selectedCategory && (
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                    {blogData.selectedCategory}
                  </span>
                )}
                {blogData.featured && (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    ⭐ Featured
                  </span>
                )}
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  📖 {blogData.reading_time} min read
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {blogData.title || 'Blog Post Title'}
              </h1>
              
              <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                {blogData.header || 'Blog Post Header'}
              </h2>
              
              <div className="prose prose-lg max-w-none mb-8">
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {blogData.body || 'Blog post body will appear here...'}
                </div>
                
                {blogData.conclusion && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Conclusion</h3>
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {blogData.conclusion}
                    </div>
                  </div>
                )}
              </div>
              
              {blogData.selectedTags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-wrap gap-2">
                    {blogData.selectedTags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={blogData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter blog post title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header *
                  </label>
                  <input
                    type="text"
                    value={blogData.header}
                    onChange={(e) => handleInputChange('header', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter blog post header"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Content</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body *
                  </label>
                  <textarea
                    value={blogData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Write your blog post body here..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conclusion *
                  </label>
                  <textarea
                    value={blogData.conclusion}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Write your blog post conclusion here..."
                  />
                </div>
              </div>
            </div>

            {/* Media & Tags */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Media & Tags</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <input
                    type="url"
                    value={blogData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter a URL for the blog post image (optional)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={blogData.selectedCategory}
                    onChange={(e) => handleInputChange('selectedCategory', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <TagsInput
                    tags={blogData.selectedTags}
                    onChange={(tags) => handleInputChange('selectedTags', tags)}
                    placeholder="Type and press Enter to add tags..."
                    maxTags={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Add relevant tags to help readers find your post
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reading Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={blogData.reading_time}
                      onChange={(e) => handleInputChange('reading_time', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="5"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Estimated reading time in minutes
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={blogData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                        className="mr-2 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Featured Post</span>
                    </label>
                    <p className="text-sm text-gray-500 ml-2">
                      Show this post prominently
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={blogData.status === 'draft'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Save as Draft</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={blogData.status === 'published'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Publish Now</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => history.push('/admin/blog')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave className="w-4 h-4 mr-2 inline" />
                    {saving ? 'Saving...' : isEditing ? 'Update Draft' : 'Save Draft'}
                  </button>
                  
                  <button
                    onClick={handlePublish}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Publish Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddBlogPost;
