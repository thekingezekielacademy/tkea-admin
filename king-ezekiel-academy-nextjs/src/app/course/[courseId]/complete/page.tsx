'use client'
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaDownload, FaShare, FaTrophy, FaCertificate, FaArrowLeft } from 'react-icons/fa';

const CourseComplete: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const handleDownloadCertificate = () => {
    // Implement certificate download logic
    console.log('Downloading certificate for course:', courseId);
  };

  const handleShareAchievement = () => {
    // Implement social sharing logic
    console.log('Sharing achievement for course:', courseId);
  };

  const handleExploreCourses = () => {
    router.push('/courses');
  };

  const handleBackToCourse = () => {
    router.push(`/course/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="text-8xl mb-4">🎉</div>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
              <FaTrophy className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Main Content */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Course Completed!
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Congratulations! You've successfully completed this course and unlocked your badge and certificate.
          </p>

          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-gray-600">Course Completion</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">8h</div>
              <div className="text-gray-600">Total Learning Time</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
              <div className="text-gray-600">Lessons Completed</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaCertificate className="h-5 w-5 mr-3" />
              Download Certificate
            </button>
            
            <button
              onClick={handleShareAchievement}
              className="flex items-center px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaShare className="h-5 w-5 mr-3" />
              Share Achievement
            </button>
          </div>

          {/* Certificate Preview */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 border border-gray-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <FaCertificate className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Certificate of Completion</h3>
              <p className="text-gray-600 mb-6">Digital Marketing Fundamentals</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                <div className="text-6xl mb-4">🏆</div>
                <div className="text-lg font-semibold text-gray-700 mb-2">This certifies that</div>
                <div className="text-2xl font-bold text-primary-600 mb-4">John Doe</div>
                <div className="text-lg text-gray-600 mb-4">has successfully completed the course</div>
                <div className="text-xl font-bold text-gray-800 mb-4">Digital Marketing Fundamentals</div>
                <div className="text-sm text-gray-500">Completed on {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Continue Learning</h4>
                <p className="text-gray-600 mb-4">Explore more courses to expand your skills and knowledge.</p>
                <button
                  onClick={handleExploreCourses}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Browse All Courses →
                </button>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Build Your Portfolio</h4>
                <p className="text-gray-600 mb-4">Add this certificate to your professional portfolio.</p>
                <button
                  onClick={() => router.push('/profile')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Profile →
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleBackToCourse}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </button>
            
            <button
              onClick={handleExploreCourses}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Explore Recommended Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseComplete;
