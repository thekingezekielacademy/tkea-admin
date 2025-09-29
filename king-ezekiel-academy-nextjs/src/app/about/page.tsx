"use client";

import React, { useState, useEffect } from 'react';
import SEOHead from '@/components/SEO/SEOHead';
import { generatePersonStructuredData } from '@/components/SEO/StructuredData';
import { FaGraduationCap, FaUsers, FaStar, FaAward, FaHeart, FaLightbulb, FaHandshake, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const About: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Team data - easily expandable
  const teamMembers = [
    {
      id: 1,
      name: "King Ezekiel",
      title: "CEO & Founder",
      badge: "CEO & Founder",
      badgeColor: "bg-primary-600",
      subtitle: "Digital Marketing Expert & Business Coach",
      subtitleColor: "text-primary-600",
      image: "/img/kingezekiel.jpg?v=1.0.2",
      alt: "King Ezekiel - CEO & Founder",
      description: [
        "King Ezekiel is a seasoned digital marketing expert and business coach with over 5 years of experience in the industry. He has helped thousands of entrepreneurs and businesses scale their operations through effective digital strategies.",
        "As the founder of King Ezekiel Academy, he is passionate about democratizing digital marketing education and making it accessible to everyone, regardless of their background or experience level.",
        "King specializes in social media marketing, content creation, email marketing, and business automation, with a proven track record of helping businesses achieve 300% growth in their digital presence."
      ],
      stats: [
        { value: "5+", label: "Years Experience" },
        { value: "40K+", label: "Students Trained" },
        { value: "95%", label: "Success Rate" }
      ],
      statsColor: "text-primary-600"
    },
    {
      id: 2,
      name: "Blessing Adima",
      title: "Guest Facilitator",
      badge: "Guest Facilitator",
      badgeColor: "bg-secondary-600",
      subtitle: "Digital Marketing Expert & Business Coach",
      subtitleColor: "text-secondary-600",
      image: "/img/blessingadima.jpg?v=1.0.2",
      alt: "Blessing Adima - Digital Marketing Expert",
      description: [
        "Blessing Adima is a Digital Marketing Expert and Business Coach with over 3 years of experience helping individuals and businesses harness the power of digital tools to grow, scale, and achieve measurable results.",
        "She is passionate about digital transformation and has trained thousands of entrepreneurs, business owners, and professionals on how to leverage social media, online marketing, and digital strategies to attract clients and increase revenue.",
        "Blessing specializes in social media marketing, online advertising, brand growth strategies, and digital monetization, with a mission to equip people with the right skills to thrive in today's fast-paced digital economy."
      ],
      stats: [
        { value: "3+", label: "Years Experience" },
        { value: "1000+", label: "Entrepreneurs Trained" },
        { value: "100%", label: "Digital Focus" }
      ],
      statsColor: "text-secondary-600"
    },
    {
      id: 3,
      name: "John Ogechi",
      title: "Content Creator",
      badge: "Content Creator",
      badgeColor: "bg-accent-600",
      subtitle: "Social Media Content Creator & Content Writer",
      subtitleColor: "text-accent-600",
      image: "/img/ogechi.jpg?v=1.0.2",
      alt: "John Ogechi - Content Creator",
      description: [
        "John Ogechi is a social media content creator and content writer passionate about crafting engaging stories that connect with audiences.",
        "With 3 years of experience in e-Commerce product management and project coordination and 100% delivery rate, he brings creativity and strategy together to make ideas come alive.",
        "John specializes in creating compelling content that drives engagement, builds brand awareness, and converts audiences into loyal customers across various digital platforms."
      ],
      stats: [
        { value: "3+", label: "Years Experience" },
        { value: "100%", label: "Delivery Rate" },
        { value: "∞", label: "Creative Ideas" }
      ],
      statsColor: "text-accent-600"
    },
    {
      id: 4,
      name: "Honour Mokobia",
      title: "Guest Facilitator",
      badge: "Guest Facilitator",
      badgeColor: "bg-purple-600",
      subtitle: "Video Editor & Motion Graphics Designer",
      subtitleColor: "text-purple-600",
      image: "/img/honour.jpeg?v=1.0.2",
      alt: "Honour Mokobia - Video Editor & Motion Graphics Designer",
      description: [
        "Honour Mokobia is the creative force behind THE MIRACLE EDITOR Brand, a visionary video editor and motion graphics designer who has revolutionized how brands tell their stories through compelling visual content.",
        "With over 4 years of expertise in creative motion design and video editing, Honour has helped numerous top-tier brands gain unprecedented visibility and market their products through innovative visual storytelling.",
        "His mastery of motion graphics, video editing, and creative direction has earned him recognition as one of the industry's most sought-after visual content creators, with a proven track record of transforming brand narratives into engaging, conversion-driven visual experiences."
      ],
      stats: [
        { value: "4+", label: "Years Experience" },
        { value: "25+", label: "Brands Helped" },
        { value: "100%", label: "Creative Excellence" }
      ],
      statsColor: "text-purple-600"
    },
    {
      id: 5,
      name: "Precious Greg",
      title: "Guest Facilitator",
      badge: "Guest Facilitator",
      badgeColor: "bg-pink-600",
      subtitle: "Brand Marketing & Communications Strategist",
      subtitleColor: "text-pink-600",
      image: "/img/preciousgreg.jpeg?v=1.0.2",
      alt: "Precious Greg - Brand Marketing & Communications Strategist",
      description: [
        "Precious Greg is a Brand Marketing & Communications Strategist and a Corporate Event Host, also known as 'The CopyTalker.' She's also a News Anchor at AI Media Corner, bringing her expertise in strategic brand positioning and market dominance to help businesses achieve their goals through high-converting marketing and communications campaigns.",
        "As an Event Host, she helps businesses & individuals sell the idea of their event to the audience, through exquisite event organization, speech articulacy, audience engagement, stage management, and more to achieve the ultimate goal for the event. Her ability to connect with audiences and deliver compelling presentations makes her a sought-after facilitator.",
        "She's an upper second class graduate of Educational Management from the University of Benin, where she served as campus ambassador for Cowrywise and Myllash Web Services and a member & Director at Junior Chambers International, UNIBEN Chapter. She also kick-started and was an Editor-in-chief for a student based Magazine under an independent NGO in the University."
      ],
      stats: [
        { value: "5+", label: "Years Experience" },
        { value: "100+", label: "Awards & Recognition" },
        { value: "100%", label: "Event Excellence" }
      ],
      statsColor: "text-pink-600"
    },
    {
      id: 6,
      name: "Feyisara Ajagbe",
      title: "Email Marketing Expert & Executive Assistant",
      badge: "Email Marketing Expert",
      badgeColor: "bg-indigo-600",
      subtitle: "Email Marketing Expert & Executive Assistant",
      subtitleColor: "text-indigo-600",
      image: "/img/feyi.jpg?v=1.0.2",
      alt: "Feyisara Ajagbe - Email Marketing Expert & Executive Assistant",
      description: [
        "Feyisara Ajagbe is an Email Marketing Expert and Executive Assistant with over 3 years of experience helping businesses grow through strategic communication, campaign management, and efficient administrative support. She specializes in creating, organizing, and executing email campaigns that engage audiences and deliver measurable results, while also ensuring seamless coordination of schedules, workflows, and client communications.",
        "Passionate about blending creativity with structure, Feyisara combines her expertise in digital marketing, data-driven reporting, and executive support to drive productivity and business growth. Her strong attention to detail, adaptability, and commitment to excellence make her a valuable asset in both marketing initiatives and operational efficiency.",
        "Feyisara's comprehensive approach to email marketing and administrative excellence ensures that businesses not only reach their target audiences effectively but also maintain smooth operations and professional communication standards that drive long-term success."
      ],
      stats: [
        { value: "3+", label: "Years Experience" },
        { value: "100%", label: "Campaign Success" },
        { value: "∞", label: "Administrative Excellence" }
      ],
      statsColor: "text-indigo-600"
    }
  ];

  // Responsive slides: 1 on mobile, 2 on desktop
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const membersPerSlide = isMobile ? 1 : 2;
  const totalSlides = Math.ceil(teamMembers.length / membersPerSlide);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  return (
    <>
      <SEOHead
        title="About King Ezekiel Academy"
        description="Learn about our mission to democratize digital marketing education. Founded by King Ezekiel, we've trained over 10,000 students worldwide with a 95% success rate."
        keywords="about us, King Ezekiel, digital marketing expert, education platform, mission, vision, success stories, Nigeria, Africa"
        canonical="/about"
        ogImage="/img/link previewer.png"
        ogType="website"
        structuredData={generatePersonStructuredData()}
      />
      <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About King Ezekiel Academy
            </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Building the foundation for tomorrow's leaders with quality education and innovative learning experiences.
            </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              At King Ezekiel Academy, we believe in the transformative power of education. 
              Our mission is to empower students with the knowledge, skills, and confidence 
              they need to succeed in the digital age.
            </p>
            <p className="text-gray-600 mb-6">
              We strive to create an inclusive learning environment where every student can 
              discover their potential, develop critical thinking skills, and build a strong 
              foundation for their future careers.
            </p>
            <div className="flex items-center space-x-4">
              <FaHeart className="h-8 w-8 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">Passion for Education</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-gray-600 mb-6">
              We envision a world where quality education is accessible to everyone, regardless 
              of their background or circumstances. Our goal is to become a leading institution 
              in digital skills education.
            </p>
            <p className="text-gray-600 mb-6">
              Through innovative teaching methods, cutting-edge technology, and a commitment 
              to excellence, we aim to shape the next generation of digital professionals and 
              thought leaders.
            </p>
            <div className="flex items-center space-x-4">
              <FaLightbulb className="h-8 w-8 text-primary-600" />
              <span className="text-lg font-semibold text-gray-900">Innovation & Excellence</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaGraduationCap className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
            <div className="text-gray-600">Students Taught</div>
            </div>
            <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaUsers className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
            <div className="text-gray-600">Expert Instructors</div>
            </div>
            <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaStar className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600">Student Rating</div>
            </div>
            <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaAward className="h-12 w-12 text-primary-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGraduationCap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Excellence</h3>
              <p className="text-gray-600">
                We maintain the highest standards in education and continuously strive for 
                excellence in everything we do.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHandshake className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Integrity</h3>
              <p className="text-gray-600">
                We conduct ourselves with honesty, transparency, and ethical behavior in 
                all our interactions and decisions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600">
                We foster a supportive learning community where students can grow together 
                and support each other's success.
              </p>
            </div>
          </div>
        </div>

        {/* Journey */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-primary-900 mb-2">2021 – The Beginning</h3>
                <p className="text-gray-700 leading-relaxed">
                  Started with a simple mission: to make quality digital marketing education accessible to everyone. 
                  I began by creating free content on social media, sharing practical knowledge that people could 
                  immediately apply to their businesses.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-primary-900 mb-2">2022-2024 – Growth & Impact</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  During this period, I achieved several significant milestones:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Created and sold over 30 practical courses on digital marketing.</li>
                  <li>Built a community of over 40,000 students across various platforms.</li>
                  <li>Generated over ₦50 million in revenue through course sales and consulting.</li>
                  <li>Grew my Telegram channel to 8,000 active subscribers.</li>
                  <li>Reached over 500,000 views on YouTube with 9,000+ subscribers (all students).</li>
                  <li>Spent over ₦15 million on advertisements, reaching 5.7 million people across Nigeria.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-primary-900 mb-2">2025 – A Bigger Vision</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Even after all these milestones, I saw a gap in the educational sector. People don't just need affordable, high-quality knowledge — they also need a space to ask questions, connect with mentors, and grow together. This led me to design my next chapter: affordable, precise, and practical education with ongoing support for every learner — The King Ezekiel Academy.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Now, we're taking this vision to the next level by bringing more professionals on board and doing this bigger and better. We're focused on delivering more professionalism, better explanations, and enhanced learning experiences that truly transform our students' lives and careers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">Meet the Team</h2>
            <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
              Meet the passionate educators and digital marketing experts behind King Ezekiel Academy
            </p>
            
            {/* Team Carousel */}
            <div className="relative max-w-7xl mx-auto">
              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Previous team members"
              >
                <FaChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Next team members"
              >
                <FaChevronRight className="w-5 h-5" />
              </button>

              {/* Carousel Container */}
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Generate slides dynamically */}
                  {Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className={`grid gap-12 px-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                        {teamMembers
                          .slice(slideIndex * membersPerSlide, slideIndex * membersPerSlide + membersPerSlide)
                          .map((member) => (
                            <div key={member.id} className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                              <div className="relative">
                                {/* Profile Image */}
                                <div className="w-full h-80 relative overflow-hidden">
                                  <img 
                                    src={member.image} 
                                    alt={member.alt}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                    crossOrigin="anonymous"
                                    style={{
                                      imageRendering: 'auto'
                                    } as React.CSSProperties}
                                    onError={(e) => {
                                      console.log('Image failed to load:', member.image);
                                      // Try with cache busting
                                      const originalSrc = member.image.split('?')[0];
                                      e.currentTarget.src = originalSrc + '?t=' + Date.now() + '&retry=1';
                                    }}
                                    onLoad={() => {
                                      console.log('Image loaded successfully:', member.image);
                                    }}
                                  />
                                  {/* Overlay gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                                
                                {/* Floating badge */}
                                <div className={`absolute top-4 right-4 ${member.badgeColor} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg`}>
                                  {member.badge}
                                </div>
                              </div>
                              
                              <div className="p-8">
                                <h3 className="text-3xl font-bold text-gray-900 mb-3 text-center">{member.name}</h3>
                                <p className={`${member.subtitleColor} mb-6 text-lg font-semibold text-center`}>{member.subtitle}</p>
                                
                                <div className="space-y-4 text-gray-700 leading-relaxed">
                                  {member.description.map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                  ))}
                                </div>
                                
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
                                  {member.stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                      <div className={`text-2xl font-bold ${member.statsColor}`}>{stat.value}</div>
                                      <div className="text-sm text-gray-600">{stat.label}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: totalSlides }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentSlide 
                        ? 'bg-primary-600 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
    </div>
    </>
  );
};

export default About;