'use client';

import { RecordingState } from '@/types/webrtc.types';

interface SessionControlsProps {
  isHost: boolean;
  mediaEnabled: { video: boolean; audio: boolean };
  recordingState: RecordingState;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onOpenSettings: () => void;
}

export function SessionControls({
  isHost,
  mediaEnabled,
  recordingState,
  onToggleAudio,
  onToggleVideo,
  onStartRecording,
  onStopRecording,
  onOpenSettings
}: SessionControlsProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Audio toggle */}
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full transition-colors ${
          mediaEnabled.audio
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={mediaEnabled.audio ? 'Mute microphone' : 'Unmute microphone'}
      >
        {mediaEnabled.audio ? '🎤' : '🔇'}
      </button>

      {/* Video toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition-colors ${
          mediaEnabled.video
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={mediaEnabled.video ? 'Turn off camera' : 'Turn on camera'}
      >
        {mediaEnabled.video ? '📹' : '📷'}
      </button>

      {/* Recording controls */}
      {isHost && (
        <button
          onClick={recordingState.isRecording ? onStopRecording : onStartRecording}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            recordingState.isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {recordingState.isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
        </button>
      )}

      {/* Screen share */}
      <button
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Share screen"
      >
        🖥️
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Settings"
      >
        ⚙️
      </button>

      {/* Chat toggle */}
      <button
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        title="Toggle chat"
      >
        💬
      </button>
    </div>
  );
}