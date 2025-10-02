'use client';

import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaUsers, FaClock, FaStar, FaPlay, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Team data from MiniMeetTheTeam component
const teamMembers = [
  {
    id: 1,
    name: "King Ezekiel",
    title: "CEO & Founder",
    badge: "CEO & Founder",
    badgeColor: "bg-indigo-600",
    subtitle: "Digital Marketing Expert & Business Coach",
    subtitleColor: "text-indigo-600",
    image: "/img/kingezekiel.jpg?v=1.0.2",
    alt: "King Ezekiel - CEO & Founder",
    description: "King Ezekiel is a seasoned digital marketing expert and business coach with over 5 years of experience in the industry. He has helped thousands of entrepreneurs and businesses scale their operations through effective digital strategies.",
    stats: [
      { value: "5+", label: "Years Experience" },
      { value: "40K+", label: "Students Trained" },
      { value: "95%", label: "Success Rate" }
    ],
    statsColor: "text-indigo-600"
  },
  {
    id: 2,
    name: "Blessing Adima",
    title: "Guest Facilitator",
    badge: "Guest Facilitator",
    badgeColor: "bg-green-600",
    subtitle: "Digital Marketing Expert & Business Coach",
    subtitleColor: "text-green-600",
    image: "/img/blessingadima.jpg?v=1.0.2",
    alt: "Blessing Adima - Digital Marketing Expert",
    description: "Blessing Adima is a Digital Marketing Expert and Business Coach with over 3 years of experience helping individuals and businesses harness the power of digital tools to grow, scale, and achieve measurable results.",
    stats: [
      { value: "3+", label: "Years Experience" },
      { value: "1000+", label: "Businesses Helped" },
      { value: "90%", label: "Client Success" }
    ],
    statsColor: "text-green-600"
  },
  {
    id: 3,
    name: "John Ogechi",
    title: "Content Creator",
    badge: "Content Creator",
    badgeColor: "bg-purple-600",
    subtitle: "Social Media Content Creator & Content Writer",
    subtitleColor: "text-purple-600",
    image: "/img/ogechi.jpg?v=1.0.2",
    alt: "John Ogechi - Content Creator",
    description: "John Ogechi is a social media content creator and content writer passionate about crafting engaging stories that connect with audiences.",
    stats: [
      { value: "3+", label: "Years Experience" },
      { value: "100%", label: "Delivery Rate" },
      { value: "∞", label: "Creative Ideas" }
    ],
    statsColor: "text-purple-600"
  }
];

interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  instructor?: string;
  rating?: number;
  students?: number;
  cover_photo_url?: string;
  level?: string;
}

const JoinCommunityPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from database
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Query courses table - no is_published column, so we'll get all courses
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Transform the data to match our interface
        const transformedCourses = data.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category || 'general',
          instructor: course.instructor || 'King Ezekiel Academy',
          rating: course.rating || 4.8,
          students: course.students || course.enrolled_students || Math.floor(Math.random() * 1000) + 500,
          cover_photo_url: course.cover_photo_url || course.thumbnail_url || course.cover_url,
          level: course.level || 'beginner'
        }));

        // Shuffle the courses for random display
        const shuffled = [...transformedCourses].sort(() => Math.random() - 0.5);
        setCourses(shuffled);
      } else {
        // If no courses in database, show sample courses as fallback
        const sampleCourses = [
          { id: 'sample-1', title: 'Digital Marketing Fundamentals', instructor: 'King Ezekiel', rating: 4.9, students: 1250, category: 'digital-marketing', cover_photo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-2', title: 'Social Media Mastery', instructor: 'King Ezekiel', rating: 4.8, students: 980, category: 'social-media', cover_photo_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-3', title: 'Content Creation & Strategy', instructor: 'King Ezekiel', rating: 4.9, students: 1100, category: 'content-creation', cover_photo_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-4', title: 'Email Marketing Automation', instructor: 'King Ezekiel', rating: 4.7, students: 850, category: 'email-marketing', cover_photo_url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-5', title: 'SEO & Search Optimization', instructor: 'King Ezekiel', rating: 4.8, students: 920, category: 'seo', cover_photo_url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-6', title: 'Paid Advertising Mastery', instructor: 'King Ezekiel', rating: 4.9, students: 1050, category: 'paid-advertising', cover_photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-7', title: 'Analytics & Data Analysis', instructor: 'King Ezekiel', rating: 4.6, students: 750, category: 'analytics', cover_photo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-8', title: 'E-commerce Marketing', instructor: 'King Ezekiel', rating: 4.8, students: 890, category: 'ecommerce', cover_photo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-9', title: 'Video Marketing & YouTube', instructor: 'King Ezekiel', rating: 4.7, students: 820, category: 'video-marketing', cover_photo_url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=200&fit=crop&crop=center' },
          { id: 'sample-10', title: 'Brand Building & Management', instructor: 'King Ezekiel', rating: 4.9, students: 1150, category: 'branding', cover_photo_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop&crop=center' }
        ];
        
        const shuffled = [...sampleCourses].sort(() => Math.random() - 0.5);
        setCourses(shuffled);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRefreshCourses = () => {
    fetchCourses();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">King Ezekiel Academy</h1>
                <p className="text-sm text-gray-500">Digital Marketing Education</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Master 25+ Digital Skills
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              & Transform Your Career
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Join thousands of successful students who have transformed their careers with our comprehensive digital marketing courses. 
            Learn from industry experts and build the skills you need to succeed in today's digital world.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            <div className="flex items-center space-x-2">
              <FaUsers className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-900">10,000+ Students</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaClock className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">24/7 Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaStar className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-900">4.9/5 Rating</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chat.whatsapp.com/EuQ5053EKiK8CPahCXGCfq?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp className="w-6 h-6 mr-3" />
              Join WhatsApp Community
            </a>
            
            <Link
              href="/paybeforesignup"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaPlay className="w-6 h-6 mr-3" />
              Pay With Flutter - Instant Access
            </Link>
          </div>
        </div>
      </div>

      {/* Discover Our Newest Courses Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Discover Our Newest Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay ahead with our latest course additions, designed to keep you at the forefront of digital innovation.
            </p>
            <button
              onClick={handleRefreshCourses}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center mx-auto"
            >
              <FaArrowRight className="w-4 h-4 mr-2" />
              Refresh to see new courses
            </button>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={handleRefreshCourses}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100 overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 relative">
                    {course.cover_photo_url ? (
                      <img
                        src={course.cover_photo_url}
                        alt={course.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          // Fallback to gradient background if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                <svg class="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <FaPlay className="w-8 h-8 text-indigo-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {course.category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">by {course.instructor}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaStar className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-gray-600">{course.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">{course.students?.toLocaleString()} students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chat.whatsapp.com/EuQ5053EKiK8CPahCXGCfq?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp className="w-6 h-6 mr-3" />
              Join WhatsApp Community
            </a>
            
            <Link
              href="/paybeforesignup"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaPlay className="w-6 h-6 mr-3" />
              Pay With Flutter - Instant Access
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose King Ezekiel Academy Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose King Ezekiel Academy?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert-Led Courses</h3>
              <p className="text-gray-600">Learn from industry professionals with years of real-world experience</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Access</h3>
              <p className="text-gray-600">Learn at your own pace with lifetime access to all courses</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Support</h3>
              <p className="text-gray-600">Join our active community of learners and get support when you need it</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chat.whatsapp.com/EuQ5053EKiK8CPahCXGCfq?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp className="w-6 h-6 mr-3" />
              Join WhatsApp Community
            </a>
            
            <Link
              href="/paybeforesignup"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaPlay className="w-6 h-6 mr-3" />
              Pay With Flutter - Instant Access
            </Link>
          </div>
        </div>
      </div>

      {/* Mini Meet the Team Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">Learn from industry experts who are passionate about your success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {teamMembers.map((member) => (
              <div key={member.id} className="text-center">
                <div className="relative mb-6">
                  <img
                    src={member.image}
                    alt={member.alt}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                            <span class="text-4xl font-bold text-white">${member.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
                
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 text-sm font-medium ${member.badgeColor} text-white rounded-full mb-2`}>
                    {member.badge}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className={`text-sm font-medium ${member.subtitleColor}`}>{member.subtitle}</p>
                </div>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {member.description}
                </p>

                <div className="flex justify-center space-x-6">
                  {member.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-lg font-bold ${member.statsColor}`}>{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://chat.whatsapp.com/EuQ5053EKiK8CPahCXGCfq?mode=ems_copy_t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaWhatsapp className="w-6 h-6 mr-3" />
              Join WhatsApp Community
            </a>
            
            <Link
              href="/paybeforesignup"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FaPlay className="w-6 h-6 mr-3" />
              Pay With Flutter - Instant Access
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FaStar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">King Ezekiel Academy</h3>
          </div>
          <p className="text-gray-400">Transform your career with digital marketing skills</p>
        </div>
      </div>
    </div>
  );
};

export default JoinCommunityPage;
