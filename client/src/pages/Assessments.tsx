import React from 'react';
import { FaClipboardList, FaBrain, FaChartBar, FaBullseye, FaLightbulb, FaTrophy } from 'react-icons/fa';
import DashboardSidebar from '../components/DashboardSidebar';
import { useSidebar } from '../contexts/SidebarContext';

const Assessments: React.FC = () => {
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
                <FaClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
                🧠 Smart Assessments
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
                Test your knowledge, track your progress, and identify areas for improvement 
                with our intelligent assessment system designed for effective learning.
              </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                <FaBrain className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
              <p className="text-base sm:text-lg opacity-90">
                We're building an intelligent assessment platform. Get ready to test your knowledge!
              </p>
            </div>

            {/* What to Expect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaBullseye className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Adaptive Testing</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Our AI-powered system adapts to your skill level, providing questions 
                  that challenge you appropriately and help you grow.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaChartBar className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Progress Analytics</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Get detailed insights into your performance, identify knowledge gaps, 
                  and track your improvement over time with comprehensive analytics.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaLightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Smart Feedback</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Receive personalized feedback on your answers, with explanations 
                  that help you understand concepts and learn from mistakes.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Achievement System</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Earn badges, certificates, and recognition as you complete assessments 
                  and demonstrate mastery of different skills and topics.
                </p>
              </div>
            </div>

            {/* Assessment Types Preview */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Assessment Types Preview</h3>
              <div className="grid gap-3 sm:gap-4">
                {[
                  { type: 'Quiz', name: 'Knowledge Check', description: 'Quick tests to reinforce learning and check understanding', color: 'from-green-100 to-green-200' },
                  { type: 'Practice', name: 'Skill Application', description: 'Hands-on exercises to apply what you\'ve learned', color: 'from-blue-100 to-blue-200' },
                  { type: 'Project', name: 'Real-world Tasks', description: 'Practical projects that simulate real work scenarios', color: 'from-purple-100 to-purple-200' },
                  { type: 'Final', name: 'Comprehensive Test', description: 'End-of-course assessments to validate complete mastery', color: 'from-orange-100 to-orange-200' }
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

            {/* Assessment Platform Preview */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🎯 Assessment Platform Preview</h3>
                <p className="text-base sm:text-lg opacity-90 mb-6">
                  See the powerful features that will revolutionize how you test and validate your skills
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { metric: 'AI', label: 'Adaptive Testing', description: 'Personalized questions' },
                    { metric: '100+', label: 'Question Types', description: 'Multiple formats' },
                    { metric: 'Real-time', label: 'Analytics', description: 'Instant feedback' },
                    { metric: '24/7', label: 'Availability', description: 'Test anytime' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{item.metric}</div>
                      <div className="text-sm text-white/80 mb-1">{item.label}</div>
                      <div className="text-xs text-white/60">{item.description}</div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-2">💡 What You'll Experience:</div>
                  <div className="text-base font-semibold text-white">
                    Personalized testing + Smart feedback + Progress tracking + <span className="text-yellow-300 font-bold">Skill validation</span>
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    *Coming soon - Start your courses now to be ready when assessments launch!
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

export default Assessments;
