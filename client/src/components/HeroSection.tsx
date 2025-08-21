import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaArrowRight, FaUsers, FaGraduationCap, FaStar, FaRocket, FaShieldAlt, FaClock, FaTimes } from 'react-icons/fa';

const HeroSection: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  
  return (
    <section className="relative bg-gradient-to-br from-white via-primary-50 to-secondary-50 text-primary-900 overflow-hidden mt-16 sm:mt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute top-20 sm:top-40 right-5 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-secondary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-4 sm:-bottom-8 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 xl:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-1 lg:order-1">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <FaRocket className="mr-2 h-4 w-4" />
              Transform Your Career Today
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8">
              Master Digital Skills
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary-600 to-primary-900 bg-clip-text text-transparent">
                Transform Your Future
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-700 mb-10 max-w-2xl leading-relaxed">
              Join 10,000+ students who have transformed their careers with our world-class digital skills courses. 
              Start your journey to success today.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start mb-8 sm:mb-12">
              <Link
                to="/courses"
                onClick={scrollToTop}
                className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-primary-900 text-white font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 transform hover:scale-105 text-base sm:text-lg"
              >
                <span className="mr-2">Start Learning Now</span>
                <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <button onClick={() => setShowVideo(true)} className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary-200 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg">
                <FaPlay className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
                Watch Our Story
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-6 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <span className="text-xs sm:text-sm text-primary-600 font-medium">Trusted by 10,000+ students</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <span className="text-xs sm:text-sm text-primary-600 font-medium">24/7 Access</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              <div className="text-center group">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                    <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-primary-900">10,000+</div>
                <div className="text-xs sm:text-sm text-primary-800 font-medium">Students Taught</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                    <FaGraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-primary-900">25+</div>
                <div className="text-xs sm:text-sm text-primary-800 font-medium">Courses Available</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                    <FaStar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-primary-900">4.9/5</div>
                <div className="text-xs sm:text-sm text-primary-800 font-medium">Student Rating</div>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                    <FaGraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-primary-900">₦2,500</div>
                <div className="text-xs sm:text-sm text-primary-800 font-medium">Per Month</div>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative order-2 lg:order-2">
            <div className="relative z-10">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border border-primary-100">
                                  <div className="text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-float">
                      <FaGraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-primary-900">Digital Skills Learning</h3>
                    <p className="text-primary-800 mb-6 sm:mb-8 leading-relaxed font-medium text-sm sm:text-base">
                      Master the most in-demand digital skills with our comprehensive, industry-aligned courses
                    </p>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-primary-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-primary-900 font-semibold">Web Development</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-primary-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-primary-900 font-semibold">Digital Marketing</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-primary-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-primary-900 font-semibold">UI/UX Design</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-primary-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-primary-900 font-semibold">Data Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-20 sm:h-20 bg-primary-200 rounded-full opacity-60 animate-float"></div>
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-12 h-12 sm:w-16 sm:h-16 bg-secondary-200 rounded-full opacity-60 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 -right-4 sm:-right-8 w-8 h-8 sm:w-12 sm:h-12 bg-accent-200 rounded-full opacity-60 animate-float" style={{animationDelay: '4s'}}></div>
          </div>
        </div>
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-auto">
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".1"
            fill="#092540"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".2"
            fill="#092540"
          ></path>
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="#092540"
          ></path>
        </svg>
      </div>

      {/* Video Modal Overlay */}
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowVideo(false)}
          aria-modal="true"
          role="dialog"
          aria-label="Watch Our Story"
        >
          <div
            className="relative w-full max-w-4xl bg-white/5 rounded-2xl shadow-2xl ring-1 ring-white/10 animate-[fadeIn_.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top controls */}
            <button
              aria-label="Close"
              className="absolute -top-10 right-0 text-white/90 hover:text-white transition p-2"
              onClick={() => setShowVideo(false)}
            >
              <FaTimes className="h-6 w-6" />
            </button>

            {/* Title */}
            <div className="px-4 pt-4 pb-2 text-center">
              <h3 className="text-white text-lg font-semibold tracking-wide">Our Story</h3>
            </div>

            {/* Video */}
            <div className="px-4 pb-4">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/ysz5S6PUM-U?autoplay=1&rel=0&modestbranding=1"
                  title="King Ezekiel Academy — Our Story"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Bottom close */}
            <div className="px-4 pb-5">
              <button
                onClick={() => setShowVideo(false)}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/90 hover:bg-white text-primary-800 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
