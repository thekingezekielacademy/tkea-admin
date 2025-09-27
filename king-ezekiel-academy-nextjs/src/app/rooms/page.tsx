'use client';
import React from 'react';
import { FaComments, FaUsers, FaQuestionCircle, FaLightbulb, FaHandshake, FaRocket } from 'react-icons/fa';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useSidebar } from '@/contexts/SidebarContext';

const Rooms: React.FC = () => {
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
                <FaComments className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
                💬 Rooms: Q&A
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
                Join topic-specific discussion rooms where learners ask questions, share insights, 
                and collaborate with peers and mentors in real-time.
              </p>
            </div>

            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                <FaUsers className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
              <p className="text-base sm:text-lg opacity-90">
                We're building interactive Q&A rooms. Get ready to connect with learners worldwide!
              </p>
            </div>

            {/* What to Expect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaQuestionCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Topic-Specific Rooms</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Join rooms dedicated to specific subjects, technologies, or skill areas. 
                  Find answers from experts and learners who share your interests.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaHandshake className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Mentor Support</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Get guidance from industry professionals and experienced learners. 
                  Mentors actively participate in discussions and provide expert advice.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaLightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Real-Time Collaboration</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Engage in live discussions, share code snippets, and collaborate on projects. 
                  Build connections with learners who share your passion for growth.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaRocket className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Learning Acceleration</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Accelerate your learning by asking questions, helping others, and participating 
                  in discussions that deepen your understanding of complex topics.
                </p>
              </div>
            </div>

            {/* Room Types Preview */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Room Types Preview</h3>
              <div className="grid gap-3 sm:gap-4">
                {[
                  { type: 'General', name: 'Learning Support', description: 'General questions about courses, platform, and learning tips', color: 'from-green-100 to-green-200' },
                  { type: 'Technical', name: 'Code & Skills', description: 'Programming questions, debugging help, and technical discussions', color: 'from-blue-100 to-blue-200' },
                  { type: 'Career', name: 'Professional Growth', description: 'Career advice, job search tips, and industry insights', color: 'from-purple-100 to-purple-200' },
                  { type: 'Project', name: 'Collaboration', description: 'Find team members, share projects, and get feedback', color: 'from-orange-100 to-orange-200' }
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

            {/* Community Impact Preview */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🌟 Community Impact Preview</h3>
                <p className="text-base sm:text-lg opacity-90 mb-6">
                  See the incredible value you'll get from our interactive Q&A community
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { metric: '100+', label: 'Daily Questions', description: 'Answered by experts' },
                    { metric: '50+', label: 'Active Mentors', description: 'Industry professionals' },
                    { metric: '24/7', label: 'Support', description: 'Round-the-clock help' },
                    { metric: '1000+', label: 'Learners', description: 'Global community' }
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
                    Instant answers + Expert guidance + Global network + <span className="text-yellow-300 font-bold">Accelerated learning</span>
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    *Coming soon - Start your courses now to be ready when rooms launch!
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

export default Rooms;