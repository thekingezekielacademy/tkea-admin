import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShare, FaClock, FaUser, FaTags, FaFolder, FaCalendar, FaEye, FaCopy, FaCheck, FaTwitter, FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { secureLog, secureError } from '../utils/secureLogger';

interface BlogPostData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image_url?: string;
  reading_time?: number;
  featured?: boolean;
  view_count?: number;
  like_count?: number;
  created_at: string;
  updated_at: string;
  status: string;
  categories?: Array<{ blog_categories: { name: string } }>;
  tags?: Array<{ blog_tags: { name: string } }>;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogPost, setBlogPost] = useState<BlogPostData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      const { data: posts, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories(blog_categories(name)),
          blog_post_tags(blog_tags(name))
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) {
        throw postError;
      }

      secureLog('Blog post data:', posts);
      setBlogPost(posts);
      
      // Increment view count (only if view_count field exists)
      if (posts.id && posts.view_count !== undefined) {
        try {
          await supabase
            .from('blog_posts')
            .update({ view_count: (posts.view_count || 0) + 1 })
            .eq('id', posts.id);
        } catch (error) {
          secureError('Could not update view count:', error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      secureError('Error fetching blog post:', error);
      setError('Failed to load blog post');
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      secureError('Failed to copy link:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blogPost?.title || 'Check out this blog post');
    const text = encodeURIComponent(blogPost?.excerpt || 'Interesting read from King Ezekiel Academy');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Blog Post Not Found</h1>
            <p className="mt-2 text-gray-600">{error || 'The blog post you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/blog')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </button>
        </div>

        {/* Blog Post Content */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {blogPost.featured_image_url && (
            <div className="w-full h-64 sm:h-80 lg:h-96 relative overflow-hidden">
              <img
                src={blogPost.featured_image_url}
                alt={blogPost.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 lg:p-12">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {blogPost.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <FaUser className="w-4 h-4 mr-2" />
                  <span>King Ezekiel Academy</span>
                </div>
                <div className="flex items-center">
                  <FaCalendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(blogPost.created_at)}</span>
                </div>
                {blogPost.reading_time && (
                  <div className="flex items-center">
                    <FaClock className="w-4 h-4 mr-2" />
                    <span>{blogPost.reading_time} min read</span>
                  </div>
                )}
                {blogPost.view_count !== undefined && (
                  <div className="flex items-center">
                    <FaEye className="w-4 h-4 mr-2" />
                    <span>{blogPost.view_count} views</span>
                  </div>
                )}
              </div>

              {/* Categories and Tags */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {blogPost.categories && blogPost.categories.length > 0 && (
                  <div className="flex items-center">
                    <FaFolder className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {blogPost.categories.map((cat, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {cat.blog_categories.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {blogPost.tags && blogPost.tags.length > 0 && (
                  <div className="flex items-center">
                    <FaTags className="w-4 h-4 mr-2 text-gray-400" />
                    <div className="flex flex-wrap gap-2">
                      {blogPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                          {tag.blog_tags.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              {blogPost.excerpt && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg text-gray-700 italic">
                    {blogPost.excerpt}
                  </p>
                </div>
              )}
            </header>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blogPost.content) }}
                className="text-gray-800 leading-relaxed"
              />
            </div>

            {/* Social Sharing */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this post</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FaTwitter className="w-4 h-4 mr-2" />
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaFacebook className="w-4 h-4 mr-2" />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="inline-flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <FaLinkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </button>
                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp className="w-4 h-4 mr-2" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Comments Section - Coming Soon */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Comments</h3>
                <p className="text-gray-600 mb-6">Share your thoughts and engage with other readers</p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <span className="mr-2">🚀</span>
                  Comments coming soon!
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Published on {formatDate(blogPost.created_at)}</span>
                  {blogPost.updated_at !== blogPost.created_at && (
                    <span>• Updated on {formatDate(blogPost.updated_at)}</span>
                  )}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <FaCheck className="w-4 h-4 mr-2" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
