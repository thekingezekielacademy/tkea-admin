const express = require('express');
const router = express.Router();

// @route   POST /api/sample-data/add-lessons
// @desc    Add sample lessons to a course
// @access  Public (for testing)
router.post('/add-lessons', async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const supabase = req.app.locals.supabase;

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if lessons already exist
    const { data: existingLessons, error: lessonsError } = await supabase
      .from('course_videos')
      .select('*')
      .eq('course_id', courseId);

    if (lessonsError) {
      return res.status(500).json({
        success: false,
        message: 'Error checking existing lessons'
      });
    }

    if (existingLessons && existingLessons.length > 0) {
      return res.json({
        success: true,
        message: 'Lessons already exist for this course',
        data: existingLessons
      });
    }

    // Add sample lessons
    const sampleLessons = [
      {
        id: 'lesson-1-wp',
        course_id: courseId,
        name: 'Introduction to WordPress Development',
        duration: '15:30',
        link: 'https://youtube.com/watch?v=wp-intro-123',
        order_index: 1
      },
      {
        id: 'lesson-2-wp',
        course_id: courseId,
        name: 'Setting Up WordPress Environment',
        duration: '22:45',
        link: 'https://youtube.com/watch?v=wp-setup-456',
        order_index: 2
      },
      {
        id: 'lesson-3-wp',
        course_id: courseId,
        name: 'Custom Theme Development',
        duration: '28:15',
        link: 'https://youtube.com/watch?v=wp-theme-789',
        order_index: 3
      },
      {
        id: 'lesson-4-wp',
        course_id: courseId,
        name: 'Plugin Development Basics',
        duration: '25:40',
        link: 'https://youtube.com/watch?v=wp-plugin-012',
        order_index: 4
      },
      {
        id: 'lesson-5-wp',
        course_id: courseId,
        name: 'SEO Optimization for WordPress',
        duration: '20:30',
        link: 'https://youtube.com/watch?v=wp-seo-345',
        order_index: 5
      },
      {
        id: 'lesson-6-wp',
        course_id: courseId,
        name: 'Blogging Strategy and Content Creation',
        duration: '18:20',
        link: 'https://youtube.com/watch?v=wp-blog-678',
        order_index: 6
      }
    ];

    const { data: insertedLessons, error: insertError } = await supabase
      .from('course_videos')
      .insert(sampleLessons);

    if (insertError) {
      return res.status(500).json({
        success: false,
        message: 'Error inserting lessons',
        error: insertError
      });
    }

    // Update course level to advanced
    const { error: updateError } = await supabase
      .from('courses')
      .update({ level: 'advanced' })
      .eq('id', courseId);

    if (updateError) {
      console.log('Warning: Could not update course level:', updateError);
    }

    res.json({
      success: true,
      message: `Successfully added ${sampleLessons.length} lessons to course`,
      data: {
        course: course.title,
        lessonsAdded: sampleLessons.length,
        lessons: sampleLessons
      }
    });

  } catch (error) {
    console.error('Add sample lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding sample lessons'
    });
  }
});

module.exports = router;
