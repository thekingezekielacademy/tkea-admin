import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUsers, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: number;
  name: string;
  title: string;
  badge: string;
  badgeColor: string;
  subtitle: string;
  subtitleColor: string;
  image: string;
  alt: string;
  description: string[];
  stats: Array<{ value: string; label: string }>;
  statsColor: string;
}

const MiniMeetTheTeam: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Team data - same as About.tsx but simplified for mini view
  const teamMembers: TeamMember[] = [
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
        { value: "5K+", label: "Students Trained" },
        { value: "90%", label: "Success Rate" }
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

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % teamMembers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, teamMembers.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % teamMembers.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  // const currentMember = teamMembers[currentSlide]; // Not used in current implementation

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-secondary-50 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 h-48 sm:w-64 sm:h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-48 h-48 sm:w-64 sm:h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <FaUsers className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Meet Our Team
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">
            Meet the Team
          </h2>
          <p className="text-base sm:text-lg text-primary-600 max-w-3xl mx-auto leading-relaxed">
            Get to know the experts behind your learning journey. Our team of experienced professionals is dedicated to your success.
          </p>
        </div>

        {/* Mini Team Carousel */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {teamMembers.map((member) => (
                <div key={member.id} className="w-full flex-shrink-0">
                  <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mx-2 sm:mx-4 border border-primary-100">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={member.image}
                            alt={member.alt}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg"
                            loading="eager"
                            decoding="async"
                            crossOrigin="anonymous"
                            style={{ imageRendering: 'auto' } as React.CSSProperties}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `${member.image}?v=${Date.now()}`;
                            }}
                            onLoad={() => console.log(`Image loaded: ${member.name}`)}
                          />
                          <div className={`absolute -bottom-2 -right-2 px-2 py-1 ${member.badgeColor} text-white text-xs font-semibold rounded-full`}>
                            {member.badge}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-primary-900 mb-2">
                          {member.name}
                        </h3>
                        <p className={`text-sm sm:text-base font-medium mb-4 ${member.subtitleColor}`}>
                          {member.subtitle}
                        </p>
                        
                        {/* Brief description with "..." */}
                        <p className="text-primary-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                          {member.description[0].substring(0, 120)}...
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 mb-6">
                          {member.stats.map((stat, index) => (
                            <div key={index} className="text-center">
                              <div className={`text-lg sm:text-xl font-bold ${member.statsColor}`}>
                                {stat.value}
                              </div>
                              <div className="text-xs sm:text-sm text-primary-600">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Read More Button */}
                        <Link
                          to="/about"
                          onClick={() => window.scrollTo(0, 0)}
                          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                        >
                          Read More
                          <FaArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-primary-600 hover:text-primary-700 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 z-10"
            aria-label="Previous team member"
          >
            <FaChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-primary-600 hover:text-primary-700 rounded-full p-2 sm:p-3 shadow-lg transition-all duration-200 z-10"
            aria-label="Next team member"
          >
            <FaChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {teamMembers.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide
                    ? 'bg-primary-600 scale-125'
                    : 'bg-primary-300 hover:bg-primary-400'
                }`}
                aria-label={`Go to team member ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Full Team Link */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            to="/about"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <FaUsers className="mr-2 h-4 w-4" />
            Meet the Full Team
            <FaArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MiniMeetTheTeam;
