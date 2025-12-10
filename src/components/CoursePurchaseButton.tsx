import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GuestCheckout from './GuestCheckout';
import { useCourseAccess } from '../hooks/useCourseAccess';

interface CoursePurchaseButtonProps {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  accessType: 'free' | 'purchase';
  className?: string;
}

const CoursePurchaseButton: React.FC<CoursePurchaseButtonProps> = ({
  courseId,
  courseTitle,
  coursePrice,
  accessType,
  className = '',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading } = useCourseAccess(courseId);
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);

  // Free courses - show access button
  if (accessType === 'free') {
    return (
      <button
        onClick={() => navigate(`/course/${courseId}`)}
        className={`w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors ${className}`}
      >
        Access Free Course
      </button>
    );
  }

  // User has access - show continue button
  if (hasAccess) {
    return (
      <button
        onClick={() => navigate(`/course/${courseId}`)}
        className={`w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
      >
        Continue Learning
      </button>
    );
  }

  // User is signed in but doesn't have access - show purchase button
  if (user) {
    return (
      <button
        onClick={() => setShowGuestCheckout(true)}
        className={`w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
      >
        Purchase Course - ₦{coursePrice.toLocaleString('en-NG')}
      </button>
    );
  }

  // Guest user - show guest checkout button
  return (
    <>
      <button
        onClick={() => setShowGuestCheckout(true)}
        className={`w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors ${className}`}
      >
        Buy Now - ₦{coursePrice.toLocaleString('en-NG')}
      </button>

      {showGuestCheckout && (
        <GuestCheckout
          courseId={courseId}
          courseTitle={courseTitle}
          coursePrice={coursePrice}
          onSuccess={() => {
            setShowGuestCheckout(false);
            navigate(`/course/${courseId}`);
          }}
          onCancel={() => setShowGuestCheckout(false)}
        />
      )}
    </>
  );
};

export default CoursePurchaseButton;
