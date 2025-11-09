'use client';
import React from 'react';
import Link from 'next/link';
import { FaClock, FaBook, FaStar, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    instructor?: string;
    cover_photo_url?: string;
    duration?: string;
    lessons?: number;
    rating?: number;
    price?: string;
    level?: string;
    category?: string;
    status?: string;
    is_scheduled?: boolean;
    access_type?: 'free' | 'membership';
  };
  showBadge?: boolean;
  badgeText?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  showBadge = false, 
  badgeText = 'New' 
}) => {
  const isScheduled = course.status === 'scheduled' || course.is_scheduled;

  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    const levelConfig: Record<string, { label: string; color: string }> = {
      beginner: { label: 'Beginner', color: 'bg-success-500' },
      intermediate: { label: 'Intermediate', color: 'bg-warning-500' },
      advanced: { label: 'Advanced', color: 'bg-error-500' },
      expert: { label: 'Expert', color: 'bg-purple-500' },
    };
    
    const config = levelConfig[level.toLowerCase()] || levelConfig.beginner;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleClick = () => {
    if (isScheduled) {
      return;
    }
    window.location.href = `/course/${course.id}`;
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="bg-secondary-800 rounded-lg p-4 hover:bg-secondary-700 transition-colors duration-200">
        {/* Course Image */}
        <div className="relative mb-4">
          <div className="aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-br from-primary-900 to-accent-600">
            {course.cover_photo_url ? (
              <img
                src={course.cover_photo_url}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {course.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {showBadge && (
            <div className="absolute top-2 left-2">
              <span className="bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {badgeText}
              </span>
            </div>
          )}
          {course.level && (
            <div className="absolute top-2 right-2">
              {getLevelBadge(course.level)}
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-accent-400 transition-colors">
            {course.title}
          </h3>
          
          {course.instructor && (
            <p className="text-secondary-400 text-xs line-clamp-1">
              {course.instructor}
            </p>
          )}

          {/* Course Meta */}
          <div className="flex items-center justify-between text-xs text-secondary-400">
            <div className="flex items-center gap-3">
              {course.duration && (
                <div className="flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.lessons && (
                <div className="flex items-center gap-1">
                  <FaBook className="w-3 h-3" />
                  <span>{course.lessons}</span>
                </div>
              )}
            </div>
            {course.rating && (
              <div className="flex items-center gap-1">
                <FaStar className="w-3 h-3 text-accent-400" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {course.price && (
            <div className="pt-2">
              <span className="text-white font-bold text-sm">
                {course.access_type === 'free' ? 'Free' : `₦${course.price}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;

