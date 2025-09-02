import React from 'react';
import SEOHead from '../components/SEO/SEOHead';
import { generatePersonStructuredData } from '../components/SEO/StructuredData';
import { FaGraduationCap, FaUsers, FaStar, FaAward, FaHeart, FaLightbulb, FaHandshake } from 'react-icons/fa';

const About: React.FC = () => {
  return (
    <>
      <SEOHead
        title="About King Ezekiel Academy"
        description="Learn about our mission to democratize digital marketing education. Founded by King Ezekiel, we've trained over 10,000 students worldwide with a 95% success rate."
        keywords="about us, King Ezekiel, digital marketing expert, education platform, mission, vision, success stories, Nigeria, Africa"
        canonical="/about"
        ogImage="/img/og-about.jpg"
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
                <p className="text-gray-700 leading-relaxed">
                  Even after all these milestones, I saw a gap in the educational sector. People don't just need affordable, high-quality knowledge — they also need a space to ask questions, connect with mentors, and grow together. This led me to design my next chapter: affordable, precise, and practical education with ongoing support for every learner — The King Ezekiel Academy.
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto px-4">
              {/* King Ezekiel */}
              <div className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                <div className="relative">
                  {/* Profile Image */}
                  <div className="w-full h-80 relative overflow-hidden">
                    <img 
                      src="/img/kingezekiel.jpg" 
                      alt="King Ezekiel - CEO & Founder"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  
                  {/* Floating badge */}
                  <div className="absolute top-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    CEO & Founder
                  </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3 text-center">King Ezekiel</h3>
                  <p className="text-primary-600 mb-6 text-lg font-semibold text-center">Digital Marketing Expert & Educator</p>
                  
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                      King Ezekiel is a dedicated educator and expert in Digital Marketing, and Digital Marketing Consultant. 
                      Through his K.E. Development movement, he has trained over 10,000 people for free, building a reputation 
                      for accessible, high-quality education.
                    </p>
                    <p>
                      With a thriving community of over 11,000 subscribers on both YouTube and Telegram, he shares valuable 
                      insights that have generated over 500,000 views. As the creator of over 30 practical courses, he has 
                      successfully mentored over 40,000 students and sold more than 60,000 copies in 4 years.
                    </p>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">10,000+</div>
                      <div className="text-sm text-gray-600">Students Trained</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">30+</div>
                      <div className="text-sm text-gray-600">Courses Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">500K+</div>
                      <div className="text-sm text-gray-600">YouTube Views</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Blessing Adima */}
              <div className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                <div className="relative">
                  {/* Profile Image */}
                  <div className="w-full h-80 relative overflow-hidden">
                    <img 
                      src="/img/blessingadima.jpg" 
                      alt="Blessing Adima - Digital Marketing Expert"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  
                  {/* Floating badge */}
                  <div className="absolute top-4 right-4 bg-secondary-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Guest Facilitator
                  </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3 text-center">Blessing Adima</h3>
                  <p className="text-secondary-600 mb-6 text-lg font-semibold text-center">Digital Marketing Expert & Business Coach</p>
                  
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p>
                      Blessing Adima is a Digital Marketing Expert and Business Coach with over 3 years of experience helping 
                      individuals and businesses harness the power of digital tools to grow, scale, and achieve measurable results.
                    </p>
                    <p>
                      She is passionate about digital transformation and has trained thousands of entrepreneurs, business owners, 
                      and professionals on how to leverage social media, online marketing, and digital strategies to attract 
                      clients and increase revenue.
                    </p>
                    <p>
                      Blessing specializes in social media marketing, online advertising, brand growth strategies, and digital 
                      monetization, with a mission to equip people with the right skills to thrive in today's fast-paced digital economy.
                    </p>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-600">3+</div>
                      <div className="text-sm text-gray-600">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-600">1000+</div>
                      <div className="text-sm text-gray-600">Entrepreneurs Trained</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-600">100%</div>
                      <div className="text-sm text-gray-600">Digital Focus</div>
                    </div>
                  </div>
                </div>
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
