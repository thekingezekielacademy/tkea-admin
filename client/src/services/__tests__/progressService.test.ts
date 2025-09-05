// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn(),
    })),
  },
}));

import { ProgressService } from '../progressService';
import { supabase } from '../../lib/supabase';

describe('ProgressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserAchievements', () => {
    it('should return achievements when successful', async () => {
      const mockAchievements = [{
        id: 'test-achievement-id',
        user_id: 'test-user-id',
        achievement_id: 'first_course',
        title: 'First Course Completed',
        description: 'Completed your first course',
        category: 'learning',
        xp_reward: 100,
        earned_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      }];
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockAchievements,
          error: null,
        }),
      });

      const result = await ProgressService.getUserAchievements('test-user-id');

      expect(result).toEqual(mockAchievements);
      expect(supabase.from).toHaveBeenCalledWith('user_achievements');
    });

    it('should return empty array when table does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'relation "user_achievements" does not exist' },
        }),
      });

      const result = await ProgressService.getUserAchievements('test-user-id');

      expect(result).toEqual([]);
    });

    it('should return empty array when error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST301', message: 'Permission denied' },
        }),
      });

      const result = await ProgressService.getUserAchievements('test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats when successful', async () => {
      const mockStats = {
        xp: 1000,
        level: 1,
        streak: 5,
        achievements_earned: 3,
        total_achievements: 10,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStats,
          error: null,
        }),
      });

      const result = await ProgressService.getUserStats('test-user-id');

      expect(result).toEqual(mockStats);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return default stats when error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        }),
      });

      const result = await ProgressService.getUserStats('test-user-id');

      expect(result).toEqual({
        xp: 0,
        level: 1,
        streak: 0,
        achievements_earned: 0,
        total_achievements: 0,
      });
    });
  });

  describe('addXP', () => {
    it('should add XP successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ xp: 1100 }],
          error: null,
        }),
      });

      const result = await ProgressService.addXP('test-user-id', 100);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return false when error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      });

      const result = await ProgressService.addXP('test-user-id', 100);

      expect(result).toBe(false);
    });
  });

  describe('updateStreak', () => {
    it('should update streak successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ streak: 6 }],
          error: null,
        }),
      });

      const result = await ProgressService.updateStreak('test-user-id', 6);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return false when error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      });

      const result = await ProgressService.updateStreak('test-user-id', 6);

      expect(result).toBe(false);
    });
  });
});
