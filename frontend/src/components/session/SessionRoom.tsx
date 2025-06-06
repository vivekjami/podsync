'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { ParticipantGrid } from './ParticipantGrid';
import { SessionControls } from './SessionControls';
import { SessionInfo } from './SessionInfo';
import { MediaSettings } from './MediaSettings';

interface SessionRoomProps {
  roomId: string;
  participantName: string;
  isHost?: boolean;
}

export function SessionRoom({ roomId, participantName, isHost = false }: SessionRoomProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mediaEnabled, setMediaEnabled] = useState({ video: true, audio: true });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    isConnected,
    participants,
    currentRoom,
    localStream,
    error: webrtcError,
    joinRoom,
    leaveRoom,
    toggleMedia
  } = useWebRTC(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001');

  const {
    stream,
    permissions,
    isLoading: mediaLoading,
    error: mediaError,
    requestPermissions,
    toggleAudio,
    toggleVideo,
    stopStream
  } = useMediaDevices();

  const {
    recordingState,
    startRecording,
    stopRecording,
    downloadRecording,
    formatDuration
  } = useMediaRecorder();

  // Set up local video preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Join room when stream is available
  useEffect(() => {
    if (stream && isConnected && !isJoined) {
      joinRoom({ roomId, participantName, isHost }, stream)
        .then(() => setIsJoined(true))
        .catch(console.error);
    }
  }, [stream, isConnected, isJoined, roomId, participantName, isHost, joinRoom]);

  const handleJoinSession = async () => {
    try {
      await requestPermissions(true, true);
    } catch (error) {
      console.error('Failed to get media permissions:', error);
    }
  };

  const handleLeaveSession = () => {
    if (recordingState.isRecording) {
      stopRecording();
    }
    leaveRoom();
    stopStream();
    setIsJoined(false);
  };

  const handleToggleAudio = () => {
    const newState = !mediaEnabled.audio;
    setMediaEnabled(prev => ({ ...prev, audio: newState }));
    toggleAudio(newState);
    toggleMedia('audio', newState);
  };

  const handleToggleVideo = () => {
    const newState = !mediaEnabled.video;
    setMediaEnabled(prev => ({ ...prev, video: newState }));
    toggleVideo(newState);
    toggleMedia('video', newState);
  };

  const handleStartRecording = async () => {
    if (localStream) {
      try {
        await startRecording(localStream);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    // Auto-download after stopping
    setTimeout(() => {
      downloadRecording(`${roomId}-${participantName}-${Date.now()}.webm`);
    }, 1000);
  };

  // Show join screen if not connected
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Join Session
          </h1>
          
          {/* Local video preview */}
          <div className="mb-6">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {participantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p>Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection status */}
          <div className="mb-4 text-center">
            {!isConnected && (
              <p className="text-yellow-600">Connecting to server...</p>
            )}
            {mediaLoading && (
              <p className="text-blue-600">Requesting camera and microphone access...</p>
            )}
            {(mediaError || webrtcError) && (
              <p className="text-red-600">{mediaError || webrtcError}</p>
            )}
          </div>

          {/* Join button */}
          <button
            onClick={handleJoinSession}
            disabled={!isConnected || mediaLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mediaLoading ? 'Getting Ready...' : 'Join Session'}
          </button>

          {/* Settings link */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Audio & Video Settings
          </button>
        </div>

        {/* Media Settings Modal */}
        {showSettings && (
          <MediaSettings
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  }

  // Main session interface
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <SessionInfo
            roomId={roomId}
            participantCount={participants.length + 1}
            isHost={isHost}
            recordingState={recordingState}
          />
          
          <div className="flex items-center space-x-4">
            {recordingState.isRecording && (
              <div className="text-red-400 font-medium">
                🔴 REC {formatDuration()}
              </div>
            )}
            
            <button
              onClick={handleLeaveSession}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Leave Session
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Participant grid */}
        <div className="flex-1 p-4">
          <ParticipantGrid
            participants={participants}
            localStream={localStream}
            localParticipant={{
              id: 'local',
              name: participantName,
              isHost,
              hasVideo: mediaEnabled.video,
              hasAudio: mediaEnabled.audio,
              joinedAt: new Date()
            }}
          />
        </div>

        {/* Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <SessionControls
            isHost={isHost}
            mediaEnabled={mediaEnabled}
            recordingState={recordingState}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <MediaSettings
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}