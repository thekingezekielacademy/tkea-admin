import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdvancedVideoPlayer from './AdvancedVideoPlayer';

interface SessionData {
  id: string;
  live_class_id: string;
  course_video_id?: string;
  video_url?: string;
  video_title?: string;
  video_description?: string;
  session_type: string;
  scheduled_datetime: string;
  status: string;
  is_free: boolean;
  live_classes: {
    course_id?: string;
    title?: string;
    description?: string;
    courses?: { title: string };
  };
  course_videos?: {
    name: string;
    order_index: number;
    link: string;
  };
}

const LiveClassSessionView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError('');

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/admin/live-booth/public/session/${sessionId}`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch session');
      }

      setSession(result.data);
    } catch (err: any) {
      console.error('Error fetching session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const isYouTubeVideo = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com');
  };

  const getVideoUrl = () => {
    if (!session) return null;
    
    // For standalone classes, use video_url
    if (session.video_url) {
      return session.video_url;
    }
    
    // For course-based classes, use course_videos.link
    if (session.course_videos?.link) {
      return session.course_videos.link;
    }
    
    return null;
  };

  const getVideoSource = () => {
    const url = getVideoUrl();
    if (!url) return { type: null, src: null };
    
    if (isYouTubeVideo(url)) {
      return { type: 'youtube' as const, src: getYouTubeVideoId(url) };
    }
    
    return { type: 'video' as const, src: url };
  };

  const getVideoTitle = () => {
    if (!session) return 'Live Class';
    return session.video_title || session.course_videos?.name || session.live_classes?.title || 'Live Class';
  };

  const getClassTitle = () => {
    if (!session) return 'Live Class';
    return session.live_classes?.courses?.title || session.live_classes?.title || 'Live Class';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSessionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Evening'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Session</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getClassTitle()}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{getSessionTypeLabel(session.session_type)}</span>
            <span>•</span>
            <span>{formatDateTime(session.scheduled_datetime)}</span>
            {(() => {
              const isFree = session.is_free === true || 
                            (session.course_videos?.order_index !== undefined && session.course_videos.order_index < 2);
              return isFree ? (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Free Class
                  </span>
                </>
              ) : null;
            })()}
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="aspect-video bg-black">
            {(() => {
              const videoSource = getVideoSource();
              if (!videoSource.src) {
                return (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <p className="text-lg mb-2">Video not available</p>
                      <p className="text-sm text-gray-400">Please contact support</p>
                    </div>
                  </div>
                );
              }
              
              if (videoSource.type === 'youtube') {
                return (
                  <AdvancedVideoPlayer
                    src={videoSource.src}
                    type="youtube"
                    title={getVideoTitle()}
                    autoplay={false}
                  />
                );
              }
              
              return (
                <video
                  src={videoSource.src}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              );
            })()}
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{getVideoTitle()}</h2>
          {session.video_description && (
            <p className="text-gray-600 mb-4">{session.video_description}</p>
          )}
          {session.live_classes?.description && (
            <p className="text-gray-600 mb-4">{session.live_classes.description}</p>
          )}
          
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">
              This is a free preview class. Sign up to access all classes and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClassSessionView;

