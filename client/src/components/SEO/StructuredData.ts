/**
 * Structured Data Schemas for SEO
 * 
 * This file contains JSON-LD schemas for different content types:
 * - Organization
 * - Course
 * - Blog Post
 * - Person (Instructor)
 * - Review
 * - FAQ
 * 
 * These schemas help search engines understand your content better
 * and can improve rich snippet appearances in search results.
 */

export interface CourseStructuredData {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  instructor: {
    "@type": "Person";
    name: string;
    jobTitle: string;
    description: string;
  };
  coursePrerequisites?: string;
  educationalLevel?: string;
  inLanguage: string;
  isAccessibleForFree: boolean;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
  };
  timeRequired?: string;
  educationalCredentialAwarded?: string;
  courseMode?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export interface BlogPostStructuredData {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  image?: {
    "@type": "ImageObject";
    url: string;
    width?: number;
    height?: number;
  };
  articleBody?: string;
  keywords?: string;
  url: string;
}

export interface OrganizationStructuredData {
  "@context": "https://schema.org";
  "@type": "EducationalOrganization";
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  logo: {
    "@type": "ImageObject";
    url: string;
  };
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    telephone: string;
    email: string;
    contactType: string;
  };
  address: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality: string;
    addressRegion: string;
  };
  founder: {
    "@type": "Person";
    name: string;
    jobTitle: string;
    description: string;
  };
  foundingDate: string;
  numberOfEmployees?: string;
  areaServed: string[];
  serviceType: string[];
}

export interface PersonStructuredData {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  image?: string;
  jobTitle: string;
  worksFor: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  knowsAbout: string[];
  hasCredential?: string[];
  alumniOf?: {
    "@type": "EducationalOrganization";
    name: string;
  };
  sameAs: string[];
  email?: string;
  telephone?: string;
}

export interface ReviewStructuredData {
  "@context": "https://schema.org";
  "@type": "Review";
  itemReviewed: {
    "@type": "Course";
    name: string;
    url: string;
  };
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
  author: {
    "@type": "Person";
    name: string;
  };
  reviewBody: string;
  datePublished: string;
  reviewAspect?: string[];
}

export interface FAQStructuredData {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Generate Course structured data
 */
export const generateCourseStructuredData = (
  courseData: Partial<CourseStructuredData>
): CourseStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseData.name || "Digital Marketing Course",
    description: courseData.description || "Comprehensive digital marketing course",
    provider: {
      "@type": "Organization",
      name: "King Ezekiel Academy",
      url: "https://thekingezekielacademy.com"
    },
    instructor: {
      "@type": "Person",
      name: "King Ezekiel",
      jobTitle: "Digital Marketing Expert & Educator",
      description: "Experienced digital marketing consultant and educator"
    },
    inLanguage: "en",
    isAccessibleForFree: false,
    url: courseData.url || "https://thekingezekielacademy.com/courses",
    ...courseData
  };
};

/**
 * Generate Blog Post structured data
 */
export const generateBlogPostStructuredData = (
  postData: Partial<BlogPostStructuredData>
): BlogPostStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: postData.headline || "Blog Post",
    description: postData.description || "Educational blog post",
    author: {
      "@type": "Person",
      name: "King Ezekiel"
    },
    publisher: {
      "@type": "Organization",
      name: "King Ezekiel Academy",
      logo: {
        "@type": "ImageObject",
        url: "https://thekingezekielacademy.com/logo.png"
      }
    },
    datePublished: postData.datePublished || new Date().toISOString(),
    dateModified: postData.dateModified || new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postData.url || "https://thekingezekielacademy.com/blog"
    },
    url: postData.url || "https://thekingezekielacademy.com/blog",
    ...postData
  };
};

/**
 * Generate Organization structured data
 */
export const generateOrganizationStructuredData = (): OrganizationStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "King Ezekiel Academy",
    description: "Leading digital marketing education platform providing comprehensive courses and training for entrepreneurs and professionals.",
    url: "https://thekingezekielacademy.com",
    logo: {
      "@type": "ImageObject",
      url: "https://thekingezekielacademy.com/logo.png"
    },
    sameAs: [
      "https://www.youtube.com/@kingezekielacademy",
      "https://t.me/kingezekielacademy"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+234-XXX-XXX-XXXX",
      email: "info@thekingezekielacademy.com",
      contactType: "Customer Service"
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "Nigeria",
      addressLocality: "Lagos",
      addressRegion: "Lagos State"
    },
    founder: {
      "@type": "Person",
      name: "King Ezekiel",
      jobTitle: "CEO & Founder",
      description: "Digital Marketing Expert and Educator"
    },
    foundingDate: "2021",
    areaServed: ["Nigeria", "Africa", "Worldwide"],
    serviceType: ["Online Education", "Digital Marketing Training", "Business Coaching"]
  };
};

/**
 * Generate Person structured data for King Ezekiel
 */
export const generatePersonStructuredData = (): PersonStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "King Ezekiel",
    description: "Digital Marketing Expert, Educator, and Founder of King Ezekiel Academy. Specializing in digital marketing, e-commerce, and business growth strategies.",
    url: "https://thekingezekielacademy.com/about",
    jobTitle: "CEO & Founder, Digital Marketing Expert",
    worksFor: {
      "@type": "Organization",
      name: "King Ezekiel Academy",
      url: "https://thekingezekielacademy.com"
    },
    knowsAbout: [
      "Digital Marketing",
      "E-commerce",
      "Business Growth",
      "Online Education",
      "Social Media Marketing",
      "Content Marketing"
    ],
    hasCredential: [
      "Digital Marketing Certification",
      "Business Management",
      "Educational Leadership"
    ],
    sameAs: [
      "https://www.youtube.com/@kingezekielacademy",
      "https://t.me/kingezekielacademy"
    ]
  };
};
