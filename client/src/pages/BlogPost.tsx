import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendar, FaUser, FaEye, FaArrowLeft, FaClock, FaTags, FaFolder, FaCopy, FaCheck, FaTwitter, FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import DOMPurify from 'dompurify';
import { secureLog, secureError } from '../utils/secureLogger';
import SEOHead from '../components/SEO/SEOHead';
import { generateBlogPostStructuredData } from '../components/SEO/StructuredData';
import { safeCopyToClipboard, isMiniBrowser } from '../utils/instagramBrowserFix';

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

  const fetchBlogPost = useCallback(async () => {
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
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug, fetchBlogPost]);

  const formatBlogContent = (content: string) => {
    // First sanitize the content
    let sanitizedContent = DOMPurify.sanitize(content);
    
    // Split content into sentences for better formatting
    // Using Safari-compatible regex instead of lookbehind
    const sentences = sanitizedContent.split(/([.!?])\s+/).reduce((acc, part, index) => {
      if (index % 2 === 0) {
        acc.push(part);
      } else {
        acc[acc.length - 1] += part;
      }
      return acc;
    }, [] as string[]);
    
    // Process each sentence to add proper spacing
    const formattedSentences = sentences.map(sentence => {
      // Add extra space after periods, exclamation marks, and question marks
      return sentence.replace(/([.!?])\s*/g, '$1  ');
    });
    
    // Join sentences back together
    sanitizedContent = formattedSentences.join(' ');
    
    // Add proper paragraph spacing
    // Replace multiple line breaks with paragraph breaks
    sanitizedContent = sanitizedContent
      .replace(/\n\n+/g, '</p><p>') // Multiple line breaks become paragraph breaks
      .replace(/\n/g, '</p><p>'); // Single line breaks become paragraph breaks
    
    // Wrap in paragraph tags if not already wrapped
    if (!sanitizedContent.startsWith('<p>')) {
      sanitizedContent = '<p>' + sanitizedContent;
    }
    if (!sanitizedContent.endsWith('</p>')) {
      sanitizedContent = sanitizedContent + '</p>';
    }
    
    // Add extra spacing after sentences ending with periods within paragraphs
    sanitizedContent = sanitizedContent.replace(
      /\.(?=\s*[A-Z])/g, 
      '.  '
    );
    
    // Ensure proper spacing between paragraphs with more breathing room
    sanitizedContent = sanitizedContent.replace(
      /<\/p><p>/g, 
      '</p>\n\n<p>'
    );
    
    // Add extra line breaks for better readability
    sanitizedContent = sanitizedContent.replace(
      /<\/p>/g, 
      '</p>\n'
    );
    
    return sanitizedContent;
  };

  const extractConclusion = (content: string) => {
    // Look for conclusion section in the content
    const conclusionRegex = /##\s*Conclusion\s*\n([\s\S]*?)(?=\n##|$)/i;
    const match = content.match(conclusionRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback: look for "Conclusion" without ##
    const fallbackRegex = /Conclusion\s*\n([\s\S]*?)(?=\n[A-Z]|$)/i;
    const fallbackMatch = content.match(fallbackRegex);
    
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim();
    }
    
    // If no conclusion found, return empty string
    return '';
  };

  const removeConclusion = (content: string) => {
    // Remove conclusion section from the main content
    const conclusionRegex = /##\s*Conclusion\s*\n[\s\S]*$/i;
    const fallbackRegex = /Conclusion\s*\n[\s\S]*$/i;
    
    // Try to remove with ## first
    let cleanedContent = content.replace(conclusionRegex, '');
    
    // If no change, try without ##
    if (cleanedContent === content) {
      cleanedContent = content.replace(fallbackRegex, '');
    }
    
    return cleanedContent.trim();
  };

  const copyToClipboard = async () => {
    try {
      const url = window.location.href;
      const success = await safeCopyToClipboard(url);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for mini browsers - show URL for manual copy
        if (isMiniBrowser()) {
          alert(`Copy this URL: ${url}`);
        } else {
          secureError('Failed to copy link');
        }
      }
    } catch (err) {
      secureError('Failed to copy link:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
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
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
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
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
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

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            <header className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {blogPost.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                <div className="flex items-center">
                  <FaUser className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span>King Ezekiel Academy</span>
                </div>
                <div className="flex items-center">
                  <FaCalendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span>{formatDate(blogPost.created_at)}</span>
                </div>
                {blogPost.reading_time && (
                  <div className="flex items-center">
                    <FaClock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span>{blogPost.reading_time} min read</span>
                  </div>
                )}
                {blogPost.view_count !== undefined && (
                  <div className="flex items-center">
                    <FaEye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span>{blogPost.view_count} views</span>
                  </div>
                )}
              </div>

              {/* Categories and Tags */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {blogPost.categories && blogPost.categories.length > 0 && (
                  <div className="flex items-center">
                    <FaFolder className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {blogPost.categories.map((cat, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {cat.blog_categories.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {blogPost.tags && blogPost.tags.length > 0 && (
                  <div className="flex items-center">
                    <FaTags className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {blogPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
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
                <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-base sm:text-lg text-gray-700 italic">
                    {blogPost.excerpt}
                  </p>
                </div>
              )}
            </header>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: formatBlogContent(removeConclusion(blogPost.content)) }}
                className="text-gray-800 leading-relaxed blog-content"
              />
            </div>

            {/* Conclusion Section - Only show if content contains conclusion */}
            {blogPost.content.toLowerCase().includes('conclusion') && (
              <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4">Conclusion</h3>
                <div className="text-blue-800 leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{ 
                      __html: formatBlogContent(extractConclusion(blogPost.content)) 
                    }}
                    className="prose prose-blue max-w-none"
                  />
                </div>
              </div>
            )}

            {/* Social Sharing */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Share this post</h3>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                >
                  <FaTwitter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Twitter</span>
                  <span className="sm:hidden">Tweet</span>
                </button>
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <FaFacebook className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Facebook</span>
                  <span className="sm:hidden">Share</span>
                </button>
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm sm:text-base"
                >
                  <FaLinkedin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">LinkedIn</span>
                  <span className="sm:hidden">Post</span>
                </button>
                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                >
                  <FaWhatsapp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">WhatsApp</span>
                  <span className="sm:hidden">Send</span>
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
