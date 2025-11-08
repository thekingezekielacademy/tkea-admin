import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailService } from '@/services/emailService'

/**
 * POST /api/courses/send-notifications
 * Send course available notifications to all users who requested them
 * This endpoint should be called when a course becomes available/published
 * 
 * Requires admin authentication or can be triggered by course status change
 */
export async function POST(request: NextRequest) {
  try {
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get course details
    const { data: course, error: courseError } = await adminClient
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get all users who requested notifications for this course and haven't received email yet
    const { data: notifications, error: notificationsError } = await adminClient
      .from('course_notifications')
      .select(`
        id,
        user_id,
        email_sent,
        profiles:user_id (
          email,
          name
        )
      `)
      .eq('course_id', courseId)
      .eq('email_sent', false)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending notifications found for this course',
        sent: 0,
        total: 0,
      })
    }

    // Send emails to all users
    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const notification of notifications) {
      try {
        // Type assertion for profile data
        const profile = notification.profiles as { email: string; name: string } | null

        if (!profile || !profile.email) {
          console.warn(`No email found for user ${notification.user_id}`)
          failedCount++
          continue
        }

        // Send email
        const result = await emailService.sendCourseAvailableEmail({
          name: profile.name || 'Student',
          email: profile.email,
          courseTitle: course.title,
          courseId: course.id,
        })

        if (result.success) {
          // Mark as sent in database
          await adminClient
            .from('course_notifications')
            .update({ email_sent: true, updated_at: new Date().toISOString() })
            .eq('id', notification.id)

          sentCount++
        } else {
          failedCount++
          errors.push(`Failed to send to ${profile.email}: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Error processing notification ${notification.id}: ${errorMessage}`)
        console.error('Error sending notification email:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${notifications.length} notifications`,
      sent: sentCount,
      failed: failedCount,
      total: notifications.length,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Error in send-notifications endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/courses/send-notifications?courseId=xxx
 * Check how many users are waiting for notifications for a course
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get course details
    const { data: course } = await adminClient
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Count notifications
    const { count: totalCount } = await adminClient
      .from('course_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const { count: pendingCount } = await adminClient
      .from('course_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('email_sent', false)

    const { count: sentCount } = await adminClient
      .from('course_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('email_sent', true)

    return NextResponse.json({
      courseId,
      courseTitle: course.title,
      total: totalCount || 0,
      pending: pendingCount || 0,
      sent: sentCount || 0,
    })

  } catch (error) {
    console.error('Error in get notifications stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

