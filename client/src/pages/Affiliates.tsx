import React from 'react';
import { FaHandshake, FaUsers, FaChartLine, FaGift, FaRocket, FaTrophy } from 'react-icons/fa';
import SidebarLayout from '../components/SidebarLayout';

const Affiliates: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4 sm:mb-6">
              <FaHandshake className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
              💰 Affiliate Program
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
              Earn NGN 1,000 for every subscribed referral you bring! Join our affiliate program 
              and turn your network into a source of passive income.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 text-center text-white shadow-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
              <FaGift className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-base sm:text-lg opacity-90">
              We're building our affiliate platform. Get ready to start earning!
            </p>
          </div>

          {/* What to Expect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Referral Rewards</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Earn NGN 1,000 for every person you refer who subscribes to our platform. 
                Your earnings continue for a full year after each referral joins.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Passive Income</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Build a sustainable income stream as your referrals continue to use our platform. 
                The more people you help, the more you earn month after month.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaRocket className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Easy Promotion</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Get unique referral links, marketing materials, and tracking tools. 
                Promote our platform through your social networks and professional connections.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Performance Bonuses</h3>
              <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                Unlock additional bonuses and higher commission rates as you reach referral milestones. 
                The sky's the limit for top performers!
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft border border-primary-100 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-4 sm:mb-6 text-center">How It Works</h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { step: '1', action: 'Sign Up', description: 'Join our affiliate program and get your unique referral link', color: 'from-green-100 to-green-200' },
                { step: '2', action: 'Share', description: 'Share your referral link with friends, family, and professional network', color: 'from-blue-100 to-blue-200' },
                { step: '3', action: 'Earn', description: 'Get NGN 1,000 for each referral who subscribes', color: 'from-purple-100 to-purple-200' },
                { step: '4', action: 'Grow', description: 'Continue earning for 12 months after each referral joins', color: 'from-orange-100 to-orange-200' }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                      <span className="font-semibold text-secondary-900 text-sm sm:text-base">{item.action}</span>
                      <span className="hidden sm:inline text-lg font-bold text-primary-600">•</span>
                      <span className="font-medium text-secondary-700 text-sm sm:text-base">{item.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-white mb-8 sm:mb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-3 sm:mb-4">
                <FaHandshake className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Exclusive to Subscribers</h3>
              <p className="text-sm sm:text-base opacity-90">
                Our affiliate program is open only to active subscribers. 
                You must have an active subscription to participate and earn rewards.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Start Earning?</h3>
              <p className="text-base sm:text-lg opacity-90 mb-4 sm:mb-6">
                While we're building the affiliate platform, start building your network 
                and prepare to earn when the program launches.
              </p>
              <button className="bg-white text-primary-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Affiliates;
