export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "King Ezekiel Academy",
    "description": "Transform your career with comprehensive digital marketing courses. Learn from industry experts and join 10,000+ successful students.",
    "url": "https://app.thekingezekielacademy.com",
    "logo": "https://app.thekingezekielacademy.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+234-810-169-2624",
      "contactType": "customer service",
      "areaServed": "NG",
      "availableLanguage": "English"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressCountry": "Nigeria"
    },
    "sameAs": [
      "https://www.facebook.com/thekingezekielacademy",
      "https://www.instagram.com/thekingezekielacademy",
      "https://t.me/kingezekielfreetraining"
    ]
  };
};

export const generatePersonStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "King Ezekiel",
    "jobTitle": "CEO & Founder",
    "description": "Digital Marketing Expert & Business Coach with over 5 years of experience helping thousands of entrepreneurs and businesses scale their operations through effective digital strategies.",
    "url": "https://app.thekingezekielacademy.com",
    "image": "https://app.thekingezekielacademy.com/img/kingezekiel.jpg",
    "sameAs": [
      "https://www.facebook.com/thekingezekielacademy",
      "https://www.instagram.com/thekingezekielacademy",
      "https://t.me/kingezekielfreetraining"
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "King Ezekiel Academy"
    },
    "knowsAbout": [
      "Digital Marketing",
      "Social Media Marketing",
      "Content Creation",
      "Email Marketing",
      "Business Automation"
    ]
  };
};

export const generateLocalBusinessStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "King Ezekiel Academy",
    "description": "Digital Marketing Education Platform",
    "url": "https://app.thekingezekielacademy.com",
    "telephone": "+234-810-169-2624",
    "email": "info@thekingezekielacademy.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressCountry": "Nigeria"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+234-810-169-2624",
      "contactType": "customer service",
      "areaServed": "NG",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.facebook.com/thekingezekielacademy",
      "https://www.instagram.com/thekingezekielacademy",
      "https://t.me/kingezekielfreetraining"
    ]
  };
};

export const generateBlogPostStructuredData = (blogPost: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blogPost.title,
    "description": blogPost.excerpt,
    "image": blogPost.featured_image_url,
    "author": {
      "@type": "Organization",
      "name": "King Ezekiel Academy"
    },
    "publisher": {
      "@type": "Organization",
      "name": "King Ezekiel Academy",
      "logo": {
        "@type": "ImageObject",
        "url": "https://app.thekingezekielacademy.com/logo.png"
      }
    },
    "datePublished": blogPost.created_at,
    "dateModified": blogPost.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://app.thekingezekielacademy.com/blog/${blogPost.slug}`
    }
  };
};
