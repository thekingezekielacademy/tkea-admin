import React from 'react';
import { FaFileAlt, FaEdit, FaDownload, FaEye, FaLinkedin, FaGlobe } from 'react-icons/fa';
import SidebarLayout from '../components/SidebarLayout';

const Resume: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4 sm:mb-6">
              <FaFileAlt className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
              📄 Résumé Builder
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
              Create professional, ATS-friendly résumés that showcase your skills and experience. 
              Stand out to employers with our intelligent résumé builder.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
              <FaEdit className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-base sm:text-lg opacity-90">
              We're building an intelligent résumé builder. Get ready to create winning résumés!
            </p>
          </div>

          {/* What to Expect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaEye className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">ATS-Optimized</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Our résumé builder ensures your document passes Applicant Tracking Systems 
                and reaches human recruiters with proper formatting and keywords.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaEdit className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Smart Templates</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Choose from professional templates designed for different industries and roles. 
                Customize colors, fonts, and layouts to match your personal brand.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaLinkedin className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">LinkedIn Integration</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Import your LinkedIn profile data to automatically populate your résumé. 
                Keep your professional information synchronized across platforms.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaDownload className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Multiple Formats</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Export your résumé in multiple formats including PDF, Word, and plain text. 
                Perfect for different application requirements and platforms.
              </p>
            </div>
          </div>

          {/* Résumé Sections Preview */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Résumé Sections Preview</h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { section: 'Contact Info', name: 'Personal Details', description: 'Name, email, phone, location, and professional links', color: 'from-green-100 to-green-200' },
                { section: 'Summary', name: 'Professional Overview', description: 'Compelling introduction highlighting your value proposition', color: 'from-blue-100 to-blue-200' },
                { section: 'Experience', name: 'Work History', description: 'Detailed job descriptions with achievements and impact', color: 'from-purple-100 to-purple-200' },
                { section: 'Education', name: 'Academic Background', description: 'Degrees, certifications, and relevant coursework', color: 'from-orange-100 to-orange-200' },
                { section: 'Skills', name: 'Technical & Soft Skills', description: 'Relevant skills organized by category and proficiency', color: 'from-red-100 to-red-200' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                      <span className="font-semibold text-secondary-900 text-sm sm:text-base">{item.section}</span>
                      <span className="hidden sm:inline text-lg font-bold text-primary-600">•</span>
                      <span className="font-medium text-secondary-700 text-sm sm:text-base">{item.name}</span>
                    </div>
                    <p className="text-secondary-600 text-xs sm:text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Build Your Résumé?</h3>
              <p className="text-base sm:text-lg opacity-90 mb-4 sm:mb-6">
                While we're building the résumé builder, start building your skills 
                with our courses and prepare to showcase your expertise when the tool launches.
              </p>
              <button className="bg-white text-primary-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base">
                Start Learning
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Resume;
