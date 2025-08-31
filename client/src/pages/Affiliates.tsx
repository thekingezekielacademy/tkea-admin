import React from 'react';
import { FaHandshake, FaUsers, FaChartLine, FaGift, FaRocket, FaTrophy } from 'react-icons/fa';
import DashboardSidebar from '../components/DashboardSidebar';
import { useSidebar } from '../contexts/SidebarContext';

const Affiliates: React.FC = () => {
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
                <FaHandshake className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-900 mb-3 sm:mb-4">
                💰 Affiliate Program
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-secondary-600 max-w-2xl mx-auto px-2">
                Earn NGN 1,000 per month for every subscribed referral you bring! Join our affiliate program 
                and turn your network into a source of passive income for 12 months per referral.
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
                  Earn NGN 1,000 per month for every person you refer who subscribes to our platform. 
                  Your earnings continue for 12 months after each referral joins, as long as they stay subscribed.
                </p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-glow transition-all duration-300 border border-primary-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-3 sm:mb-4">Passive Income</h3>
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  Build a sustainable income stream as your referrals stay subscribed to our platform. 
                  Earn NGN 1,000 monthly for each active referral, creating consistent passive income.
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
                  { step: '3', action: 'Earn', description: 'Get NGN 1,000 monthly for each referral who subscribes', color: 'from-purple-100 to-purple-200' },
                  { step: '4', action: 'Grow', description: 'Continue earning monthly for 12 months as long as referrals stay subscribed', color: 'from-orange-100 to-orange-200' }
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

            {/* Exclusive to Subscribers */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-blue-200 mb-8 sm:mb-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
                  <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2">Exclusive to Subscribers</h3>
                <p className="text-sm sm:text-base text-blue-700">
                  Our affiliate program is exclusively available to subscribed users. 
                  <span className="font-semibold"> Earn NGN 1,000 monthly per referral</span> while maintaining your own subscription.
                </p>
              </div>
            </div>

            {/* Potential Earnings Calculator */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">💰 Potential Earnings Calculator</h3>
                <p className="text-base sm:text-lg opacity-90 mb-6">
                  See your potential monthly and annual earnings based on different referral numbers
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  {[
                    { referrals: '10', monthly: 'NGN 10,000', annual: 'NGN 120,000' },
                    { referrals: '25', monthly: 'NGN 25,000', annual: 'NGN 300,000' },
                    { referrals: '50', monthly: 'NGN 50,000', annual: 'NGN 600,000' },
                    { referrals: '75', monthly: 'NGN 75,000', annual: 'NGN 900,000' },
                    { referrals: '100', monthly: 'NGN 100,000', annual: 'NGN 1,200,000' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{item.referrals}</div>
                      <div className="text-sm text-white/80 mb-1">Referrals</div>
                      <div className="text-xs text-white/60 mb-2">Monthly: {item.monthly}</div>
                      <div className="text-xs text-white/60">Annual: {item.annual}</div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-2">💡 Example Calculation:</div>
                  <div className="text-base font-semibold text-white">
                    100 referrals × NGN 1,000 × 12 months = <span className="text-yellow-300 font-bold">NGN 1,200,000</span>
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    *Only available to subscribed users who stay subscribed
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

export default Affiliates;
