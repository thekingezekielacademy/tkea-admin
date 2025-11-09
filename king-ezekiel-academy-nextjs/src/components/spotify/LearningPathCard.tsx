'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaBook } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface LearningPathCardProps {
  path: {
    id: string;
    title: string;
    description: string;
    courseCount: number;
    duration?: string;
    coverImage?: string;
    gradient?: string;
    firstCourseId?: string | null;
    courseIds?: string[];
  };
}

const LearningPathCard: React.FC<LearningPathCardProps> = ({ path }) => {
  const router = useRouter();
  const gradientClass = path.gradient || 'from-primary-700 to-accent-700';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If we have a first course, navigate to it
    // Otherwise, navigate to courses page with category filter
    if (path.firstCourseId) {
      router.push(`/course/${path.firstCourseId}`);
    } else {
      router.push(`/courses?category=${path.id}`);
    }
  };

  return (
    <div onClick={handleClick}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer"
      >
        <div className={`bg-gradient-to-br ${gradientClass} rounded-lg p-6 min-w-[300px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-shadow relative overflow-hidden`}>
          {path.coverImage ? (
            <img
              src={path.coverImage}
              alt={path.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          ) : (
            <div className="absolute inset-0 bg-black/20" />
          )}
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <FaBook className="text-white/80 w-4 h-4" />
              <span className="text-white/80 text-sm">
                {path.courseCount} courses
              </span>
            </div>
            <h3 className="text-white font-bold text-xl mb-2">
              {path.title}
            </h3>
            <p className="text-white/80 text-sm line-clamp-2 mb-4">
              {path.description}
            </p>
            {path.duration && (
              <p className="text-white/60 text-xs mb-4">
                {path.duration}
              </p>
            )}
            <div className="flex items-center text-white font-medium text-sm group-hover:translate-x-1 transition-transform">
              <span>Start Learning</span>
              <FaArrowRight className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LearningPathCard;

