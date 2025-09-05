// =====================================================
// TEST UTILITIES
// Provides common testing utilities and helpers
// =====================================================

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { SidebarProvider } from '../contexts/SidebarContext';

// Mock Supabase client for testing
export const mockSupabase = {
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
};

// Mock environment variables
export const mockEnv = {
  REACT_APP_SUPABASE_URL: 'https://test.supabase.co',
  REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
  REACT_APP_PAYSTACK_PUBLIC_KEY: 'pk_test_123',
  REACT_APP_API_URL: 'https://test-api.com',
  NODE_ENV: 'test',
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

// Mock profile data
export const mockProfile = {
  id: 'test-user-id',
  full_name: 'Test User',
  email: 'test@example.com',
  xp: 1000,
  level: 1,
  streak: 5,
  achievements_earned: 3,
  total_achievements: 10,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock course data
export const mockCourse = {
  id: 'test-course-id',
  title: 'Test Course',
  description: 'A test course for testing purposes',
  instructor: 'Test Instructor',
  duration: 60,
  level: 'beginner',
  category: 'programming',
  price: 99.99,
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock lesson data
export const mockLesson = {
  id: 'test-lesson-id',
  course_id: 'test-course-id',
  title: 'Test Lesson',
  description: 'A test lesson for testing purposes',
  video_url: 'https://example.com/video.mp4',
  duration: 30,
  order_index: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock achievement data
export const mockAchievement = {
  id: 'test-achievement-id',
  user_id: 'test-user-id',
  achievement_id: 'first_course',
  title: 'First Course Completed',
  description: 'Completed your first course',
  category: 'learning',
  xp_reward: 100,
  earned_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
};

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock fetch for API testing
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock performance API
export const mockPerformance = () => {
  const startTime = Date.now();
  
  global.performance = {
    now: jest.fn(() => Date.now() - startTime),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  } as any;
};

// Test data generators
export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockUser,
    id: `user-${i}`,
    email: `user${i}@example.com`,
    user_metadata: {
      full_name: `User ${i}`,
    },
  }));
};

export const generateMockCourses = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockCourse,
    id: `course-${i}`,
    title: `Course ${i}`,
    description: `Description for course ${i}`,
  }));
};

export const generateMockAchievements = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockAchievement,
    id: `achievement-${i}`,
    achievement_id: `achievement_${i}`,
    title: `Achievement ${i}`,
    description: `Description for achievement ${i}`,
  }));
};

// Assertion helpers
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectToHaveTextContent = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className);
};

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock console methods for testing
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.info = jest.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock environment variables
  Object.assign(process.env, mockEnv);
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  });
  
  // Mock performance API
  mockPerformance();
  
  // Mock fetch
  mockFetch({ success: true });
};

// Cleanup after tests
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

// Export everything
export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
