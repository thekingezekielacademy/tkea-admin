import React from 'react';
import { FaStar, FaTrophy, FaRocket, FaChartLine, FaUsers, FaLightbulb } from 'react-icons/fa';
import SidebarLayout from '../components/SidebarLayout';

const Levels: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4 sm:mb-6">
              <FaStar className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
              🚀 Levels System
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
              Unlock your potential through our progressive learning journey. 
              Rise through the ranks and become a master of your craft.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
              <FaRocket className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-base sm:text-lg opacity-90">
              We're building something amazing. Get ready to level up your skills!
            </p>
          </div>

          {/* What to Expect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Progressive Learning Path</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Start from Level 1 and advance through increasingly challenging content. 
                Each level unlocks new courses, features, and opportunities.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Achievement Rewards</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Earn badges, certificates, and exclusive content as you progress. 
                Show off your accomplishments and build your professional portfolio.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Community Access</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Higher levels unlock access to exclusive study groups, mentorship programs, 
                and networking opportunities with industry professionals.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaLightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Skill Validation</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Prove your expertise through practical assessments and real-world projects. 
                Each level demonstrates your growing competence in your chosen field.
              </p>
            </div>
          </div>

          {/* Level Preview */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">Level System Preview</h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { level: 'Level 1', title: 'Foundation', description: 'Master the basics and build a solid foundation', color: 'from-green-100 to-green-200' },
                { level: 'Level 2', title: 'Intermediate', description: 'Develop practical skills and real-world applications', color: 'from-blue-100 to-blue-200' },
                { level: 'Level 3', title: 'Advanced', description: 'Tackle complex challenges and specialized topics', color: 'from-purple-100 to-purple-200' },
                { level: 'Level 4', title: 'Expert', description: 'Become a subject matter expert and thought leader', color: 'from-orange-100 to-orange-200' },
                { level: 'Level 5', title: 'Master', description: 'Achieve mastery and mentor others in your field', color: 'from-red-100 to-red-200' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                      <span className="font-semibold text-secondary-900 text-sm sm:text-base">{item.level}</span>
                      <span className="hidden sm:inline text-lg font-bold text-primary-600">•</span>
                      <span className="font-medium text-secondary-700 text-sm sm:text-base">{item.title}</span>
                    </div>
                    <p className="text-secondary-600 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Level Up?</h3>
              <p className="text-base sm:text-lg opacity-90 mb-4 sm:mb-6">
                Stay tuned for the launch of our revolutionary level system. 
                It's time to take your learning to the next level!
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 text-sm">
                <FaRocket className="w-4 h-4" />
                <span>Launching Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Levels;
