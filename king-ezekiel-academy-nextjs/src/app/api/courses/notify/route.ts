import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/courses/notify
 * Add a user to the notification list for a course
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to request notifications.' },
        { status: 401 }
      )
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
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

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single()

    // Add notification using admin client to bypass RLS for insert
    const adminClient = createAdminClient()
    const { data: notification, error: notificationError } = await adminClient
      .from('course_notifications')
      .insert({
        user_id: user.id,
        course_id: courseId,
        email_sent: false,
      })
      .select()
      .single()

    // If already exists, return success
    if (notificationError) {
      // Check if it's a unique constraint violation (already exists)
      if (notificationError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to notifications for this course.',
          notification: {
            courseId,
            courseTitle: course.title,
          }
        })
      }

      console.error('Error creating notification:', notificationError)
      return NextResponse.json(
        { error: 'Failed to set up notification. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'You will be notified when this course becomes available!',
      notification: {
        courseId,
        courseTitle: course.title,
      }
    })

  } catch (error) {
    console.error('Error in notify endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/courses/notify
 * Remove a user from the notification list for a course
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Remove notification
    const { error: deleteError } = await supabase
      .from('course_notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    if (deleteError) {
      console.error('Error deleting notification:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification removed successfully'
    })

  } catch (error) {
    console.error('Error in delete notify endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/courses/notify?courseId=xxx
 * Check if user is subscribed to notifications for a course
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if notification exists
    const { data: notification, error: notificationError } = await supabase
      .from('course_notifications')
      .select('id, course_id, created_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (notificationError || !notification) {
      return NextResponse.json({
        subscribed: false
      })
    }

    return NextResponse.json({
      subscribed: true,
      notification: {
        id: notification.id,
        courseId: notification.course_id,
        createdAt: notification.created_at,
      }
    })

  } catch (error) {
    console.error('Error in get notify endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

