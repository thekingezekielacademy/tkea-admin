/**
 * Course Shuffle Utility
 * Provides functions to randomize course display order
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  is_scheduled?: boolean;
  status?: string;
  access_type?: 'free' | 'membership';
  category: string;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  lessons: number;
}

/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle courses array with optional seed for consistent randomization
 * @param courses - Array of courses to shuffle
 * @param seed - Optional seed for consistent randomization (useful for pagination)
 * @returns Shuffled courses array
 */
export function shuffleCourses(courses: Course[], seed?: string): Course[] {
  if (!courses || courses.length === 0) return courses;
  
  // If seed is provided, use it for consistent randomization
  if (seed) {
    return seededShuffle(courses, seed);
  }
  
  // Otherwise, use random shuffle
  return shuffleArray(courses);
}

/**
 * Seeded shuffle for consistent randomization across sessions
 * @param array - Array to shuffle
 * @param seed - Seed string for consistent randomization
 * @returns Shuffled array
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  let hash = 0;
  
  // Simple hash function for seed
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use hash as seed for Math.random
  const seededRandom = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Generate a consistent seed based on current date
 * This ensures courses are shuffled the same way for the entire day
 * @returns Date-based seed string
 */
export function generateDailySeed(): string {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  return `daily_${dateString}`;
}

/**
 * Generate a seed based on current hour
 * This ensures courses are shuffled the same way for the entire hour
 * @returns Hour-based seed string
 */
export function generateHourlySeed(): string {
  const now = new Date();
  const hourString = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  return `hourly_${hourString}`;
}

/**
 * Generate a seed based on current week
 * This ensures courses are shuffled the same way for the entire week
 * @returns Week-based seed string
 */
export function generateWeeklySeed(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekString = startOfWeek.toISOString().split('T')[0];
  return `weekly_${weekString}`;
}

/**
 * Shuffle courses with daily rotation
 * Courses will be shuffled the same way for the entire day, then change the next day
 * @param courses - Array of courses to shuffle
 * @returns Shuffled courses array
 */
export function shuffleCoursesDaily(courses: Course[]): Course[] {
  const seed = generateDailySeed();
  return shuffleCourses(courses, seed);
}

/**
 * Shuffle courses with hourly rotation
 * Courses will be shuffled the same way for the entire hour, then change the next hour
 * @param courses - Array of courses to shuffle
 * @returns Shuffled courses array
 */
export function shuffleCoursesHourly(courses: Course[]): Course[] {
  const seed = generateHourlySeed();
  return shuffleCourses(courses, seed);
}

/**
 * Shuffle courses with weekly rotation
 * Courses will be shuffled the same way for the entire week, then change the next week
 * @param courses - Array of courses to shuffle
 * @returns Shuffled courses array
 */
export function shuffleCoursesWeekly(courses: Course[]): Course[] {
  const seed = generateWeeklySeed();
  return shuffleCourses(courses, seed);
}

/**
 * Shuffle courses with random rotation
 * Courses will be shuffled differently every time
 * @param courses - Array of courses to shuffle
 * @returns Shuffled courses array
 */
export function shuffleCoursesRandom(courses: Course[]): Course[] {
  return shuffleCourses(courses);
}

/**
 * Default shuffle function - uses daily rotation for balance between variety and consistency
 * @param courses - Array of courses to shuffle
 * @returns Shuffled courses array
 */
export function shuffleCoursesDefault(courses: Course[]): Course[] {
  return shuffleCoursesDaily(courses);
}
