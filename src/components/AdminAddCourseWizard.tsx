import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../utils/notificationService';
import { emailService } from '../services/emailService';

interface Video {
  id: string;
  name: string;
  duration: string;
  link: string;
}

interface PDFResource {
  id: string;
  file: File;
  name: string;
}

interface CourseData {
  title: string;
  description: string;
  level: string;
  category: string;
  access_type: 'free' | 'membership';
  purchase_price: number;
  coverPhoto?: File;
  videos: Video[];
  pdfResources: PDFResource[];
}

const AdminAddCourseWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    level: 'beginner', // Default level (lowercase)
    category: 'business-entrepreneurship', // Default category
    access_type: 'free', // Default access type
    purchase_price: 0, // Default price (free)
    coverPhoto: undefined,
    videos: [],
    pdfResources: []
  });

  const [newVideo, setNewVideo] = useState({ name: '', duration: '', link: '' });
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);

  // Schedule popup states
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Drag and drop functionality
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedVideoIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleVideoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedVideoIndex === null || draggedVideoIndex === dropIndex) return;

    setCourseData(prev => {
      const newVideos = [...prev.videos];
      const draggedVideo = newVideos[draggedVideoIndex];
      
      // Remove dragged video from original position
      newVideos.splice(draggedVideoIndex, 1);
      
      // Insert at new position
      newVideos.splice(dropIndex, 0, draggedVideo);
      
      return { ...prev, videos: newVideos };
    });
    
    setDraggedVideoIndex(null);
  };

  const moveVideoUp = (index: number) => {
    if (index === 0) return;
    setCourseData(prev => {
      const newVideos = [...prev.videos];
      [newVideos[index], newVideos[index - 1]] = [newVideos[index - 1], newVideos[index]];
      return { ...prev, videos: newVideos };
    });
  };

  const moveVideoDown = (index: number) => {
    setCourseData(prev => {
      if (index === prev.videos.length - 1) return prev;
      const newVideos = [...prev.videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      return { ...prev, videos: newVideos };
    });
  };

  const handleInputChange = (field: keyof CourseData, value: string | number) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoInputChange = (field: keyof Video, value: string) => {
    setNewVideo(prev => ({ ...prev, [field]: value }));
  };

  const addVideo = () => {
    if (!newVideo.name.trim() || !newVideo.duration.trim() || !newVideo.link.trim()) {
      setError('Please fill in all video fields');
      return;
    }

    const video: Video = {
      id: Math.random().toString(36).substr(2, 9),
      name: newVideo.name.trim(),
      duration: newVideo.duration.trim(),
      link: newVideo.link.trim()
    };

    setCourseData(prev => ({
      ...prev,
      videos: [...prev.videos, video]
    }));

    // Reset form
    setNewVideo({ name: '', duration: '', link: '' });
    setError('');
  };

  const removeVideo = (videoId: string) => {
      setCourseData(prev => ({
        ...prev,
      videos: prev.videos.filter(v => v.id !== videoId)
    }));
  };

  const handleCoverPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please select a file smaller than 10MB');
        return;
      }
      
      setCourseData(prev => ({ ...prev, coverPhoto: file }));
      setError('');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Validate file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please select a file smaller than 10MB');
        return;
      }
      
      setCourseData(prev => ({ ...prev, coverPhoto: imageFile }));
      setError('');
    } else {
      setError('Please drop a valid image file');
    }
  }, []);

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        setError('Please select PDF files only');
        return;
      }
      
      // Validate all files
      const validFiles: PDFResource[] = [];
      for (const file of pdfFiles) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
          setError(`"${file.name}" is too large. Maximum file size is 50MB per PDF.`);
          continue;
      }
      
        validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        name: file.name.replace('.pdf', '')
        });
      }
      
      if (validFiles.length > 0) {
      setCourseData(prev => ({
        ...prev,
          pdfResources: [...prev.pdfResources, ...validFiles]
      }));
      setError('');
      }
    }
  };

  const handlePdfDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(true);
  }, []);

  const handlePdfDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
  }, []);

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsPdfDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      // Validate file size (max 50MB)
      if (pdfFile.size > 50 * 1024 * 1024) {
        setError('PDF file is too large. Please select a file smaller than 50MB');
        return;
      }
      
      const pdfResource: PDFResource = {
        id: Math.random().toString(36).substr(2, 9),
        file: pdfFile,
        name: pdfFile.name.replace('.pdf', '')
      };
      
      setCourseData(prev => ({
        ...prev,
        pdfResources: [...prev.pdfResources, pdfResource]
      }));
      setError('');
    } else {
      setError('Please drop a valid PDF file');
    }
  }, []);

  const removePdf = (pdfId: string) => {
    setCourseData(prev => ({
      ...prev,
      pdfResources: prev.pdfResources.filter(pdf => pdf.id !== pdfId)
    }));
  };

  // Function to notify all active users about scheduled course
  const notifyUsersAboutScheduledCourse = async (courseTitle: string, scheduledDate: string, courseId: string) => {
    try {
      console.log('🔔 Notifying users about scheduled course:', courseTitle);
      
      // Check if Resend is configured
      if (!emailService.isConfigured()) {
        console.warn('⚠️ Resend API key not configured. Emails will not be sent.');
        return;
      }
      
      // Get all active users (users with email addresses)
      const { data: activeUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .not('email', 'is', null);

      if (usersError) {
        console.error('Error fetching users for notification:', usersError);
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        console.log('No active users found to notify');
        return;
      }

      console.log(`📢 Sending scheduled course notification emails to ${activeUsers.length} users`);

      // Send email to each user
      let sentCount = 0;
      let failedCount = 0;

      for (const user of activeUsers) {
        try {
          if (!user.email) {
            console.warn(`Skipping user ${user.id} - no email address`);
            failedCount++;
            continue;
          }

          const result = await emailService.sendCourseScheduledEmail({
            name: user.full_name || 'Student',
            email: user.email,
            courseTitle,
            courseId,
            scheduledDate,
          });

          if (result.success) {
            sentCount++;
            console.log(`✅ Scheduled course email sent to ${user.email}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to send scheduled course email to ${user.email}:`, result.error);
          }
        } catch (notifyError) {
          failedCount++;
          console.error(`Error notifying user ${user.email}:`, notifyError);
        }
      }

      console.log(`✅ Scheduled course notifications completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      console.error('Error in notifyUsersAboutScheduledCourse:', error);
    }
  };

  // Function to notify all active users about new course
  const notifyUsersAboutNewCourse = async (courseTitle: string, category: string, courseId: string) => {
    try {
      console.log('🔔 Notifying users about new course:', courseTitle);
      
      // Check if Resend is configured
      if (!emailService.isConfigured()) {
        console.warn('⚠️ Resend API key not configured. Emails will not be sent.');
        console.warn('⚠️ To enable email notifications, set REACT_APP_RESEND_API_KEY and REACT_APP_RESEND_FROM_EMAIL environment variables.');
        return;
      }
      
      // Get all active users (users with email addresses)
      const { data: activeUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .not('email', 'is', null);

      if (usersError) {
        console.error('Error fetching users for notification:', usersError);
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        console.log('No active users found to notify');
        return;
      }

      console.log(`📢 Sending new course notification emails to ${activeUsers.length} users`);

      // Send email to each user
      let sentCount = 0;
      let failedCount = 0;

      for (const user of activeUsers) {
        try {
          if (!user.email) {
            console.warn(`Skipping user ${user.id} - no email address`);
            failedCount++;
            continue;
          }

          const result = await emailService.sendCourseAvailableEmail({
            name: user.full_name || 'Student',
            email: user.email,
            courseTitle,
            courseId,
          });

          if (result.success) {
            sentCount++;
            console.log(`✅ Email sent to ${user.email}`);
          } else {
            failedCount++;
            console.error(`❌ Failed to send email to ${user.email}:`, result.error);
          }
        } catch (notifyError) {
          failedCount++;
          console.error(`Error notifying user ${user.email}:`, notifyError);
        }
      }

      console.log(`✅ Course notifications completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      console.error('Error in notifyUsersAboutNewCourse:', error);
    }
  };

  const handleScheduleCourse = async () => {
    if (!courseData.title.trim()) {
      setError('Please enter a course title');
      return;
    }

    if (courseData.videos.length === 0) {
      setError('Please add at least one video to the course');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setError('Please select both date and time for scheduling');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Combine date and time
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      let coverPhotoUrl = null;

      // Upload cover photo if provided
      if (courseData.coverPhoto) {
        try {
          const fileExt = courseData.coverPhoto.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = fileName;

          const arrayBuffer = await courseData.coverPhoto.arrayBuffer();
          
          const { error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(filePath, arrayBuffer);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('course-covers')
              .getPublicUrl(filePath);
            coverPhotoUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Cover photo upload failed:', uploadErr);
        }
      }

      // Ensure access_type is valid ('free' or 'membership')
      const validAccessType = (courseData.access_type === 'free' || courseData.access_type === 'membership') 
        ? courseData.access_type 
        : 'membership'; // Default to 'membership' if invalid

      // Create the course with scheduled status
      const { data: courseIns, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          category: courseData.category,
          access_type: validAccessType,
          cover_photo_url: coverPhotoUrl,
          purchase_price: courseData.purchase_price || 0,
          is_scheduled: true,
          status: 'scheduled',
          scheduled_for: scheduledFor,
          created_by: user?.id
        })
        .select()
        .single();

      if (courseError) {
        throw new Error(courseError.message);
      }

      // Create course videos for each video
      const videosToInsert = courseData.videos.map((video, index) => ({
        course_id: courseIns.id,
        name: video.name,
        link: video.link,
        duration: video.duration,
        order_index: index + 1
      }));

      const { error: videosError } = await supabase
        .from('course_videos')
        .insert(videosToInsert);

      if (videosError) {
        throw new Error(videosError.message);
      }

      // Send notification about scheduled course
      try {
        // Notify all users about the scheduled course
        await notifyUsersAboutScheduledCourse(courseData.title, scheduledFor, courseIns.id);
      } catch (error) {
        console.error('Error sending course scheduled notification:', error);
      }

      setShowSchedulePopup(false);
      navigate('/admin/courses');
    } catch (e: any) {
      setError(e?.message || 'Failed to schedule course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseData.title.trim()) {
      setError('Please enter a course title');
      return;
    }

    if (courseData.videos.length === 0) {
      setError('Please add at least one video to the course');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let coverPhotoUrl = null;

      // Upload cover photo if provided (make it optional)
      if (courseData.coverPhoto) {
        try {
          const fileExt = courseData.coverPhoto.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = fileName;

          console.log('Uploading file:', {
            name: courseData.coverPhoto.name,
            type: courseData.coverPhoto.type,
            size: courseData.coverPhoto.size,
            path: filePath
          });

          // Try converting to ArrayBuffer to avoid any multipart issues
          const arrayBuffer = await courseData.coverPhoto.arrayBuffer();
          
          const { error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(filePath, arrayBuffer);

          if (uploadError) {
            console.warn('Cover photo upload failed, continuing without it:', uploadError.message);
            // Don't throw error, just continue without cover photo
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('course-covers')
              .getPublicUrl(filePath);

            coverPhotoUrl = publicUrl;
            console.log('Cover photo uploaded successfully:', coverPhotoUrl);
          }
        } catch (uploadErr) {
          console.warn('Cover photo upload failed, continuing without it:', uploadErr);
          // Don't throw error, just continue without cover photo
        }
      }

      // Create the course
      // Ensure access_type is valid ('free' or 'membership')
      const validAccessType = (courseData.access_type === 'free' || courseData.access_type === 'membership') 
        ? courseData.access_type 
        : 'membership'; // Default to 'membership' if invalid

      console.log('About to create course with data:', {
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        category: courseData.category,
        access_type: validAccessType,
        purchase_price: courseData.purchase_price || 0,
        cover_photo_url: coverPhotoUrl,
        created_by: user?.id
      });

      const { data: courseDataResult, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          category: courseData.category,
          access_type: validAccessType,
          purchase_price: courseData.purchase_price || 0,
          cover_photo_url: coverPhotoUrl,
          created_by: user?.id
        })
        .select()
        .single();

      if (courseError) {
        throw new Error(`Failed to create course: ${courseError.message}`);
      }

      // Create the course videos
      const videosToInsert = courseData.videos.map((video, index) => ({
        course_id: courseDataResult.id,
        name: video.name,
        duration: video.duration,
        link: video.link,
        order_index: index + 1
      }));

      const { error: videosError } = await supabase
        .from('course_videos')
        .insert(videosToInsert);

      if (videosError) {
        // If videos fail to insert, delete the course to maintain consistency
        await supabase
          .from('courses')
          .delete()
          .eq('id', courseDataResult.id);
        
        throw new Error(`Failed to create course videos: ${videosError.message}`);
      }

      console.log('Course created successfully:', courseDataResult);
      
      // Upload PDF resources if any
      if (courseData.pdfResources.length > 0) {
        try {
          const pdfResourcesToInsert = [];
          
          for (const pdfResource of courseData.pdfResources) {
            try {
              // Upload PDF to storage
              const fileExt = 'pdf';
              const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
              const filePath = `${courseDataResult.id}/${fileName}`;
              
              const arrayBuffer = await pdfResource.file.arrayBuffer();
              
              const { error: uploadError } = await supabase.storage
                .from('course-resources')
                .upload(filePath, arrayBuffer, {
                  contentType: 'application/pdf',
                  upsert: false
                });
              
              if (uploadError) {
                const errorMsg = uploadError.message || 'Unknown error';
                if (errorMsg.includes('Bucket not found') || errorMsg.includes('not found')) {
                  console.error(`PDF upload failed: The 'course-resources' storage bucket does not exist in Supabase. Please create it in the Supabase Dashboard → Storage section.`);
                  setError(`PDF upload failed: The 'course-resources' storage bucket needs to be created in Supabase. Go to Supabase Dashboard → Storage → Create bucket named 'course-resources' and set it to Public.`);
                } else {
                  console.warn(`PDF upload failed for ${pdfResource.name}:`, errorMsg);
                }
                continue; // Skip this PDF but continue with others
              }
              
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('course-resources')
                .getPublicUrl(filePath);
              
              // Prepare resource data for database
              pdfResourcesToInsert.push({
                course_id: courseDataResult.id,
                name: pdfResource.name,
                file_url: publicUrl,
                file_path: filePath,
                file_size: pdfResource.file.size,
                file_type: 'application/pdf',
                created_at: new Date().toISOString()
              });
            } catch (pdfErr) {
              console.warn(`Error uploading PDF ${pdfResource.name}:`, pdfErr);
              // Continue with other PDFs
            }
          }
          
          // Insert PDF resources into database
          if (pdfResourcesToInsert.length > 0) {
            console.log('Attempting to insert PDF resources:', pdfResourcesToInsert);
            const { data: insertedData, error: resourcesError } = await supabase
              .from('course_resources')
              .insert(pdfResourcesToInsert)
              .select();
            
            if (resourcesError) {
              console.error('Failed to save PDF resources to database:', resourcesError);
              setError(`Failed to save PDF resources: ${resourcesError.message}. Please check RLS policies and ensure you have admin permissions.`);
              // Don't throw error, course is already created, but show error to user
            } else {
              console.log(`Successfully uploaded ${pdfResourcesToInsert.length} PDF resource(s):`, insertedData);
            }
          } else {
            console.log('No PDF resources to insert (all may have failed upload)');
          }
        } catch (pdfUploadErr) {
          console.warn('Error during PDF upload process:', pdfUploadErr);
          // Don't throw error, course is already created
        }
      }
      
      // Notify all users about the new course
      await notifyUsersAboutNewCourse(courseData.title, courseData.category, courseDataResult.id);
      
      // Navigate to courses list
      navigate('/admin/courses');
    } catch (err: any) {
      console.error('Create course error:', err);
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Course</h2>
      <p className="text-gray-600 mb-8">Enter the basic course information to get started.</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter course title"
          />
            </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Description
                </label>
          <textarea
            value={courseData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what this course covers"
                />
              </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Level
          </label>
                     <select
             value={courseData.level}
             onChange={(e) => handleInputChange('level', e.target.value)}
             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           >
             <option value="beginner">Lv 1 – Beginner</option>
             <option value="intermediate">Lv 2 – Intermediate</option>
             <option value="advanced">Lv 3 – Advanced</option>
             <option value="expert">Lv 4 – Expert</option>
             <option value="mastery">Lv 5 – Mastery</option>
           </select>
                  </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Category
          </label>
          <select
            value={courseData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="business-entrepreneurship">Business & Entrepreneurship</option>
            <option value="branding-public-relations">Branding & Public Relations</option>
            <option value="content-communication">Content & Communication</option>
            <option value="digital-advertising">Digital Advertising</option>
            <option value="email-seo-strategies">Email & SEO Strategies</option>
            <option value="ui-ux-design">UI/UX Design</option>
            <option value="visual-communication">Visual Communication</option>
            <option value="video-editing-creation">Video Editing & Creation</option>
            <option value="data-science-analytics">Data Science & Analytics</option>
            <option value="artificial-intelligence-cloud">Artificial Intelligence & Cloud</option>
            <option value="project-workflow-management">Project & Workflow Management</option>
            <option value="information-security">Information Security</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Type
          </label>
          <select
            value={courseData.access_type}
            onChange={(e) => handleInputChange('access_type', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="free">Free Access</option>
            <option value="membership">Membership Required</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Price (₦) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={courseData.purchase_price || 0}
            onChange={(e) => handleInputChange('purchase_price', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the price in NGN (Nigerian Naira). Set to 0 for free courses.
          </p>
        </div>

      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!courseData.title.trim()}
        className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Continue to Videos
      </button>
      </div>
    );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Add Course Videos</h2>
      <p className="text-gray-600 mb-8 text-center">Manually add videos to your course. You can use YouTube embed links or direct video file URLs.</p>

      {/* Add Video Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Video</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Name *
              </label>
              <input
                type="text"
              value={newVideo.name}
              onChange={(e) => handleVideoInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Introduction to React"
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
              </label>
            <input
              type="text"
              value={newVideo.duration}
              onChange={(e) => handleVideoInputChange('duration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15:30 or 15m 30s"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Link *
              </label>
            <input
              type="url"
              value={newVideo.link}
              onChange={(e) => handleVideoInputChange('link', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="YouTube embed URL or video file URL"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={addVideo}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            + Add New Video
          </button>
          
          <div className="text-sm text-gray-500">
            {courseData.videos.length} video{courseData.videos.length !== 1 ? 's' : ''} added
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
                      )}
                    </div>

      {/* Video List */}
      {courseData.videos.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Course Videos</h3>
                    </div>
          
          <div className="divide-y divide-gray-200">
            {courseData.videos.map((video, index) => (
              <div
                key={video.id}
                className="px-6 py-4 flex items-center justify-between"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleVideoDragOver}
                onDrop={(e) => handleVideoDrop(e, index)}
                onDragEnd={() => setDraggedVideoIndex(null)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                    </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{video.name}</h4>
                    <p className="text-sm text-gray-500">{video.duration}</p>
                    <p className="text-xs text-blue-600 truncate max-w-xs">{video.link}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveVideoUp(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveVideoDown(index)}
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    disabled={index === courseData.videos.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="text-red-600 hover:text-red-800 transition-colors duration-200"
                  >
                    Remove
                  </button>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          ← Back to Course Details
        </button>
        
        <button
          onClick={() => setStep(3)}
          disabled={courseData.videos.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Continue to Resources
        </button>
              </div>
            </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-6 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">📚 Downloadable PDF Resources</h2>
        <p className="text-gray-700 text-lg mb-2 text-center font-semibold">Step 3 of 3: Add PDF Files to Your Course</p>
        <p className="text-gray-600 text-center">Upload PDF files that students can download. This is where you add downloadable resources!</p>
      </div>
      
      {/* PDF Resources Section - Main Upload Area */}
      <div className="bg-white p-8 rounded-lg shadow-lg mb-8 border-4 border-indigo-400">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="h-10 w-10 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Add PDF Resources Here</h3>
          <p className="text-base text-gray-700 mb-1">This is where you upload downloadable PDF files for your course</p>
          <p className="text-sm text-gray-600">Students will be able to download these PDFs from the course page</p>
          <p className="text-sm font-semibold text-indigo-600 mt-2">Maximum file size: 50MB per PDF • Multiple files allowed</p>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
            isPdfDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handlePdfDragOver}
          onDragLeave={handlePdfDragLeave}
          onDrop={handlePdfDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-900">
            Drop PDF files here
          </p>
          <p className="text-sm text-gray-500">
            or click to browse files
          </p>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handlePdfUpload}
            className="hidden"
          />
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            📄 Select PDF Files
          </button>
          <p className="mt-2 text-xs text-gray-500">Maximum file size: 50MB per PDF. You can select multiple PDFs at once.</p>
        </div>

        {/* PDF List */}
        {courseData.pdfResources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Uploaded PDFs ({courseData.pdfResources.length})</h4>
            {courseData.pdfResources.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{pdf.name}</p>
                    <p className="text-sm text-gray-500">{(pdf.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removePdf(pdf.id)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cover Photo Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Cover Photo</h3>
        <p className="text-gray-600 mb-4 text-sm">Upload a cover photo for your course (optional). This will make your course more attractive to students.</p>
      
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          {courseData.coverPhoto ? (
            <div className="space-y-4">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <img 
                  src={URL.createObjectURL(courseData.coverPhoto)} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">{courseData.coverPhoto.name}</p>
              <button
                onClick={() => setCourseData(prev => ({ ...prev, coverPhoto: undefined }))}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <div
              className={`text-center ${
                isDragOver ? 'border-blue-400 bg-blue-50' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900">
                Drop your cover photo here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverPhotoUpload}
        className="hidden"
      />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(2)}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          ← Back to Videos
        </button>
        
        <div className="space-x-4">
          <button
            onClick={handleCreateCourse}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Creating Course...' : 'Create Course'}
          </button>

          <button
            onClick={() => setShowSchedulePopup(true)}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-4"
          >
            ← Back to Admin
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Add New Course</h1>
          <p className="text-gray-600 mt-2">Create a new course with manual video entries</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="space-y-4">
          <div className="flex items-center space-x-4">
              {[
                { number: 1, label: 'Course Details' },
                { number: 2, label: 'Videos' },
                { number: 3, label: '📚 PDF Resources' }
              ].map((stepInfo) => (
                <div key={stepInfo.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= stepInfo.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                      {stepInfo.number}
                </div>
                    <span className={`text-xs mt-1 font-medium ${
                      step >= stepInfo.number ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {stepInfo.label}
                    </span>
                  </div>
                  {stepInfo.number < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                        step > stepInfo.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
            </div>
            ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Schedule Popup Modal */}
        {showSchedulePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Schedule Course</h3>
                <button
                  onClick={() => setShowSchedulePopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <input
                    id="schedule-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowSchedulePopup(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleCourse}
                    disabled={loading || !scheduledDate || !scheduledTime}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Course'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAddCourseWizard;


