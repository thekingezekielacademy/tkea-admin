import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Interfaces
interface Course {
  id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  level?: string;
  category?: string;
  status?: string;
  purchase_price?: number;
  access_type?: string;
}

interface SelectedCourse {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  level?: string;
  category?: string;
  order_index: number;
  is_required: boolean;
  purchase_price?: number; // Store course price for calculation
}

interface LearningPathData {
  // Step 1: Basic Info
  title: string;
  description: string;
  coverPhoto?: File;
  gradient?: string;
  category: string;
  level: string;
  instructor?: string;
  duration?: string;
  
  // Step 2: Pricing & Access
  purchase_price: number;
  access_type: 'free' | 'purchase';
  
  // Step 3: Course Selection
  selectedCourses: SelectedCourse[];
  
  // Step 4: Status
  status: 'draft' | 'published';
}

const AddLearningPathWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 3: Course selection state
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [draggedCourseIndex, setDraggedCourseIndex] = useState<number | null>(null);

  // Learning path data state
  const [pathData, setPathData] = useState<LearningPathData>({
    title: '',
    description: '',
    coverPhoto: undefined,
    gradient: '',
    category: 'business-entrepreneurship',
    level: 'beginner',
    instructor: '',
    duration: '',
    purchase_price: 0,
    access_type: 'purchase',
    selectedCourses: [],
    status: 'draft'
  });

  // Admin check
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Step navigation handlers
  const handleNext = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!pathData.title.trim()) {
        setError('Please enter a learning path title');
        return;
      }
      if (pathData.title.trim().length < 3) {
        setError('Title must be at least 3 characters');
        return;
      }
    }
    
    if (step === 2) {
      if (pathData.access_type === 'purchase' && pathData.purchase_price <= 0) {
        setError('Please enter a valid price greater than 0 for purchase access');
        return;
      }
    }
    
    if (step === 3) {
      if (pathData.selectedCourses.length === 0) {
        setError('Please select at least one course for the learning path');
        return;
      }
    }
    
    if (step < 4) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/admin/learning-paths');
    }
  };

  // Create/Save Learning Path
  const handleCreateLearningPath = async () => {
    // Validate all required fields
    if (!pathData.title.trim()) {
      setError('Please enter a learning path title');
      return;
    }

    if (pathData.title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    if (pathData.selectedCourses.length === 0) {
      setError('Please select at least one course for the learning path');
      return;
    }

    if (pathData.access_type === 'purchase' && pathData.purchase_price <= 0) {
      setError('Please enter a valid price greater than 0 for purchase access');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let coverPhotoUrl: string | null = null;

      // Upload cover photo if provided
      if (pathData.coverPhoto) {
        try {
          const fileExt = pathData.coverPhoto.name.split('.').pop();
          const fileName = `learning-path-${Date.now()}.${fileExt}`;
          const filePath = fileName;

          console.log('Uploading learning path cover photo:', {
            name: pathData.coverPhoto.name,
            type: pathData.coverPhoto.type,
            size: pathData.coverPhoto.size,
            path: filePath
          });

          // Convert to ArrayBuffer
          const arrayBuffer = await pathData.coverPhoto.arrayBuffer();
          
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

      // Create the learning path record
      console.log('Creating learning path with data:', {
        title: pathData.title,
        description: pathData.description,
        category: pathData.category,
        level: pathData.level,
        access_type: pathData.access_type,
        purchase_price: pathData.purchase_price,
        status: pathData.status,
        created_by: user?.id
      });

      const learningPathData = {
        title: pathData.title.trim(),
        description: pathData.description.trim() || null,
        cover_photo_url: coverPhotoUrl,
        gradient: pathData.gradient?.trim() || null,
        category: pathData.category,
        level: pathData.level,
        instructor: pathData.instructor?.trim() || null,
        duration: pathData.duration?.trim() || null,
        purchase_price: pathData.purchase_price || 0,
        access_type: pathData.access_type,
        status: pathData.status,
        created_by: user?.id,
        estimated_course_count: pathData.selectedCourses.length
      };

      const { data: createdPath, error: pathError } = await supabase
        .from('learning_paths')
        .insert(learningPathData)
        .select()
        .single();

      if (pathError) {
        throw new Error(`Failed to create learning path: ${pathError.message}`);
      }

      console.log('Learning path created successfully:', createdPath);

      // Create course associations
      const courseAssociations = pathData.selectedCourses
        .sort((a, b) => a.order_index - b.order_index)
        .map((course) => ({
          learning_path_id: createdPath.id,
          course_id: course.course_id,
          order_index: course.order_index,
          is_required: course.is_required
        }));

      console.log('Creating course associations:', courseAssociations);

      const { error: coursesError } = await supabase
        .from('learning_path_courses')
        .insert(courseAssociations);

      if (coursesError) {
        // Rollback: Delete the learning path if course associations fail
        console.error('Failed to create course associations, rolling back...');
        await supabase
          .from('learning_paths')
          .delete()
          .eq('id', createdPath.id);
        
        throw new Error(`Failed to link courses to learning path: ${coursesError.message}`);
      }

      console.log('Course associations created successfully');

      // Success!
      setSuccess(
        `Learning path "${pathData.title}" has been ${pathData.status === 'published' ? 'published' : 'saved as draft'} successfully!`
      );

      // Navigate to learning paths list after a short delay
      setTimeout(() => {
        navigate('/admin/learning-paths');
      }, 1500);

    } catch (err: any) {
      console.error('Create learning path error:', err);
      setError(err.message || 'Failed to create learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Input change handlers
  const handleInputChange = <K extends keyof LearningPathData>(
    field: K,
    value: LearningPathData[K]
  ) => {
    setPathData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Cover photo upload handlers
  const handleCoverPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB for learning paths)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Please select a file smaller than 5MB');
        return;
      }
      
      handleInputChange('coverPhoto', file);
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
      // Validate file size (max 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Please select a file smaller than 5MB');
        return;
      }
      
      handleInputChange('coverPhoto', imageFile);
    } else {
      setError('Please drop a valid image file');
    }
  }, []);

  const removeCoverPhoto = () => {
    handleInputChange('coverPhoto', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch available courses for Step 3
  const fetchAvailableCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setError('');
      
      // For admin, fetch all courses (admins can see all statuses)
      // Include purchase_price to calculate actual price
      let query = supabase
        .from('courses')
        .select('id, title, description, cover_photo_url, level, category, status, purchase_price, access_type')
        .order('created_at', { ascending: false });

      // Apply category filter
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      // Apply level filter
      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel);
      }

      // Apply status filter - prefer published, but show all for admin
      query = query.in('status', ['published', 'draft', 'scheduled']);

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Normalize course prices (handle kobo/naira conversion)
      const normalizeCoursePrice = (raw: number) => {
        if (typeof raw !== 'number' || isNaN(raw)) return 0;
        // If amount is >= 100000, it's likely in kobo (250000 kobo = 2500 naira)
        if (raw >= 100000 && raw % 100 === 0) {
          return Math.round(raw / 100);
        }
        // If amount is between 100 and 10000, it's likely already in naira
        if (raw >= 100 && raw < 10000) {
          return raw;
        }
        // Default: keep as-is
        return raw;
      };

      // Normalize prices for all courses
      const normalizedCourses = (data || []).map(course => ({
        ...course,
        purchase_price: normalizeCoursePrice(course.purchase_price || 0)
      }));

      // For learning paths, prefer published courses but allow all for admin flexibility
      // Filter to show published first, then others
      const courses = normalizedCourses.sort((a, b) => {
        if (a.status === 'published' && b.status !== 'published') return -1;
        if (a.status !== 'published' && b.status === 'published') return 1;
        return 0;
      });
      
      setAvailableCourses(courses);
      
      if (courses.length === 0) {
        setError('No courses found. Please create some courses first.');
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      
      // More specific error messages
      if (err.message?.includes('timeout') || err.message?.includes('Failed to fetch')) {
        setError('Network timeout. Please check your internet connection and try again.');
      } else if (err.message?.includes('permission') || err.message?.includes('RLS')) {
        setError('Permission denied. Please ensure you have admin access.');
      } else {
        setError(`Failed to load available courses: ${err.message || 'Unknown error'}`);
      }
      
      // Set empty array to prevent UI errors
      setAvailableCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [searchTerm, filterCategory, filterLevel]);

  // Fetch courses when entering Step 3 or filters change
  useEffect(() => {
    if (step === 3 && user?.role === 'admin') {
      fetchAvailableCourses();
    }
  }, [step, searchTerm, filterCategory, filterLevel, user?.role, fetchAvailableCourses]);

  // Course selection functions
  const addCourseToPath = (course: Course) => {
    // Check if course is already selected
    const isAlreadySelected = pathData.selectedCourses.some(
      sc => sc.course_id === course.id
    );
    
    if (isAlreadySelected) {
      setError('This course is already in the learning path');
      return;
    }

    const newSelectedCourse: SelectedCourse = {
      id: Math.random().toString(36).substr(2, 9),
      course_id: course.id,
      title: course.title,
      description: course.description,
      cover_photo_url: course.cover_photo_url,
      level: course.level,
      category: course.category,
      order_index: pathData.selectedCourses.length,
      is_required: true,
      purchase_price: course.purchase_price || 0 // Store course price for actual price calculation
    };

    setPathData(prev => ({
      ...prev,
      selectedCourses: [...prev.selectedCourses, newSelectedCourse]
    }));
    setError('');
  };

  // Normalize amount (handle both kobo and naira formats)
  const normalizeAmount = useCallback((raw: number) => {
    if (typeof raw !== 'number' || isNaN(raw)) return 0;
    
    // If amount is >= 100000, it's likely in kobo (250000 kobo = 2500 naira)
    if (raw >= 100000 && raw % 100 === 0) {
      return Math.round(raw / 100);
    }
    
    // If amount is between 100 and 10000, it's likely already in naira (keep as-is)
    // Common course price: 2500 naira
    if (raw >= 100 && raw < 10000) {
      return raw;
    }
    
    // If amount is very small (< 100), might be legacy divide (e.g., 25 → 2500)
    if (raw > 0 && raw < 100) {
      return raw * 100; // fix legacy 25 → 2500
    }
    
    // Default: keep as-is
    return raw;
  }, []);

  // Calculate actual price (sum of all course prices) - with normalization
  const calculateActualPrice = useCallback(() => {
    return pathData.selectedCourses.reduce((total, course) => {
      // Normalize course price and add to total
      const normalizedPrice = normalizeAmount(course.purchase_price || 0);
      return total + normalizedPrice;
    }, 0);
  }, [pathData.selectedCourses, normalizeAmount]);

  // Calculate discount percentage
  const calculateDiscount = useCallback(() => {
    const actualPrice = calculateActualPrice();
    if (actualPrice === 0 || pathData.purchase_price === 0) return 0;
    if (pathData.purchase_price >= actualPrice) return 0;
    return Math.round(((actualPrice - pathData.purchase_price) / actualPrice) * 100);
  }, [calculateActualPrice, pathData.purchase_price]);

  const removeCourseFromPath = (courseId: string) => {
    setPathData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses
        .filter(sc => sc.id !== courseId)
        .map((sc, index) => ({ ...sc, order_index: index }))
    }));
  };

  const toggleCourseRequired = (courseId: string) => {
    setPathData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.map(sc =>
        sc.id === courseId ? { ...sc, is_required: !sc.is_required } : sc
      )
    }));
  };

  // Drag and drop for course reordering
  const handleCourseDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCourseIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCourseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCourseDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedCourseIndex === null || draggedCourseIndex === dropIndex) {
      setDraggedCourseIndex(null);
      return;
    }

    setPathData(prev => {
      const newCourses = [...prev.selectedCourses];
      const draggedCourse = newCourses[draggedCourseIndex];
      
      // Remove dragged course from original position
      newCourses.splice(draggedCourseIndex, 1);
      
      // Insert at new position
      newCourses.splice(dropIndex, 0, draggedCourse);
      
      // Update order_index for all courses
      const reorderedCourses = newCourses.map((course, index) => ({
        ...course,
        order_index: index
      }));

      return { ...prev, selectedCourses: reorderedCourses };
    });
    
    setDraggedCourseIndex(null);
  };

  const moveCourseUp = (index: number) => {
    if (index === 0) return;
    setPathData(prev => {
      const newCourses = [...prev.selectedCourses];
      [newCourses[index], newCourses[index - 1]] = [newCourses[index - 1], newCourses[index]];
      
      const reorderedCourses = newCourses.map((course, idx) => ({
        ...course,
        order_index: idx
      }));

      return { ...prev, selectedCourses: reorderedCourses };
    });
  };

  const moveCourseDown = (index: number) => {
    setPathData(prev => {
      if (index === prev.selectedCourses.length - 1) return prev;
      const newCourses = [...prev.selectedCourses];
      [newCourses[index], newCourses[index + 1]] = [newCourses[index + 1], newCourses[index]];
      
      const reorderedCourses = newCourses.map((course, idx) => ({
        ...course,
        order_index: idx
      }));

      return { ...prev, selectedCourses: reorderedCourses };
    });
  };

  // Step 1: Basic Information
  const renderStep1 = () => {
    const validateStep1 = () => {
      if (!pathData.title.trim()) {
        setError('Please enter a learning path title');
        return false;
      }
      if (pathData.title.trim().length < 3) {
        setError('Title must be at least 3 characters');
        return false;
      }
      return true;
    };

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Basic Information</h2>
        <p className="text-gray-600 mb-8 text-center">Enter the basic details for your learning path</p>
        
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Path Title *
            </label>
            <input
              type="text"
              value={pathData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Complete Digital Marketing Mastery"
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">{pathData.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={pathData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe what students will learn in this learning path..."
            />
            {pathData.description && pathData.description.length < 50 && (
              <p className="mt-1 text-sm text-yellow-600">Consider adding more details (at least 50 characters recommended)</p>
            )}
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            {pathData.coverPhoto ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(pathData.coverPhoto)}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  onClick={removeCoverPhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  title="Remove cover photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoUpload}
                  className="hidden"
                  id="cover-photo-upload"
                />
                <label
                  htmlFor="cover-photo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-12 h-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </label>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={pathData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="business-entrepreneurship">Business & Entrepreneurship</option>
              <option value="marketing">Marketing</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="data">Data</option>
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <select
              value={pathData.level}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="beginner">Lv 1 – Beginner</option>
              <option value="intermediate">Lv 2 – Intermediate</option>
              <option value="advanced">Lv 3 – Advanced</option>
              <option value="expert">Lv 4 – Expert</option>
              <option value="mastery">Lv 5 – Mastery</option>
            </select>
          </div>

          {/* Gradient (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gradient CSS Class (Optional)
            </label>
            <input
              type="text"
              value={pathData.gradient || ''}
              onChange={(e) => handleInputChange('gradient', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., from-purple-700 to-pink-700"
            />
            <p className="mt-1 text-sm text-gray-500">CSS gradient class for styling (optional)</p>
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructor Name (Optional)
            </label>
            <input
              type="text"
              value={pathData.instructor || ''}
              onChange={(e) => handleInputChange('instructor', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., King Ezekiel Academy"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (Optional)
            </label>
            <input
              type="text"
              value={pathData.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., 30 days, 4 weeks, 2 months"
            />
            <p className="mt-1 text-sm text-gray-500">Human-readable duration estimate</p>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Pricing & Access
  const renderStep2 = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Pricing & Access</h2>
        <p className="text-gray-600 mb-8 text-center">Set the access type and pricing for your learning path</p>
        
        <div className="space-y-6">
          {/* Access Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Type *
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="access_type"
                  value="free"
                  checked={pathData.access_type === 'free'}
                  onChange={(e) => handleInputChange('access_type', e.target.value as 'free' | 'purchase')}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Free Access</span>
                  <p className="text-sm text-gray-500">Available to all users at no cost</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="access_type"
                  value="purchase"
                  checked={pathData.access_type === 'purchase'}
                  onChange={(e) => handleInputChange('access_type', e.target.value as 'free' | 'purchase')}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Purchase Required</span>
                  <p className="text-sm text-gray-500">Users must purchase to access</p>
                </div>
              </label>
            </div>
          </div>

          {/* Pricing Section */}
          {pathData.access_type === 'purchase' && (
            <div className="space-y-6">
              {/* Actual Price (Calculated) - Show if courses are already selected */}
              {pathData.selectedCourses.length > 0 && calculateActualPrice() > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Actual Price (Total of All Courses)
                  </label>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      ₦{calculateActualPrice().toLocaleString('en-NG')}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Sum of {pathData.selectedCourses.length} course{pathData.selectedCourses.length !== 1 ? 's' : ''} prices
                    </p>
                  </div>
                </div>
              )}

              {/* Selling Price (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pathData.purchase_price || 0}
                    onChange={(e) => handleInputChange('purchase_price', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  The discounted/selling price customers will pay for this learning path bundle.
                </p>
                {pathData.selectedCourses.length === 0 && (
                  <p className="mt-1 text-sm text-blue-600">
                    💡 Select courses in the next step to see the actual price (sum of all course prices).
                  </p>
                )}
                
                {/* Discount Display */}
                {pathData.selectedCourses.length > 0 && calculateActualPrice() > 0 && pathData.purchase_price > 0 && pathData.purchase_price < calculateActualPrice() && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-900">Discount:</span>
                      <span className="text-lg font-bold text-green-700">
                        {calculateDiscount()}% OFF
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Save ₦{(calculateActualPrice() - pathData.purchase_price).toLocaleString('en-NG')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step 3: Course Selection
  const renderStep3 = () => {
    // Filter available courses to exclude already selected ones
    const filteredAvailableCourses = availableCourses.filter(
      course => !pathData.selectedCourses.some(sc => sc.course_id === course.id)
    );

    // Check if course is selected
    const isCourseSelected = (courseId: string) => {
      return pathData.selectedCourses.some(sc => sc.course_id === courseId);
    };

    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Course Selection</h2>
        <p className="text-gray-600 mb-8 text-center">Select and arrange courses for your learning path</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Available Courses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h3>
            
            {/* Search and Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="business-entrepreneurship">Business & Entrepreneurship</option>
                    <option value="marketing">Marketing</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="data">Data</option>
                  </select>
                </div>
                
                <div>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                    <option value="mastery">Mastery</option>
                  </select>
                </div>
              </div>
              
              {/* Clear Filters */}
              {(searchTerm || filterCategory !== 'all' || filterLevel !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('all');
                    setFilterLevel('all');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Available Courses List */}
            {coursesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading courses...</p>
              </div>
            ) : filteredAvailableCourses.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  {searchTerm || filterCategory !== 'all' || filterLevel !== 'all'
                    ? 'No courses found matching your filters'
                    : availableCourses.length === 0
                    ? 'No published courses available'
                    : 'All available courses have been added'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredAvailableCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      {course.cover_photo_url ? (
                        <img
                          src={course.cover_photo_url}
                          alt={course.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{course.title}</h4>
                        {course.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          {course.purchase_price !== undefined && course.purchase_price > 0 && (
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                              ₦{course.purchase_price.toLocaleString('en-NG')}
                            </span>
                          )}
                          {course.access_type === 'free' && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                              Free
                            </span>
                          )}
                          {course.level && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {course.level}
                            </span>
                          )}
                          {course.category && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {course.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addCourseToPath(course)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Selected Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Courses ({pathData.selectedCourses.length})
              </h3>
              {pathData.selectedCourses.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Remove all courses from the learning path?')) {
                      setPathData(prev => ({ ...prev, selectedCourses: [] }));
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {pathData.selectedCourses.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">No courses selected</p>
                <p className="text-xs text-gray-500 mt-1">Add courses from the left panel</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pathData.selectedCourses
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((selectedCourse, index) => (
                    <div
                      key={selectedCourse.id}
                      draggable
                      onDragStart={(e) => handleCourseDragStart(e, index)}
                      onDragOver={handleCourseDragOver}
                      onDrop={(e) => handleCourseDrop(e, index)}
                      onDragEnd={() => setDraggedCourseIndex(null)}
                      className={`bg-white border-2 rounded-lg p-4 transition-all ${
                        draggedCourseIndex === index
                          ? 'opacity-50 border-indigo-500'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Drag Handle */}
                        <div className="flex flex-col items-center pt-1">
                          <svg
                            className="w-5 h-5 text-gray-400 cursor-move"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-500 mt-1">{index + 1}</span>
                        </div>

                        {/* Course Image */}
                        {selectedCourse.cover_photo_url ? (
                          <img
                            src={selectedCourse.cover_photo_url}
                            alt={selectedCourse.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}

                        {/* Course Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{selectedCourse.title}</h4>
                          
                          {/* Course Price and Required/Optional Toggle */}
                          <div className="mt-2 flex items-center space-x-2">
                            {selectedCourse.purchase_price !== undefined && selectedCourse.purchase_price > 0 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                ₦{selectedCourse.purchase_price.toLocaleString('en-NG')}
                              </span>
                            )}
                            <button
                              onClick={() => toggleCourseRequired(selectedCourse.id)}
                              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                selectedCourse.is_required
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {selectedCourse.is_required ? 'Required' : 'Optional'}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end space-y-2">
                          {/* Move Buttons */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => moveCourseUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveCourseDown(index)}
                              disabled={index === pathData.selectedCourses.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeCourseFromPath(selectedCourse.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Remove"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Preview & Publish
  const renderStep4 = () => {
    const formatCurrency = (amount: number) => {
      return `₦${amount.toLocaleString('en-NG')}`;
    };

    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Preview & Publish</h2>
        <p className="text-gray-600 mb-8 text-center">Review your learning path before publishing</p>
        
        <div className="space-y-6">
          {/* Basic Info Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Photo Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                {pathData.coverPhoto ? (
                  <img
                    src={URL.createObjectURL(pathData.coverPhoto)}
                    alt="Cover preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center border-2 border-gray-300">
                    <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900 font-semibold">{pathData.title || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-600">{pathData.category || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <p className="text-gray-600 capitalize">{pathData.level || 'Not set'}</p>
                </div>

                {pathData.instructor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                    <p className="text-gray-600">{pathData.instructor}</p>
                  </div>
                )}

                {pathData.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-gray-600">{pathData.duration}</p>
                  </div>
                )}
              </div>
            </div>

            {pathData.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 whitespace-pre-wrap">{pathData.description}</p>
              </div>
            )}
          </div>

          {/* Pricing & Access Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Access</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  pathData.access_type === 'free'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {pathData.access_type === 'free' ? 'Free Access' : 'Purchase Required'}
                </span>
              </div>

              {pathData.access_type === 'purchase' && (
                <div className="space-y-4">
                  {/* Actual Price */}
                  {pathData.selectedCourses.length > 0 && calculateActualPrice() > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Price</label>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(calculateActualPrice())}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Total of {pathData.selectedCourses.length} course{pathData.selectedCourses.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Selling Price */}
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-indigo-900 mb-2">Selling Price</label>
                    <p className="text-3xl font-bold text-indigo-900">
                      {formatCurrency(pathData.purchase_price)}
                    </p>
                  </div>

                  {/* Discount Display */}
                  {calculateActualPrice() > 0 && pathData.purchase_price < calculateActualPrice() && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">Discount</p>
                          <p className="text-2xl font-bold text-green-700">
                            {calculateDiscount()}% OFF
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-700">You Save</p>
                          <p className="text-xl font-bold text-green-700">
                            {formatCurrency(calculateActualPrice() - pathData.purchase_price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Courses Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Courses ({pathData.selectedCourses.length})
            </h3>
            
            {pathData.selectedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No courses selected</p>
            ) : (
              <div className="space-y-3">
                {pathData.selectedCourses
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      
                      {course.cover_photo_url ? (
                        <img
                          src={course.cover_photo_url}
                          alt={course.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{course.title}</h4>
                        {course.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            course.is_required
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {course.is_required ? 'Required' : 'Optional'}
                          </span>
                          {course.level && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {course.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication Status</h3>
            
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={pathData.status === 'draft'}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Save as Draft</span>
                  <p className="text-sm text-gray-500">Save without publishing. You can publish later.</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={pathData.status === 'published'}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Publish Now</span>
                  <p className="text-sm text-gray-500">Make this learning path available to all users immediately.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-indigo-600">{pathData.selectedCourses.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Required Courses</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {pathData.selectedCourses.filter(c => c.is_required).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Optional Courses</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {pathData.selectedCourses.filter(c => !c.is_required).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Access Type</p>
                <p className="text-lg font-semibold text-indigo-600 capitalize">{pathData.access_type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Progress indicator component
  const renderProgressIndicator = () => {
    const steps = [
      { number: 1, label: 'Basic Info' },
      { number: 2, label: 'Pricing' },
      { number: 3, label: 'Courses' },
      { number: 4, label: 'Preview' }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step === s.number
                      ? 'bg-indigo-600 text-white'
                      : step > s.number
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s.number ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step === s.number ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-colors ${
                    step > s.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Learning Path</h1>
            <p className="text-gray-600">Build a curated collection of courses for your students</p>
          </div>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>

            <div className="flex space-x-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
              )}
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <div className="flex space-x-3">
                  {pathData.status === 'draft' && (
                    <button
                      onClick={handleCreateLearningPath}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save as Draft'}
                    </button>
                  )}
                  <button
                    onClick={handleCreateLearningPath}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Saving...' : pathData.status === 'published' ? 'Publish Now' : 'Save & Publish'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLearningPathWizard;
