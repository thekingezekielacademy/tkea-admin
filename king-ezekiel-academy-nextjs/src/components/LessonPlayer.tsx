'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContextOptimized'
import AdvancedVideoPlayer from './AdvancedVideoPlayer'
import { createClient } from '@/lib/supabase/client'

interface Lesson {
  id: string
  title: string
  description: string
  video_url: string
  video_type: 'youtube' | 'hls' | 'mp4'
  duration: number
  order_index: number
  is_preview: boolean
}

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  thumbnail_url: string
  price: number
  is_free: boolean
}

interface LessonPlayerProps {
  courseId: string
  lessonId: string
  onLessonComplete?: (lessonId: string) => void
  onNextLesson?: () => void
  onPrevLesson?: () => void
}

export default function LessonPlayer({
  courseId,
  lessonId,
  onLessonComplete,
  onNextLesson,
  onPrevLesson,
}: LessonPlayerProps) {
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isTrialActive, setIsTrialActive] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const supabase = createClient()

  // Check user access
  const checkAccess = useCallback(async () => {
    if (!user) return

    try {
      // Check if course is free
      const { data: courseData } = await supabase
        .from('courses')
        .select('access_type')
        .eq('id', courseId)
        .single()

      if (courseData?.access_type === 'free') {
        // Free courses are accessible to all signed-in users
        setHasAccess(true)
        return
      }

      // Check trial status
      const { data: trialData } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (trialData) {
        setIsTrialActive(true)
        setHasAccess(true)
        return
      }

      // Check subscription status
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (subscriptionData) {
        setIsSubscribed(true)
        setHasAccess(true)
        return
      }

      setHasAccess(false)
    } catch (error) {
      console.error('Access check error:', error)
      setError('Failed to verify access')
    }
  }, [user, courseId, supabase])

  // Load course and lesson data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      // Find current lesson
      const currentIndex = lessonsData?.findIndex(l => l.id === lessonId) || 0
      setCurrentLessonIndex(currentIndex)
      setLesson(lessonsData?.[currentIndex] || null)

    } catch (error) {
      console.error('Data load error:', error)
      setError('Failed to load lesson data')
    } finally {
      setIsLoading(false)
    }
  }, [courseId, lessonId, supabase])

  // Track lesson progress
  const trackProgress = useCallback(async (progressData: { played: number; playedSeconds: number }) => {
    if (!user || !lesson) return

    setProgress(progressData.played)

    // Save progress to database
    try {
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          progress_percentage: Math.round(progressData.played * 100),
          time_watched: Math.round(progressData.playedSeconds),
          last_watched_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Progress tracking error:', error)
    }
  }, [user, lesson, supabase])

  // Handle lesson completion
  const handleLessonComplete = useCallback(async () => {
    if (!user || !lesson) return

    try {
      // Mark lesson as completed
      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lesson.id,
          progress_percentage: 100,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString()
        })

      // Use the course progress service to update course progress and stats
      const { CourseProgressService } = await import('@/services/courseProgressService');
      await CourseProgressService.onLessonCompleted(user.id, courseId, lesson.id);

      onLessonComplete?.(lesson.id)
    } catch (error) {
      console.error('Lesson completion error:', error)
    }
  }, [user, lesson, courseId, supabase, onLessonComplete])

  // Load data on mount
  useEffect(() => {
    loadData()
    checkAccess()
  }, [loadData, checkAccess])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading lesson...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">Error</div>
          <div>{error}</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-2xl font-bold text-gray-900 mb-4">
            Access Required
          </div>
          <div className="text-gray-600 mb-6">
            You need an active subscription or trial to access this lesson.
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Start Free Trial
          </button>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-600">
          <div className="text-lg font-semibold mb-2">Lesson Not Found</div>
          <div>This lesson could not be found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-6">
        <AdvancedVideoPlayer
          src={lesson.video_url}
          type={lesson.video_type}
          onProgress={trackProgress}
          onEnded={handleLessonComplete}
          className="w-full"
          height="500px"
          controls={true}
        />
      </div>

      {/* Lesson Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {lesson.title}
        </h1>
        <p className="text-gray-600 mb-4">
          {lesson.description}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Lesson Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={onPrevLesson}
            disabled={currentLessonIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Lesson
          </button>
          
          <div className="text-sm text-gray-500">
            Lesson {currentLessonIndex + 1} of {lessons.length}
          </div>
          
          <button
            onClick={onNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Lesson
          </button>
        </div>
      </div>

      {/* Course Info */}
      {course && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {course.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {course.description}
          </p>
          <div className="text-sm text-gray-500">
            Instructor: {course.instructor}
          </div>
        </div>
      )}
    </div>
  )
}
