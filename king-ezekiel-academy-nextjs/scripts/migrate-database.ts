import { createClient } from '@supabase/supabase-js'
import { env } from '../src/lib/env'

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

interface MigrationResult {
  success: boolean
  message: string
  data?: any
}

async function runMigration(): Promise<MigrationResult> {
  try {
    console.log('🚀 Starting database migration...')

    // 1. Create profiles table
    console.log('📋 Creating profiles table...')
    const { error: profilesError } = await supabase.rpc('create_profiles_table')
    if (profilesError) {
      console.error('Profiles table error:', profilesError)
    } else {
      console.log('✅ Profiles table created successfully')
    }

    // 2. Create courses table
    console.log('📚 Creating courses table...')
    const { error: coursesError } = await supabase.rpc('create_courses_table')
    if (coursesError) {
      console.error('Courses table error:', coursesError)
    } else {
      console.log('✅ Courses table created successfully')
    }

    // 3. Create lessons table
    console.log('🎓 Creating lessons table...')
    const { error: lessonsError } = await supabase.rpc('create_lessons_table')
    if (lessonsError) {
      console.error('Lessons table error:', lessonsError)
    } else {
      console.log('✅ Lessons table created successfully')
    }

    // 4. Create user_subscriptions table
    console.log('💳 Creating user_subscriptions table...')
    const { error: subscriptionsError } = await supabase.rpc('create_user_subscriptions_table')
    if (subscriptionsError) {
      console.error('Subscriptions table error:', subscriptionsError)
    } else {
      console.log('✅ User subscriptions table created successfully')
    }

    // 5. Create user_trials table
    console.log('🆓 Creating user_trials table...')
    const { error: trialsError } = await supabase.rpc('create_user_trials_table')
    if (trialsError) {
      console.error('Trials table error:', trialsError)
    } else {
      console.log('✅ User trials table created successfully')
    }

    // 6. Create user_lesson_progress table
    console.log('📊 Creating user_lesson_progress table...')
    const { error: progressError } = await supabase.rpc('create_user_lesson_progress_table')
    if (progressError) {
      console.error('Progress table error:', progressError)
    } else {
      console.log('✅ User lesson progress table created successfully')
    }

    // 7. Create user_achievements table
    console.log('🏆 Creating user_achievements table...')
    const { error: achievementsError } = await supabase.rpc('create_user_achievements_table')
    if (achievementsError) {
      console.error('Achievements table error:', achievementsError)
    } else {
      console.log('✅ User achievements table created successfully')
    }

    // 8. Create user_streaks table
    console.log('🔥 Creating user_streaks table...')
    const { error: streaksError } = await supabase.rpc('create_user_streaks_table')
    if (streaksError) {
      console.error('Streaks table error:', streaksError)
    } else {
      console.log('✅ User streaks table created successfully')
    }

    // 9. Create payment_attempts table
    console.log('💸 Creating payment_attempts table...')
    const { error: paymentsError } = await supabase.rpc('create_payment_attempts_table')
    if (paymentsError) {
      console.error('Payments table error:', paymentsError)
    } else {
      console.log('✅ Payment attempts table created successfully')
    }

    // 10. Create achievements table
    console.log('🎖️ Creating achievements table...')
    const { error: achievementsTableError } = await supabase.rpc('create_achievements_table')
    if (achievementsTableError) {
      console.error('Achievements table error:', achievementsTableError)
    } else {
      console.log('✅ Achievements table created successfully')
    }

    // 11. Set up RLS policies
    console.log('🔒 Setting up RLS policies...')
    const { error: rlsError } = await supabase.rpc('setup_rls_policies')
    if (rlsError) {
      console.error('RLS policies error:', rlsError)
    } else {
      console.log('✅ RLS policies set up successfully')
    }

    // 12. Insert sample data
    console.log('📝 Inserting sample data...')
    await insertSampleData()

    console.log('🎉 Database migration completed successfully!')
    return {
      success: true,
      message: 'Database migration completed successfully'
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      message: `Migration failed: ${error}`
    }
  }
}

async function insertSampleData() {
  try {
    // Insert sample courses
    const sampleCourses = [
      {
        id: 'course-1',
        title: 'Introduction to Web Development',
        description: 'Learn the fundamentals of web development with HTML, CSS, and JavaScript.',
        instructor: 'John Doe',
        duration: 40,
        price: 0,
        access_type: 'free',
        thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
        level: 'Beginner',
        language: 'English',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'course-2',
        title: 'Advanced React Development',
        description: 'Master React with hooks, context, and advanced patterns.',
        instructor: 'Jane Smith',
        duration: 60,
        price: 5000,
        access_type: 'membership',
        thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cce?w=500',
        level: 'Intermediate',
        language: 'English',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    for (const course of sampleCourses) {
      const { error } = await supabase
        .from('courses')
        .upsert(course)
      
      if (error) {
        console.error('Error inserting course:', course.title, error)
      } else {
        console.log(`✅ Inserted course: ${course.title}`)
      }
    }

    // Insert sample lessons
    const sampleLessons = [
      {
        id: 'lesson-1',
        course_id: 'course-1',
        title: 'HTML Basics',
        description: 'Learn the fundamentals of HTML markup.',
        video_url: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
        video_type: 'youtube',
        duration: 15,
        order_index: 1,
        is_preview: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'lesson-2',
        course_id: 'course-1',
        title: 'CSS Styling',
        description: 'Style your HTML with CSS.',
        video_url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
        video_type: 'youtube',
        duration: 20,
        order_index: 2,
        is_preview: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'lesson-3',
        course_id: 'course-2',
        title: 'React Hooks',
        description: 'Learn about React hooks and state management.',
        video_url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
        video_type: 'youtube',
        duration: 25,
        order_index: 1,
        is_preview: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    for (const lesson of sampleLessons) {
      const { error } = await supabase
        .from('lessons')
        .upsert(lesson)
      
      if (error) {
        console.error('Error inserting lesson:', lesson.title, error)
      } else {
        console.log(`✅ Inserted lesson: ${lesson.title}`)
      }
    }

    // Insert sample achievements
    const sampleAchievements = [
      {
        id: 'achievement-1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        xp_reward: 50,
        created_at: new Date().toISOString()
      },
      {
        id: 'achievement-2',
        name: 'Streak Master',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        xp_reward: 100,
        created_at: new Date().toISOString()
      },
      {
        id: 'achievement-3',
        name: 'Course Completer',
        description: 'Complete your first course',
        icon: '🏆',
        xp_reward: 200,
        created_at: new Date().toISOString()
      }
    ]

    for (const achievement of sampleAchievements) {
      const { error } = await supabase
        .from('achievements')
        .upsert(achievement)
      
      if (error) {
        console.error('Error inserting achievement:', achievement.name, error)
      } else {
        console.log(`✅ Inserted achievement: ${achievement.name}`)
      }
    }

    console.log('✅ Sample data inserted successfully')

  } catch (error) {
    console.error('Error inserting sample data:', error)
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (result.success) {
        console.log('🎉 Migration completed successfully!')
        process.exit(0)
      } else {
        console.error('❌ Migration failed:', result.message)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Migration error:', error)
      process.exit(1)
    })
}

export { runMigration }
