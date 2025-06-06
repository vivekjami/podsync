'use client';

import { RecordingState } from '@/types/webrtc.types';

interface SessionInfoProps {
  roomId: string;
  participantCount: number;
  isHost: boolean;
  recordingState: RecordingState;
}

export function SessionInfo({ roomId, participantCount, isHost, recordingState }: SessionInfoProps) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // You could add a toast notification here
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Room ID */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Room:</span>
        <button
          onClick={copyRoomId}
          className="text-white font-mono bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
          title="Click to copy room ID"
        >
          {roomId}
        </button>
      </div>

      {/* Participant count */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Participants:</span>
        <span className="text-white font-medium">{participantCount}</span>
      </div>

      {/* Host indicator */}
      {isHost && (
        <div className="flex items-center space-x-2">
          <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded">
            👑 Host
          </span>
        </div>
      )}

      {/* Recording status */}
      {recordingState.isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400 font-medium">Recording</span>
        </div>
      )}
    </div>
  );
}