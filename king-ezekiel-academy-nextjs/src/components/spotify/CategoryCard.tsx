'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
    gradient?: string;
  };
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const gradientClass = category.gradient || 'from-primary-600 to-accent-600';

  return (
    <Link href={`/courses?category=${category.id}`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group cursor-pointer"
      >
        <div className={`bg-gradient-to-br ${gradientClass} rounded-lg p-6 min-w-[180px] h-[180px] flex flex-col justify-between hover:shadow-xl transition-shadow`}>
          <div>
            {category.icon && (
              <div className="text-white text-4xl mb-4">
                {category.icon}
              </div>
            )}
            <h3 className="text-white font-bold text-lg mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-white/80 text-sm line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;

