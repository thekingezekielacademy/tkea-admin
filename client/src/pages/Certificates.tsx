import React from 'react';
import { FaGraduationCap, FaAward, FaCertificate, FaStar, FaCheckCircle, FaTrophy } from 'react-icons/fa';
import SidebarLayout from '../components/SidebarLayout';

const Certificates: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4 sm:mb-6">
              <FaGraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
              🎓 Certificates
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
              Earn recognized credentials that showcase your expertise and advance your career. 
              Our certificates are designed to be industry-relevant and employer-valued.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
              <FaAward className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-base sm:text-lg opacity-90">
              We're building a comprehensive certification system. Get ready to earn your credentials!
            </p>
          </div>

          {/* What to Expect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaCertificate className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Industry-Recognized Credentials</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Our certificates are designed in collaboration with industry experts and employers 
                to ensure they carry real value in the job market.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaStar className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Skill-Based Assessment</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Prove your expertise through practical assessments, real-world projects, 
                and comprehensive evaluations that test actual skills, not just memorization.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Verifiable & Shareable</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                All certificates include unique verification codes and can be easily shared 
                on LinkedIn, resumes, and professional portfolios.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Continuous Learning Path</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Certificates are part of a larger learning ecosystem, with advanced levels 
                and specializations to keep you growing and competitive.
              </p>
            </div>
          </div>

          {/* Certificate Types Preview */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Certificate Types Preview</h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { type: 'Foundation', name: 'Basic Skills', description: 'Essential knowledge and fundamental competencies', color: 'from-green-100 to-green-200' },
                { type: 'Professional', name: 'Advanced Skills', description: 'Intermediate expertise and practical applications', color: 'from-blue-100 to-blue-200' },
                { type: 'Expert', name: 'Specialized Skills', description: 'Deep knowledge in specific domains and advanced techniques', color: 'from-purple-100 to-purple-200' },
                { type: 'Master', name: 'Leadership Skills', description: 'Strategic thinking and industry leadership capabilities', color: 'from-orange-100 to-orange-200' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                      <span className="font-semibold text-secondary-900 text-sm sm:text-base">{item.type}</span>
                      <span className="hidden sm:inline text-lg font-bold text-primary-600">•</span>
                      <span className="font-medium text-secondary-700 text-sm sm:text-base">{item.name}</span>
                    </div>
                    <p className="text-secondary-600 text-xs sm:text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certification System Preview */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🏆 Certification System Preview</h3>
              <p className="text-base sm:text-lg opacity-90 mb-6">
                See the prestigious credentials and recognition system that will boost your career
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { metric: '4', label: 'Certificate Levels', description: 'Foundation to Master' },
                  { metric: '100%', label: 'Industry Recognized', description: 'Employer approved' },
                  { metric: 'Verifiable', label: 'Digital Badges', description: 'LinkedIn ready' },
                  { metric: 'Global', label: 'Recognition', description: 'Worldwide acceptance' }
                ].map((item, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{item.metric}</div>
                    <div className="text-sm text-white/80 mb-1">{item.label}</div>
                    <div className="text-xs text-white/60">{item.description}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm text-white/80 mb-2">💡 What You'll Achieve:</div>
                <div className="text-base font-semibold text-white">
                  Industry credentials + Skill validation + Career advancement + <span className="text-yellow-300 font-bold">Professional recognition</span>
                </div>
                <div className="text-xs text-white/60 mt-2">
                  *Coming soon - Start your courses now to be ready when certifications launch!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Certificates;
