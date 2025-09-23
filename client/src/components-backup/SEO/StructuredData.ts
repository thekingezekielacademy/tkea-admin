/**
 * Enhanced Structured Data Schemas for SEO
 * 
 * This file contains comprehensive JSON-LD schemas for:
 * - Organization
 * - Course (enhanced with reviews, pricing, duration)
 * - Blog Post (enhanced with author, publisher, comments)
 * - Person (Instructor)
 * - Review (Course reviews)
 * - FAQ
 * - BreadcrumbList
 * - WebSite
 * - LocalBusiness
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
    validFrom?: string;
    validThrough?: string;
  };
  timeRequired?: string;
  educationalCredentialAwarded?: string;
  courseMode?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
  review?: ReviewStructuredData[];
  hasCourseInstance?: {
    "@type": "CourseInstance";
    courseMode: string;
    startDate?: string;
    endDate?: string;
  };
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
    image?: string;
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
  wordCount?: number;
  commentCount?: number;
  comment?: {
    "@type": "Comment";
    author: {
      "@type": "Person";
      name: string;
    };
    text: string;
    dateCreated: string;
  }[];
  breadcrumb?: BreadcrumbStructuredData;
}

export interface BreadcrumbStructuredData {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ReviewStructuredData {
  "@context": "https://schema.org";
  "@type": "Review";
  itemReviewed: {
    "@type": "Course" | "Organization";
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
    url?: string;
  };
  reviewBody: string;
  datePublished: string;
  reviewAspect?: string[];
  reviewTitle?: string;
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

export interface WebSiteStructuredData {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  potentialAction: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
  sameAs: string[];
}

export interface LocalBusinessStructuredData {
  "@context": "https://schema.org";
  "@type": "EducationalOrganization";
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  priceRange: string;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
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
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
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
  address?: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality: string;
  };
  award?: string[];
  honorificSuffix?: string;
}

/**
 * Generate enhanced Course structured data
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
    educationalLevel: courseData.educationalLevel || "Beginner to Advanced",
    courseMode: courseData.courseMode || "Online",
    timeRequired: courseData.timeRequired || "PT10H", // 10 hours
    offers: {
      "@type": "Offer",
      price: courseData.offers?.price || "2500",
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      validThrough: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 1250,
      bestRating: 5,
      worstRating: 1
    },
    ...courseData
  };
};

/**
 * Generate enhanced Blog Post structured data
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
      name: "King Ezekiel",
      url: "https://thekingezekielacademy.com/about"
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
    wordCount: postData.wordCount || 1500,
    commentCount: postData.commentCount || 0,
    ...postData
  };
};

/**
 * Generate Breadcrumb structured data
 */
export const generateBreadcrumbStructuredData = (
  breadcrumbs: Array<{ name: string; url: string }>
): BreadcrumbStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
};

/**
 * Generate WebSite structured data
 */
export const generateWebSiteStructuredData = (): WebSiteStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "King Ezekiel Academy",
    url: "https://thekingezekielacademy.com",
    description: "Leading digital marketing education platform",
    publisher: {
      "@type": "Organization",
      name: "King Ezekiel Academy",
      url: "https://thekingezekielacademy.com"
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://thekingezekielacademy.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    sameAs: [
      "https://www.youtube.com/@kingezekielacademy",
      "https://t.me/kingezekielacademy"
    ]
  };
};

/**
 * Generate LocalBusiness structured data
 */
export const generateLocalBusinessStructuredData = (): LocalBusinessStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "King Ezekiel Academy",
    description: "Leading digital marketing education platform",
    url: "https://thekingezekielacademy.com",
    telephone: "+234-XXX-XXX-XXXX",
    email: "info@thekingezekielacademy.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Digital Marketing Hub",
      addressLocality: "Lagos",
      addressRegion: "Lagos State",
      postalCode: "100001",
      addressCountry: "Nigeria"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 6.5244,
      longitude: 3.3792
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00"
      }
    ],
    priceRange: "₦₦₦",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 4.9,
      reviewCount: 2500
    }
  };
};

/**
 * Generate Review structured data
 */
export const generateReviewStructuredData = (
  reviewData: Partial<ReviewStructuredData>
): ReviewStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Course",
      name: reviewData.itemReviewed?.name || "Digital Marketing Course",
      url: reviewData.itemReviewed?.url || "https://thekingezekielacademy.com/courses"
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: reviewData.reviewRating?.ratingValue || 5,
      bestRating: 5,
      worstRating: 1
    },
    author: {
      "@type": "Person",
      name: reviewData.author?.name || "Student"
    },
    reviewBody: reviewData.reviewBody || "Excellent course with practical knowledge",
    datePublished: reviewData.datePublished || new Date().toISOString(),
    ...reviewData
  };
};

/**
 * Generate FAQ structured data
 */
export const generateFAQStructuredData = (
  faqs: Array<{ question: string; answer: string }>
): FAQStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
};

/**
 * Generate Organization structured data (enhanced)
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
    serviceType: ["Online Education", "Digital Marketing Training", "Business Coaching"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 4.9,
      reviewCount: 2500
    }
  };
};

/**
 * Generate Person structured data for King Ezekiel (enhanced)
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
    ],
    award: [
      "Digital Marketing Expert of the Year 2023",
      "Educational Leadership Award 2022"
    ],
    honorificSuffix: "MBA"
  };
};
