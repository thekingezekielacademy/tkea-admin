import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Dropzone from 'react-dropzone';

type VideoItem = {
  id: string;
  title: string;
  thumbnail?: string | null;
  position: number;
};

const YT_PLAYLIST_RE = /[?&]list=([a-zA-Z0-9_-]+)/;

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const isPlaylistValid = useMemo(() => YT_PLAYLIST_RE.test(playlistUrl), [playlistUrl]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const sensors = useSensors(useSensor(PointerSensor));

  // Local arrayMove to avoid extra dependency
  function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const copy = array.slice();
    const startIndex = from < 0 ? copy.length + from : from;
    if (startIndex >= 0 && startIndex < copy.length) {
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item as T);
    }
    return copy;
  }

  const extractPlaylistId = (url: string): string | null => {
    const m = url.match(YT_PLAYLIST_RE);
    return m ? m[1] : null;
  };

  const onImportPlaylist = async () => {
    setFetchError(null);
    // Guard: require a plausible playlist URL
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setFetchError('Please paste a valid YouTube playlist URL.');
      return;
    }
    setLoading(true);
    try {
      // Try the Supabase Edge Function first
      const { data, error } = await supabase.functions.invoke('fetch_youtube_playlist', {
        body: { playlistId },
      });
      if (error) throw error;

      const items: any[] = Array.isArray(data?.items) ? data.items : [];
      if (items.length === 0) throw new Error('No videos returned from playlist.');

      const mapped: VideoItem[] = items.map((it, idx) => ({
        id: it.videoId || it.id || `vid-${idx + 1}`,
        title: it.title || `Lesson ${idx + 1}`,
        thumbnail: it.thumbnailUrl || it.thumbnail || null,
        position: idx + 1,
      }));
      setVideos(mapped);
      setStep(2);
    } catch (e: any) {
      // Fallback to preview/mock data for UI testing if Edge Function is not deployed
      const mock: VideoItem[] = Array.from({ length: 6 }).map((_, i) => ({
        id: `mock-${i + 1}`,
        title: `Sample Lesson ${i + 1}`,
        thumbnail: null,
        position: i + 1,
      }));
      setVideos(mock);
      setFetchError('Could not fetch playlist from Edge Function. Using mock lessons for UI preview.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = videos.findIndex(v => v.id === active.id);
    const newIndex = videos.findIndex(v => v.id === over.id);
    const newArr = arrayMove(videos, oldIndex, newIndex).map((v, i) => ({ ...v, position: i + 1 }));
    setVideos(newArr);
  };

  const removeVideo = (id: string) => setVideos(prev => prev.filter(v => v.id !== id));

  const onDropCover = (files: File[]) => {
    const f = files[0];
    if (f) {
      setCoverFile(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  };

  const onSaveCourse = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setSaveError(null);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const key = `covers/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('course-covers').upload(key, coverFile, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('course-covers').getPublicUrl(key);
        coverUrl = pub.publicUrl;
      }

      const { data: courseIns, error: cErr } = await supabase
        .from('courses')
        .insert({
          title: title || 'Untitled Course',
          description: description || null,
          cover_url: coverUrl,
          playlist_url: playlistUrl,
          lessons_count: videos.length,
        })
        .select('id')
        .single();
      if (cErr) throw cErr;

      const payload = videos.map(v => ({
        course_id: courseIns.id,
        order_index: v.position,
        title: v.title,
        video_id: v.id,
        video_url: `https://www.youtube.com/watch?v=${v.id}`,
        thumbnail_url: v.thumbnail ?? null,
      }));
      const { error: lErr } = await supabase.from('lessons').insert(payload);
      if (lErr) throw lErr;
      navigate('/admin/courses');
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="bg-white border rounded-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">403 – Admins Only</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add Course</h1>
            <div className="flex items-center gap-2">
              {[1,2,3].map(s => (
                <div key={s} className={`h-2 w-16 rounded ${step >= s ? 'bg-primary-600' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm text-gray-700">YouTube Playlist Link</label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full px-3 py-2 border rounded"
              />
              {fetchError && <div className="text-sm text-red-600">{fetchError}</div>}
              <div className="flex justify-between gap-3">
                <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded hover:bg-gray-50">BACK</button>
                <button
                  onClick={onImportPlaylist}
                  disabled={loading || !isPlaylistValid}
                  className={`px-4 py-2 rounded text-white ${(!loading && isPlaylistValid) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  {loading ? 'Fetching…' : 'NEXT'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Arrange Lessons</h2>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <div className="space-y-3">
                  {videos.map((v) => (
                    <div key={v.id} id={v.id} className="flex items-center gap-3 p-3 border rounded">
                      <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <input
                        value={v.title}
                        onChange={(e) => setVideos(prev => prev.map(p => p.id === v.id ? { ...p, title: e.target.value } : p))}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                      <button
                        aria-label="Delete"
                        onClick={() => removeVideo(v.id)}
                        className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </DndContext>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 border rounded hover:bg-gray-50">BACK</button>
                <button onClick={() => setStep(3)} disabled={videos.length === 0} className={`px-4 py-2 rounded text-white ${videos.length ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}>NEXT</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Cover & Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Dropzone onDrop={onDropCover} accept={{ 'image/*': [] }} multiple={false}>
                    {({ getRootProps, getInputProps, isDragActive }) => (
                      <div {...getRootProps()} className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${isDragActive ? 'bg-primary-50 border-primary-300' : 'bg-gray-50 border-gray-300'}`}>
                        <input {...getInputProps()} />
                        <p className="text-gray-700">Drag & drop cover image here, or click to select</p>
                      </div>
                    )}
                  </Dropzone>
                  {coverPreview && (
                    <img src={coverPreview} alt="preview" className="w-full h-40 object-cover rounded border mt-3" />
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-gray-700">Course Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  <label className="block text-sm text-gray-700">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              {saveError && <div className="text-sm text-red-600">{saveError}</div>}
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-4 py-2 border rounded hover:bg-gray-50">BACK</button>
                <button onClick={onSaveCourse} disabled={saving || !title || videos.length === 0} className={`px-4 py-2 rounded text-white ${(!saving && title && videos.length) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}`}>{saving ? 'Saving…' : 'SAVE COURSE'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCourse;


