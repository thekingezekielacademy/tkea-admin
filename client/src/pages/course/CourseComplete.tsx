import React from 'react';
import { useHistory, useParams } from 'react-router-dom';

const CourseComplete: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Course Completed!</h1>
        <p className="text-gray-600 mt-2">You unlocked your badge and certificate.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700">Download Certificate</button>
          <button className="border px-5 py-2 rounded-lg hover:bg-gray-50">Share Achievement</button>
        </div>
        <div className="mt-10">
          <button onClick={() => history.push('/courses')} className="text-primary-700 hover:underline">Explore Recommended Courses</button>
        </div>
      </div>
    </div>
  );
};

export default CourseComplete;


