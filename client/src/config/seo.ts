/**
 * SEO Configuration
 * 
 * This file contains all SEO-related configurations including:
 * - Default meta tags
 * - Page-specific SEO settings
 * - Structured data configurations
 * - Social media settings
 * - Analytics configurations
 */

export interface PageSEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'course' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface SocialMediaConfig {
  facebook: {
    appId: string;
    pageId: string;
  };
  twitter: {
    handle: string;
    site: string;
  };
  linkedin: {
    companyId: string;
  };
  youtube: {
    channelId: string;
  };
}

export interface AnalyticsConfig {
  googleAnalytics: {
    measurementId: string;
    debugMode: boolean;
  };
  googleTagManager: {
    containerId: string;
  };
  facebookPixel: {
    pixelId: string;
  };
}

export interface SEOSiteConfig {
  name: string;
  url: string;
  description: string;
  language: string;
  locale: string;
  author: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  socialMedia: SocialMediaConfig;
  analytics: AnalyticsConfig;
}

// Main site configuration
export const siteConfig: SEOSiteConfig = {
  name: 'King Ezekiel Academy',
  url: 'https://thekingezekielacademy.com',
  description: 'Leading digital marketing education platform providing comprehensive courses and training for entrepreneurs and professionals. Learn digital marketing, social media, e-commerce, and business growth strategies.',
  language: 'en',
  locale: 'en_US',
  author: 'King Ezekiel',
  contactEmail: 'info@thekingezekielacademy.com',
  contactPhone: '+234-XXX-XXX-XXXX',
  address: {
    street: 'Digital Marketing Hub',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    postalCode: '100001'
  },
  socialMedia: {
    facebook: {
      appId: 'your-facebook-app-id',
      pageId: 'your-facebook-page-id'
    },
    twitter: {
      handle: '@kingezekielacademy',
      site: '@kingezekielacademy'
    },
    linkedin: {
      companyId: 'your-linkedin-company-id'
    },
    youtube: {
      channelId: 'your-youtube-channel-id'
    }
  },
  analytics: {
    googleAnalytics: {
      measurementId: 'G-8DXQN4Q7LD', // Your actual GA4 ID
      debugMode: process.env.NODE_ENV === 'development'
    },
    googleTagManager: {
      containerId: 'GTM-XXXXXXX' // Your actual GTM ID
    },
    facebookPixel: {
      pixelId: 'your-facebook-pixel-id'
    }
  }
};

// Default SEO configuration
export const defaultSEO: PageSEOConfig = {
  title: 'Digital Marketing Education Platform',
  description: 'Learn digital marketing, social media, e-commerce, and business growth strategies from industry experts. Join thousands of successful entrepreneurs and professionals.',
  keywords: 'digital marketing, social media marketing, e-commerce, business growth, online education, digital skills, entrepreneurship, Nigeria, Africa',
  ogImage: '/img/linkpreview_image.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image'
};

// Page-specific SEO configurations
export const pageSEOConfigs: Record<string, PageSEOConfig> = {
  home: {
    title: 'Digital Marketing Education Platform',
    description: 'Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students.',
    keywords: 'digital marketing courses, online education, business growth, entrepreneurship, Nigeria, Africa',
    ogImage: '/img/og-home.jpg',
    ogType: 'website'
  },
  
  courses: {
    title: 'Digital Marketing Courses',
    description: 'Master digital marketing with our comprehensive course library. From beginners to advanced strategies, we have courses for every skill level.',
    keywords: 'digital marketing courses, social media marketing, e-commerce, content marketing, SEO, PPC, online advertising',
    ogImage: '/img/og-courses.jpg',
    ogType: 'website'
  },
  
  blog: {
    title: 'Digital Marketing Blog',
    description: 'Stay updated with the latest digital marketing trends, tips, and strategies. Expert insights to help grow your business online.',
    keywords: 'digital marketing blog, marketing tips, business growth, social media, content marketing, SEO, online business',
    ogImage: '/img/og-blog.jpg',
    ogType: 'website'
  },
  
  about: {
    title: 'About King Ezekiel Academy',
    description: 'Learn about our mission to democratize digital marketing education. Founded by King Ezekiel, we\'ve trained over 10,000 students worldwide.',
    keywords: 'about us, King Ezekiel, digital marketing expert, education platform, mission, vision, success stories',
    ogImage: '/img/og-about.jpg',
    ogType: 'website'
  },
  
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with our team for support, course inquiries, or partnership opportunities. We\'re here to help you succeed.',
    keywords: 'contact us, support, help, course inquiries, partnership, digital marketing academy',
    ogImage: '/img/og-contact.jpg',
    ogType: 'website'
  },
  
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how we protect your privacy and handle your personal information. Our commitment to data security and user privacy.',
    keywords: 'privacy policy, data protection, user privacy, GDPR, data security',
    ogImage: '/img/linkpreview_image.jpg',
    ogType: 'website'
  },
  
  terms: {
    title: 'Terms of Service',
    description: 'Read our terms of service and user agreement. Understanding your rights and responsibilities when using our platform.',
    keywords: 'terms of service, user agreement, legal, rights, responsibilities, platform usage',
    ogImage: '/img/linkpreview_image.jpg',
    ogType: 'website'
  }
};

// Course-specific SEO configuration
export const getCourseSEO = (courseData: {
  title: string;
  description: string;
  category: string;
  instructor: string;
  price: string;
  duration: string;
  level: string;
  slug: string;
}): PageSEOConfig => {
  return {
    title: `${courseData.title} - Digital Marketing Course`,
    description: courseData.description,
    keywords: `${courseData.title}, ${courseData.category}, digital marketing course, ${courseData.instructor}, online learning, ${courseData.level} level`,
    canonical: `/course/${courseData.slug}`,
    ogImage: `/img/courses/${courseData.slug}.jpg`,
    ogType: 'course'
  };
};

// Blog post-specific SEO configuration
export const getBlogPostSEO = (postData: {
  title: string;
  description: string;
  category: string;
  author: string;
  publishedDate: string;
  slug: string;
  tags: string[];
}): PageSEOConfig => {
  return {
    title: postData.title,
    description: postData.description,
    keywords: `${postData.title}, ${postData.category}, digital marketing, ${postData.tags.join(', ')}`,
    canonical: `/blog/${postData.slug}`,
    ogImage: `/img/blog/${postData.slug}.jpg`,
    ogType: 'article'
  };
};

// Instructor-specific SEO configuration
export const getInstructorSEO = (instructorData: {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  slug: string;
}): PageSEOConfig => {
  return {
    title: `${instructorData.name} - ${instructorData.title}`,
    description: instructorData.bio,
    keywords: `${instructorData.name}, ${instructorData.title}, ${instructorData.expertise.join(', ')}, digital marketing expert, instructor`,
    canonical: `/instructor/${instructorData.slug}`,
    ogImage: `/img/instructors/${instructorData.slug}.jpg`,
    ogType: 'profile'
  };
};

// SEO meta tags generator
export const generateSEOMetaTags = (config: PageSEOConfig) => {
  const fullTitle = `${config.title} | ${siteConfig.name}`;
  const fullCanonical = config.canonical ? `${siteConfig.url}${config.canonical}` : siteConfig.url;
  const fullOgImage = `${siteConfig.url}${config.ogImage || defaultSEO.ogImage}`;

  return {
    title: fullTitle,
    description: config.description,
    keywords: config.keywords || defaultSEO.keywords,
    canonical: fullCanonical,
    ogTitle: fullTitle,
    ogDescription: config.description,
    ogImage: fullOgImage,
    ogType: config.ogType || defaultSEO.ogType,
    ogUrl: fullCanonical,
    twitterTitle: fullTitle,
    twitterDescription: config.description,
    twitterImage: fullOgImage,
    twitterCard: config.twitterCard || defaultSEO.twitterCard,
    robots: `${config.noIndex ? 'noindex' : 'index'}, ${config.noFollow ? 'nofollow' : 'follow'}`
  };
};

// Social media sharing configuration
export const socialMediaConfig = {
  facebook: {
    appId: siteConfig.socialMedia.facebook.appId,
    pageId: siteConfig.socialMedia.facebook.pageId
  },
  twitter: {
    handle: siteConfig.socialMedia.twitter.handle,
    site: siteConfig.socialMedia.twitter.site
  },
  linkedin: {
    companyId: siteConfig.socialMedia.linkedin.companyId
  }
};

// Analytics configuration
export const analyticsConfig = {
  googleAnalytics: {
    measurementId: siteConfig.analytics.googleAnalytics.measurementId,
    debugMode: siteConfig.analytics.googleAnalytics.debugMode,
    config: {
      page_title: 'page_title',
      page_location: 'page_location',
      custom_map: {
        custom_dimension1: 'user_id',
        custom_dimension2: 'user_role',
        custom_dimension3: 'subscription_status'
      }
    }
  },
  googleTagManager: {
    containerId: siteConfig.analytics.googleTagManager.containerId
  },
  facebookPixel: {
    pixelId: siteConfig.analytics.facebookPixel.pixelId
  }
};

// Export all configurations
export default {
  siteConfig,
  defaultSEO,
  pageSEOConfigs,
  getCourseSEO,
  getBlogPostSEO,
  getInstructorSEO,
  generateSEOMetaTags,
  socialMediaConfig,
  analyticsConfig
};
