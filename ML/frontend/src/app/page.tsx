// page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Define animation types available for memory videos
type AnimationType = 
  'cross_fade' | 
  'zoom' | 
  'spiral' | 
  'ken_burns';

// Animation descriptions for user selection
const ANIMATION_DESCRIPTIONS: Record<AnimationType, string> = {
  'cross_fade': 'Smooth transition between images with gentle fading',
  'zoom': 'Dynamic zooming in and out of images',
  'spiral': 'Images rotate and zoom in a mesmerizing spiral motion',
  'ken_burns': 'Elegant panning and zooming, like documentary-style transitions',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const MAX_FILE_SIZE_KB = 1024;

export default function FaceMemoryGeneratorPage() {
  // State management for application features
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<{[groupId: string]: string[]}>({});
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showAnimationPopup, setShowAnimationPopup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('cross_fade');

  // Error handling utility
  const handleError = useCallback((message: string) => {
    setError(message);
    setIsLoading(false);
  }, []);

  // File upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileSizeInKB = file.size / 1024;
    const allowedTypes = ['image/jpeg', 'image/png'];

    if (fileSizeInKB > MAX_FILE_SIZE_KB) {
      return handleError(`File size exceeds ${MAX_FILE_SIZE_KB}KB limit`);
    }

    if (!allowedTypes.includes(file.type)) {
      return handleError('Invalid file type. Please upload JPEG or PNG.');
    }

    setUploadedFile(file);
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${BACKEND_URL}/upload`, formData);
      await fetchGroups();
    } catch (err: any) {
      handleError(err.response?.data?.error || 'Upload failed unexpectedly');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Fetch groups and existing videos
  const fetchGroups = useCallback(async () => {
    try {
      const [groupsResponse, videosResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/groups`),
        axios.get(`${BACKEND_URL}/memory-videos`)
      ]);
      
      setGroups(groupsResponse.data);
      setExistingVideos(videosResponse.data);
    } catch (err: any) {
      handleError(err.response?.data?.error || 'Failed to retrieve data');
    }
  }, [handleError]);

  // Memory video creation handler
  const createMemoryVideo = useCallback(async () => {
    if (!selectedGroup) return;

    setIsLoading(true);
    setError(null);

    try {
      await axios.post(`${BACKEND_URL}/create-video`, {
        group_id: selectedGroup,
        animation_type: selectedAnimation
      });
      await fetchGroups();
      setShowAnimationPopup(false);
    } catch (err: any) {
      handleError(err.response?.data?.error || 'Video creation failed');
    } finally {
      setIsLoading(false);
    }
  }, [handleError, fetchGroups, selectedGroup, selectedAnimation]);

  // Group expansion toggle handler
  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  // Initial data fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Group Card Component with animations
  const GroupCard = ({ groupId, imagePaths }: { groupId: string, imagePaths: string[] }) => {
    const isExpanded = expandedGroup === groupId;
    const [imageError, setImageError] = useState(false);

    return (
      <motion.div
        layout
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '100px' }}
        className="bg-opacity-10 bg-white rounded-xl overflow-hidden mb-6 cosmic-card"
      >
        <motion.div
          layout
          className="p-6 cursor-pointer hover:bg-opacity-20 hover:bg-white transition-all"
          onClick={() => toggleGroup(groupId)}
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/50">
              {imageError ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs text-center p-2">
                  No Image Available
                </div>
              ) : (
                <Image
                  src={`${BACKEND_URL}/${imagePaths[0]}`}
                  alt={`${groupId} preview`}
                  width={64}
                  height={64}
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{groupId}</h3>
              <p className="text-sm text-blue-200">{imagePaths.length} photos</p>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePaths.map((path, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="aspect-square rounded-lg overflow-hidden ring-1 ring-white/20"
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={`${BACKEND_URL}/${path}`}
                          alt={`${groupId} image ${index + 1}`}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="absolute inset-0 bg-gray-700 flex items-center justify-center text-white text-sm text-center p-2">
                                Image Not Available
                              </div>
                            `;
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white rounded-lg hover:from-pink-600 hover:via-fuchsia-600 hover:to-violet-600 transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGroup(groupId);
                    setShowAnimationPopup(true);
                  }}
                >
                  Create Memory Video
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  // Animation Selection Popup Component
  const AnimationPopup = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white p-8 rounded-2xl shadow-2xl max-w-xl w-full"
      >
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Choose Memory Video Style
        </h2>
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
            {(Object.keys(ANIMATION_DESCRIPTIONS) as AnimationType[]).map((type) => (
              <motion.div 
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAnimation(type)}
                className={`
                  p-4 border-2 rounded-xl cursor-pointer transition-all 
                  ${selectedAnimation === type 
                    ? 'border-pink-500 bg-pink-50 ring-4 ring-pink-200' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold text-gray-800">
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {ANIMATION_DESCRIPTIONS[type]}
                    </p>
                  </div>
                  {selectedAnimation === type && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-blue-500 text-2xl"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAnimationPopup(false)} 
              className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createMemoryVideo}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white rounded-lg hover:from-pink-600 hover:via-fuchsia-600 hover:to-violet-600 transition-all transform hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Creating...' : 'Create Memory Video'}
            </motion.button>
          </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen cosmic-bg p-8">
      <div className="container mx-auto max-w-4xl">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-center mb-12 text-white"
        >
          Face Memory Generator
        </motion.h1>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6"
            >
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Upload Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 mb-8 cosmic-card"
        >
          <input 
            type="file" 
            accept=".jpg,.jpeg,.png" 
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-blue-200
              file:mr-4 file:py-3 file:px-6
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90
              disabled:opacity-50
              file:transition-colors"
          />
        </motion.div>

        {/* Groups Display */}
        {Object.keys(groups).length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-semibold text-white mb-6">
              Discovered Face Groups
            </h2>
            {Object.entries(groups).map(([groupId, imagePaths]) => (
              <GroupCard key={groupId} groupId={groupId} imagePaths={imagePaths} />
            ))}
          </motion.div>
        )}

        {/* Videos Gallery */}
        {existingVideos.length > 0 && (
          <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-semibold text-white mb-6">
              Memory Video Collection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {existingVideos.map((videoPath, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 cosmic-card"
                >
                  <h3 className="text-xl font-medium mb-4 text-blue-200">
                    {videoPath.replace('_memory.mp4', '')} Memory Video
                  </h3>
                  <video 
                    controls 
                    className="w-full rounded-lg ring-1 ring-white/20" 
                    src={`${BACKEND_URL}/memory_videos/${videoPath}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Animation Selection Popup */}
        <AnimatePresence>
          {showAnimationPopup && <AnimationPopup />}
        </AnimatePresence>
      </div>
    </div>
  );
}