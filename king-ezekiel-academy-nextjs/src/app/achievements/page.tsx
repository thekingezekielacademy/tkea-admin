'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProgressService } from '@/services/progressService';
import { createClient } from '@/lib/supabase';
import { secureLog, secureError } from '@/utils/secureLogger';
import { 
  FaTrophy, 
  FaStar, 
  FaFire, 
  FaGraduationCap,
  FaChartLine,
  FaAward,
  FaGem,
  FaHeart
} from 'react-icons/fa';

// Types
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'social' | 'special';
  xpReward: number;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  xp: number;
  streak_count: number;
  level: number;
  total_achievements: number;
  achievements_earned: number;
}

const Achievements = React.memo(() => {
  const { user } = useAuth();
  const { getSidebarMargin } = useSidebar();
  
  // State
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    streak_count: 0,
    level: 1,
    total_achievements: 0,
    achievements_earned: 0
  });
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Memoized helper functions to prevent recreation on every render
  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'streak':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'social':
        return 'bg-pink-50 border-pink-200 text-pink-800';
      case 'special':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }, []);

  const getProgressColor = useCallback((progress: number, maxProgress: number) => {
    const percentage = (progress / maxProgress) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  }, []);

  const getAchievementIcon = useCallback((category: string) => {
    switch (category) {
      case 'learning':
        return '📚';
      case 'streak':
        return '🔥';
      case 'social':
        return '👥';
      case 'special':
        return '⭐';
      default:
        return '🏆';
    }
  }, []);

  // Optimized achievement generation with memoization
  const generateDynamicAchievements = useCallback((profile: any, courses: any[], lessons: any[]) => {
    const achievements: Achievement[] = [];
    
    // Learning Achievements - Reduced from 5 to 3 key milestones
    if (lessons && lessons.length > 0) {
      const completedLessons = lessons.filter(l => l.status === 'completed');
      const totalCompleted = completedLessons.length;
      
      // First Steps
      if (totalCompleted > 0) {
        achievements.push({
          id: 'first-steps',
          title: 'First Steps',
        description: 'Complete your first lesson',
          icon: '🎬',
          category: 'learning',
          xpReward: 50,
          earned: true,
          earnedDate: completedLessons[0]?.completed_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
      } else {
        achievements.push({
          id: 'first-steps',
          title: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎬',
          category: 'learning',
          xpReward: 50,
          earned: false
        });
      }

      // Key lesson milestones - Only 3 instead of 5
      const lessonMilestones = [10, 25, 50];
      lessonMilestones.forEach((milestone, index) => {
        if (totalCompleted >= milestone) {
          achievements.push({
            id: `lesson-${milestone}`,
            title: `Lesson ${milestone}`,
            description: `Complete ${milestone} lessons`,
            icon: '🎯',
            category: 'learning',
            xpReward: 50 + (index * 25),
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `lesson-${milestone}`,
            title: `Lesson ${milestone}`,
            description: `Complete ${milestone} lessons`,
            icon: '🎯',
            category: 'learning',
            xpReward: 50 + (index * 25),
            earned: false,
            progress: totalCompleted,
            maxProgress: milestone
          });
        }
      });
    }

    // Course Achievements - Reduced from 5 to 3 key milestones
    if (courses && courses.length > 0) {
      const totalCourses = courses.length;
      const courseMilestones = [1, 3, 5];
      
      courseMilestones.forEach((milestone, index) => {
        if (totalCourses >= milestone) {
          achievements.push({
            id: `course-${milestone}`,
            title: `Course ${milestone}`,
            description: `Enroll in ${milestone} course${milestone > 1 ? 's' : ''}`,
            icon: '📚',
            category: 'learning',
            xpReward: 100 + (index * 50),
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `course-${milestone}`,
            title: `Course ${milestone}`,
            description: `Enroll in ${milestone} course${milestone > 1 ? 's' : ''}`,
            icon: '📚',
            category: 'learning',
            xpReward: 100 + (index * 50),
            earned: false,
            progress: totalCourses,
            maxProgress: milestone
          });
        }
      });

      // Course Completion - Only 2 key milestones
      const completedCourses = courses.filter(course => course.status === 'completed').length;
      const completionMilestones = [1, 3];
      
      completionMilestones.forEach((milestone, index) => {
        if (completedCourses >= milestone) {
          achievements.push({
            id: `complete-${milestone}`,
            title: `Course Master ${milestone}`,
            description: `Complete ${milestone} course${milestone > 1 ? 's' : ''}`,
            icon: '🏆',
            category: 'learning',
            xpReward: 200 + (index * 100),
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `complete-${milestone}`,
            title: `Course Master ${milestone}`,
            description: `Complete ${milestone} course${milestone > 1 ? 's' : ''}`,
          icon: '🏆',
          category: 'learning',
            xpReward: 200 + (index * 100),
            earned: false,
            progress: completedCourses,
            maxProgress: milestone
          });
        }
      });
    }

    // Streak Achievements - Reduced from 6 to 3 key milestones
    if (profile) {
      const currentStreak = profile.streak_count || 0;
      const streakMilestones = [7, 30, 100];
      
      streakMilestones.forEach((milestone, index) => {
        if (currentStreak >= milestone) {
          achievements.push({
            id: `streak-${milestone}`,
            title: `${milestone} Day Streak`,
            description: `Maintain a ${milestone}-day learning streak`,
        icon: '🔥',
          category: 'streak',
            xpReward: 100 + (index * 100),
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `streak-${milestone}`,
            title: `${milestone} Day Streak`,
            description: `Maintain a ${milestone}-day learning streak`,
            icon: '🔥',
          category: 'streak',
            xpReward: 100 + (index * 100),
            earned: false,
            progress: currentStreak,
            maxProgress: milestone
          });
        }
      });
      
      // XP and Level Achievements - Reduced significantly
      const currentXP = profile.xp || 0;
      const currentLevel = profile.level || 1;
      
      // XP milestones - Only 4 key ones
      const xpMilestones = [100, 500, 1000, 2500];
      xpMilestones.forEach((milestone, index) => {
        if (currentXP >= milestone) {
          achievements.push({
            id: `xp-collector-${milestone}`,
            title: `${milestone} XP Collector`,
            description: `Earn ${milestone} total XP`,
            icon: '💎',
            category: 'special',
            xpReward: 0,
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `xp-collector-${milestone}`,
            title: `${milestone} XP Collector`,
            description: `Earn ${milestone} total XP`,
          icon: '💎',
            category: 'special',
            xpReward: 50 + (index * 25),
            earned: false,
            progress: currentXP,
            maxProgress: milestone
          });
        }
      });
      
      // Level milestones - Only 3 key ones
      const levelMilestones = [5, 10, 25];
      levelMilestones.forEach((milestone, index) => {
        if (currentLevel >= milestone) {
          achievements.push({
            id: `level-master-${milestone}`,
            title: `Level ${milestone} Master`,
            description: `Reach level ${milestone}`,
            icon: '⭐',
            category: 'special',
            xpReward: 100 + (index * 100),
            earned: true,
            earnedDate: new Date().toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: `level-master-${milestone}`,
            title: `Level ${milestone} Master`,
            description: `Reach level ${milestone}`,
          icon: '⭐',
            category: 'special',
            xpReward: 100 + (index * 100),
            earned: false,
            progress: currentLevel,
            maxProgress: milestone
          });
        }
      });

      // Special achievements - Only 2 key ones
      const joinDate = new Date(profile.created_at);
      const firstMonth = new Date('2024-01-01');
      if (joinDate <= firstMonth) {
        achievements.push({
          id: 'early-bird',
          title: 'Early Bird',
          description: 'Join the academy in its first month',
          icon: '🌅',
          category: 'special',
          xpReward: 250,
          earned: true,
          earnedDate: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
      } else {
        achievements.push({
          id: 'early-bird',
          title: 'Early Bird',
          description: 'Join the academy in its first month',
          icon: '🌅',
          category: 'special',
          xpReward: 250,
          earned: false
        });
      }

      const lastActivity = profile.last_activity_date;
      if (lastActivity) {
        // Use a consistent date calculation to prevent hydration mismatches
        const now = new Date();
        const lastActivityDate = new Date(lastActivity);
        const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceActivity <= 1) {
          achievements.push({
            id: 'daily-learner',
            title: 'Daily Learner',
            description: 'Learn something new today',
            icon: '📅',
            category: 'special',
            xpReward: 50,
            earned: true,
            earnedDate: now.toISOString().split('T')[0]
          });
        } else {
          achievements.push({
            id: 'daily-learner',
            title: 'Daily Learner',
            description: 'Learn something new today',
            icon: '📅',
            category: 'special',
            xpReward: 50,
            earned: false
          });
        }
      }
    }

    return achievements;
  }, []);

  // User data state
  const [profileData, setProfileData] = useState<any>(null);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);

  // Data fetching
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const supabase = createClient();
      // Fetch profile data including XP and streak_count from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp, streak_count, last_activity_date, created_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        secureLog('Error fetching profile data:', profileError);
      }

      // Default values if profile doesn't exist or missing fields
      const xp = profile?.xp || 0;
      const streak_count = profile?.streak_count || 0;
      const level = Math.floor(xp / 1000) + 1; // Calculate level based on XP
      const created_at = profile?.created_at || user?.created_at || new Date().toISOString();
      const last_activity_date = profile?.last_activity_date || user?.updated_at || new Date().toISOString();

      const userProfileData = {
        xp,
        streak_count,
        level,
        created_at,
        last_activity_date
      };
      setProfileData(userProfileData);

      // Fetch real course and lesson progress data
      const [courseProgressData, lessonProgressData] = await Promise.all([
        ProgressService.getUserCourseProgress(user.id),
        ProgressService.getUserLessonProgress(user.id)
      ]);

      setCourseProgress(courseProgressData);
      setLessonProgress(lessonProgressData);

      // Generate dynamic achievements based on real data
      const dynamicAchievements = generateDynamicAchievements(
        userProfileData,
        courseProgressData,
        lessonProgressData
      );
      
      setAchievements(dynamicAchievements);

      // Update stats with real achievement data
      setUserStats({
        xp: userProfileData.xp,
        streak_count: userProfileData.streak_count,
        level: userProfileData.level,
        total_achievements: dynamicAchievements.length,
        achievements_earned: dynamicAchievements.filter(a => a.earned).length
      });

    } catch (error) {
      secureError('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user, generateDynamicAchievements]);

  // Memoized filtered achievements to prevent recalculation
  const filteredAchievements = useMemo(() => {
    return {
      learning: achievements.filter(a => a.category === 'learning'),
      streak: achievements.filter(a => a.category === 'streak'),
      social: achievements.filter(a => a.category === 'social'),
      special: achievements.filter(a => a.category === 'special')
    };
  }, [achievements]);

  // Effects
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen bg-gray-50 ${getSidebarMargin()} transition-all duration-300`} suppressHydrationWarning>
          <div className="flex items-center justify-center min-h-screen pt-16">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your achievements...</p>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 ${getSidebarMargin()} transition-all duration-300`} suppressHydrationWarning>
          {/* Header */}
        <div className="bg-white shadow-sm border-b pt-16">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  Your Achievements 🏆
            </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  Track your progress and unlock amazing rewards
            </p>
          </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <FaTrophy className="text-blue-500 text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-blue-900">
                    {userStats.achievements_earned}/{userStats.total_achievements} Unlocked
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                  <FaStar className="text-purple-500 text-sm" />
                  <span className="text-xs sm:text-sm font-medium text-purple-900">
                    {userStats.xp} XP
                  </span>
                </div>
              </div>
            </div>
                </div>
                </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaTrophy className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{userStats.achievements_earned}</h3>
              <p className="text-sm text-gray-600">Achievements Unlocked</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <FaFire className="text-white text-xl" />
                </div>
              <h3 className="text-2xl font-bold text-gray-900">{userStats.streak_count}</h3>
              <p className="text-sm text-gray-600">Day Streak</p>
                </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <FaChartLine className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{userStats.level}</h3>
              <p className="text-sm text-gray-600">Current Level</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <FaStar className="text-white text-xl" />
          </div>
              <h3 className="text-2xl font-bold text-gray-900">{userStats.xp}</h3>
              <p className="text-sm text-gray-600">Total XP</p>
            </div>
          </div>

          {/* Achievement Categories */}
          <div className="space-y-8">
            {/* Learning Achievements */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FaGraduationCap className="text-blue-500 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Learning Achievements</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredAchievements.learning.filter(a => a.earned).length}/{filteredAchievements.learning.length}
                </span>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.learning.map((achievement) => (
                    <div key={achievement.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                      achievement.earned ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-green-600">
                            <FaAward className="text-sm" />
                            <span className="text-sm font-medium">Unlocked!</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {achievement.earnedDate}
                          </div>
                        </div>
                      ) : achievement.progress !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(achievement.progress, achievement.maxProgress!)}`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress!) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : null}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <FaStar className="text-xs" />
                          <span className="text-xs font-medium">+{achievement.xpReward} XP</span>
                        </div>
                    {achievement.earned && (
                          <div className="text-green-600 text-sm font-medium">✓ Earned</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
                  </div>
                  
            {/* Streak Achievements */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FaFire className="text-orange-500 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Streak Achievements</h2>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredAchievements.streak.filter(a => a.earned).length}/{filteredAchievements.streak.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.streak.map((achievement) => (
                    <div key={achievement.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                      achievement.earned ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-green-600">
                            <FaAward className="text-sm" />
                            <span className="text-sm font-medium">Unlocked!</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {achievement.earnedDate}
                          </div>
                        </div>
                      ) : achievement.progress !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(achievement.progress, achievement.maxProgress!)}`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress!) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : null}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <FaStar className="text-xs" />
                          <span className="text-xs font-medium">+{achievement.xpReward} XP</span>
                        </div>
                        {achievement.earned && (
                          <div className="text-green-600 text-sm font-medium">✓ Earned</div>
                        )}
                      </div>
                    </div>
                  ))}
                    </div>
                  </div>
                  
            {/* Social Achievements */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FaHeart className="text-pink-500 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Social Achievements</h2>
                <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredAchievements.social.filter(a => a.earned).length}/{filteredAchievements.social.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.social.map((achievement) => (
                    <div key={achievement.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                      achievement.earned ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-green-600">
                            <FaAward className="text-sm" />
                            <span className="text-sm font-medium">Unlocked!</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {achievement.earnedDate}
                          </div>
                        </div>
                      ) : achievement.progress !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(achievement.progress, achievement.maxProgress!)}`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress!) * 100}%` }}
                        ></div>
                          </div>
                        </div>
                      ) : null}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <FaStar className="text-xs" />
                          <span className="text-xs font-medium">+{achievement.xpReward} XP</span>
                        </div>
                        {achievement.earned && (
                          <div className="text-green-600 text-sm font-medium">✓ Earned</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Special Achievements */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FaGem className="text-purple-500 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Special Achievements</h2>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  {filteredAchievements.special.filter(a => a.earned).length}/{filteredAchievements.special.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.special.map((achievement) => (
                    <div key={achievement.id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
                      achievement.earned ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-green-600">
                            <FaAward className="text-sm" />
                            <span className="text-sm font-medium">Unlocked!</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {achievement.earnedDate}
                          </div>
                        </div>
                      ) : achievement.progress !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(achievement.progress, achievement.maxProgress!)}`}
                              style={{ width: `${(achievement.progress / achievement.maxProgress!) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : null}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <FaStar className="text-xs" />
                          <span className="text-xs font-medium">+{achievement.xpReward} XP</span>
                    </div>
                        {achievement.earned && (
                          <div className="text-green-600 text-sm font-medium">✓ Earned</div>
                  )}
                </div>
                </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Motivation Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-8 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keep Going!</h3>
            <p className="text-gray-600 mb-4">
              You're making amazing progress! Every achievement brings you closer to your goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  Next Level: {userStats.level + 1}
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  XP to Next: {1000 - (userStats.xp % 1000)}
                </span>
              </div>
            </div>
            </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default Achievements;
