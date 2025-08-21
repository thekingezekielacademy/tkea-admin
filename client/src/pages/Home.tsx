import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import { FaGraduationCap, FaStar, FaClock, FaUsers, FaLaptopCode, FaChartBar, FaPalette, FaGlobe, FaCheck, FaRocket, FaShieldAlt, FaAward, FaHeart, FaArrowRight } from 'react-icons/fa';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Subscription Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <FaRocket className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Premium Learning Experience
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-primary-900">
              Unlock All 25+ Courses for Just ₦2,500/month
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-primary-700 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
              Get unlimited access to our full library of 25+ expertly crafted courses designed to empower your skills and elevate your career.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaGraduationCap className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-primary-900">Learn at your own pace</h3>
              <p className="text-primary-600">24/7 access to all courses with lifetime updates</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaStar className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-primary-900">New courses regularly</h3>
              <p className="text-primary-600">Stay ahead with fresh, industry-relevant content</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaUsers className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-primary-900">Expert instructors</h3>
              <p className="text-primary-600">Learn from industry professionals and certified experts</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaCheck className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-primary-900">All skill levels</h3>
              <p className="text-primary-600">Perfect for beginners and advanced learners alike</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 text-center shadow-soft border border-primary-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-primary-900">
                Start your 7-day FREE trial today!
              </h3>
              <p className="text-lg sm:text-xl text-primary-600 mb-6 sm:mb-8">
                No commitment, cancel anytime. Join thousands of satisfied students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                <Link 
                  to="/profile" 
                  className="group bg-gradient-to-r from-primary-700 to-primary-900 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-soft hover:shadow-glow inline-flex items-center"
                >
                  <span className="mr-2">Subscribe Now — only ₦2,500/month</span>
                  <FaArrowRight className="inline h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link 
                  to="/courses" 
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-base sm:text-lg transition-colors duration-200 flex items-center"
                >
                  Browse All Courses
                  <FaArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                <FaAward className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Trusted by 10,000+ Students
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">
                Why Choose King Ezekiel Academy?
              </h2>
              <p className="text-base sm:text-lg text-primary-600 mb-8 sm:mb-10 leading-relaxed">
                We're committed to providing world-class education that empowers students to achieve their dreams. 
                Our comprehensive curriculum and expert instructors ensure you get the skills you need to succeed in today's digital economy.
              </p>
              
              {/* Stats */}
              <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-3xl p-6 sm:p-8 shadow-soft">
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                  <div className="text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FaGraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">10,000+</div>
                    <div className="text-xs sm:text-sm text-yellow-200 font-medium">Students Taught</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FaStar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">4.9/5</div>
                    <div className="text-xs sm:text-sm text-yellow-200 font-medium">Student Rating</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FaClock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">5+</div>
                    <div className="text-xs sm:text-sm text-yellow-200 font-medium">Years Experience</div>
                  </div>
                  <div className="text-center group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FaUsers className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1 sm:mb-2">95%</div>
                    <div className="text-xs sm:text-sm text-yellow-200 font-medium">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <FaHeart className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
              </div>
              <h4 className="text-xl sm:text-2xl font-semibold text-primary-900 mb-6 sm:mb-8">Why Students Love Us</h4>
              <div className="space-y-4 sm:space-y-6 text-left">
                <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-primary-50 rounded-xl">
                  <FaCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-primary-900 mb-1 text-sm sm:text-base">Comprehensive Course Library</h5>
                    <p className="text-primary-600 text-xs sm:text-sm">25+ courses covering all major digital skills</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-xl">
                  <FaCheck className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-primary-900 mb-1">Expert Instructors</h5>
                    <p className="text-primary-600 text-sm">Learn from industry professionals</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-xl">
                  <FaCheck className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-primary-900 mb-1">Flexible Learning Schedule</h5>
                    <p className="text-primary-600 text-sm">Study at your own pace, 24/7 access</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-xl">
                  <FaCheck className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-primary-900 mb-1">Career-Focused Curriculum</h5>
                    <p className="text-primary-600 text-sm">Skills that employers actually want</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-xl">
                  <FaCheck className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-primary-900 mb-1">Lifetime Access</h5>
                    <p className="text-primary-600 text-sm">Keep learning with course updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-secondary-50 to-primary-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 h-48 sm:w-64 sm:h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
          <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-48 h-48 sm:w-64 sm:h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <FaRocket className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Explore Our Programs
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900 mb-6 sm:mb-8">
              Our Learning Programs
            </h2>
            <p className="text-base sm:text-lg text-primary-600 max-w-3xl mx-auto leading-relaxed">
              Explore our diverse range of programs designed to help you master the skills needed in today's digital world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 hover:shadow-glow transition-all duration-300 border border-primary-100 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
                <FaLaptopCode className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-3 sm:mb-4">Technology & Innovation</h3>
              <p className="text-primary-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Master the latest technologies and programming languages to build innovative solutions.
              </p>
              <Link to="/courses" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:translate-x-1 transition-transform duration-200 text-sm sm:text-base">
                Explore Courses
                <FaArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 hover:shadow-glow transition-all duration-300 border border-primary-100 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
                <FaChartBar className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-3 sm:mb-4">Business & Leadership</h3>
              <p className="text-primary-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Develop essential business skills and leadership qualities for career advancement.
              </p>
              <Link to="/courses" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:translate-x-1 transition-transform duration-200">
                Explore Courses
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 hover:shadow-glow transition-all duration-300 border border-primary-100 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
                <FaPalette className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-3 sm:mb-4">Creative Arts</h3>
              <p className="text-primary-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Unleash your creativity with courses in design, multimedia, and artistic expression.
              </p>
              <Link to="/courses" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:translate-x-1 transition-transform duration-200">
                Explore Courses
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 hover:shadow-glow transition-all duration-300 border border-primary-100 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-300">
                <FaGlobe className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-primary-900 mb-3 sm:mb-4">Global Studies</h3>
              <p className="text-primary-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                Expand your worldview with courses on international relations and global perspectives.
              </p>
              <Link to="/courses" onClick={() => window.scrollTo(0, 0)} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold group-hover:translate-x-1 transition-transform duration-200">
                Explore Courses
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
