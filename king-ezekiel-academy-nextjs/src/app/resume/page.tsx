'use client';
import React from 'react';
import { FaFileAlt, FaEdit, FaDownload, FaShare, FaEye, FaLinkedin } from 'react-icons/fa';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useSidebar } from '@/contexts/SidebarContext';

const Resume: React.FC = () => {
  const { isExpanded, isMobile } = useSidebar();

  // Calculate dynamic margin based on sidebar state
  const getSidebarMargin = () => {
    if (isMobile) return 'ml-16'; // Mobile always uses collapsed width
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
        {/* Account for navbar height */}
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4 sm:mb-6">
                <FaFileAlt className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
                📄 Resume Builder
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
                Create professional, ATS-optimized resumes that showcase your skills and experience. 
                Stand out to employers with our intelligent resume builder and expert templates.
              </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                <FaEdit className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
              <p className="text-base sm:text-lg opacity-90">
                We're building an intelligent resume builder. Get ready to create winning resumes!
              </p>
            </div>

            {/* What to Expect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaEye className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">ATS Optimization</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Our builder ensures your resume passes Applicant Tracking Systems with 
                  proper formatting, keywords, and structure that recruiters love.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaDownload className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Professional Templates</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Choose from industry-specific templates designed by HR professionals 
                  to maximize your chances of landing interviews.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaLinkedin className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">LinkedIn Integration</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Seamlessly sync your LinkedIn profile data and maintain consistency 
                  across all your professional materials.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaShare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Multiple Formats</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Export your resume in multiple formats including PDF, Word, and plain text, 
                  ensuring compatibility with any application system.
                </p>
              </div>
            </div>

            {/* Resume Types Preview */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Resume Types Preview</h3>
              <div className="grid gap-3 sm:gap-4">
                {[
                  { type: 'Chronological', name: 'Traditional', description: 'Classic format highlighting work experience', color: 'from-green-100 to-green-200' },
                  { type: 'Functional', name: 'Skills-Based', description: 'Emphasizes skills over work history', color: 'from-blue-100 to-blue-200' },
                  { type: 'Combination', name: 'Hybrid', description: 'Balances skills and experience', color: 'from-purple-100 to-purple-200' },
                  { type: 'Targeted', name: 'Custom', description: 'Tailored for specific job positions', color: 'from-orange-100 to-orange-200' }
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

            {/* Resume Builder Preview */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">📝 Resume Builder Preview</h3>
                <p className="text-base sm:text-lg opacity-90 mb-6">
                  See the powerful tools and features that will help you create resumes that get you hired
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { metric: 'ATS', label: 'Optimized', description: 'Pass tracking systems' },
                    { metric: '20+', label: 'Templates', description: 'Professional designs' },
                    { metric: 'LinkedIn', label: 'Integration', description: 'Sync profile data' },
                    { metric: '3+', label: 'Formats', description: 'PDF, Word, Text' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{item.metric}</div>
                      <div className="text-sm text-white/80 mb-1">{item.label}</div>
                      <div className="text-xs text-white/60">{item.description}</div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-2">💡 What You'll Create:</div>
                  <div className="text-base font-semibold text-white">
                    ATS-optimized resumes + Professional templates + LinkedIn sync + <span className="text-yellow-300 font-bold">Interview success</span>
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    *Coming soon - Start your courses now to be ready when the resume builder launches!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;