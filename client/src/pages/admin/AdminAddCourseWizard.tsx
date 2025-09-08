import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Video {
  id: string;
  name: string;
  duration: string;
  link: string;
}

interface CourseData {
  title: string;
  description: string;
  level: string;
  category: string;
  coverPhoto?: File;
  videos: Video[];
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
    coverPhoto: undefined,
    videos: []
  });

  const [newVideo, setNewVideo] = useState({ name: '', duration: '', link: '' });
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);

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

  const handleInputChange = (field: keyof CourseData, value: string) => {
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
      setCourseData(prev => ({ ...prev, coverPhoto: file }));
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
      setCourseData(prev => ({ ...prev, coverPhoto: imageFile }));
    }
  }, []);

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
          const filePath = `course-covers/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(filePath, courseData.coverPhoto);

          if (uploadError) {
            console.warn('Cover photo upload failed, continuing without it:', uploadError.message);
            // Don't throw error, just continue without cover photo
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('course-covers')
              .getPublicUrl(filePath);

            coverPhotoUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Cover photo upload failed, continuing without it:', uploadErr);
          // Don't throw error, just continue without cover photo
        }
      }

      // Create the course
      console.log('About to create course with data:', {
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        category: courseData.category,
        levelType: typeof courseData.level,
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
          Continue to Cover Photo
        </button>
              </div>
            </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Add Course Cover Photo</h2>
      <p className="text-gray-600 mb-8">Upload a cover photo for your course (optional). This will make your course more attractive to students.</p>
      
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
            onClick={handleCreateCourse}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            {loading ? 'Creating...' : 'Skip Cover Photo'}
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
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
            </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default AdminAddCourseWizard;


