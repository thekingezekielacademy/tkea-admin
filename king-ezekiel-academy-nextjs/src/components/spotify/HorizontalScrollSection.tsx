'use client';
import React, { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showNavigation?: boolean;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  title,
  subtitle,
  children,
  showNavigation = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 400;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-secondary-400 text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative">
        {showNavigation && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-secondary-700 hover:bg-secondary-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-secondary-700 hover:bg-secondary-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
              aria-label="Scroll right"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default HorizontalScrollSection;

