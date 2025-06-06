'use client';

import { useEffect, useRef } from 'react';
import { ParticipantInfo } from '@/types/webrtc.types';

interface ParticipantGridProps {
  participants: ParticipantInfo[];
  localStream: MediaStream | null;
  localParticipant: ParticipantInfo;
}

export function ParticipantGrid({ participants, localStream, localParticipant }: ParticipantGridProps) {
  const allParticipants = [localParticipant, ...participants];
  const gridSize = getGridLayout(allParticipants.length);

  return (
    <div className={`grid gap-4 h-full ${gridSize.className}`}>
      {/* Local participant */}
      <ParticipantCard
        participant={localParticipant}
        stream={localStream}
        isLocal={true}
      />
      
      {/* Remote participants */}
      {participants.map((participant) => (
        <ParticipantCard
          key={participant.id}
          participant={participant}
          stream={participant.stream}
          isLocal={false}
        />
      ))}
    </div>
  );
}

interface ParticipantCardProps {
  participant: ParticipantInfo;
  stream: MediaStream | null;
  isLocal: boolean;
}

function ParticipantCard({ participant, stream, isLocal }: ParticipantCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      {/* Video element */}
      {participant.hasVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal} // Mute local video to prevent feedback
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        // Avatar fallback
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {participant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white font-medium">{participant.name}</p>
            {!participant.hasVideo && (
              <p className="text-gray-400 text-sm">Camera off</p>
            )}
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">
              {participant.name}
              {isLocal && ' (You)'}
            </span>
            {participant.isHost && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Host
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Audio indicator */}
            <div className={`w-4 h-4 rounded-full ${
              participant.hasAudio ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {participant.hasAudio ? '🎤' : '🔇'}
            </div>
            
            {/* Video indicator */}
            <div className={`w-4 h-4 rounded-full ${
              participant.hasVideo ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {participant.hasVideo ? '📹' : '📷'}
            </div>
          </div>
        </div>
      </div>

      {/* Connection quality indicator */}
      {!isLocal && (
        <div className="absolute top-4 right-4">
          <ConnectionQualityIndicator participantId={participant.id} />
        </div>
      )}
    </div>
  );
}

function ConnectionQualityIndicator({ participantId }: { participantId: string }) {
  // This would connect to the WebRTC hook to get connection quality
  // For now, showing a placeholder
  return (
    <div className="flex space-x-1">
      <div className="w-1 h-3 bg-green-500 rounded"></div>
      <div className="w-1 h-3 bg-green-500 rounded"></div>
      <div className="w-1 h-3 bg-green-500 rounded"></div>
      <div className="w-1 h-3 bg-gray-400 rounded"></div>
    </div>
  );
}

function getGridLayout(participantCount: number) {
  if (participantCount === 1) {
    return { className: 'grid-cols-1' };
  } else if (participantCount === 2) {
    return { className: 'grid-cols-2' };
  } else if (participantCount <= 4) {
    return { className: 'grid-cols-2 grid-rows-2' };
  } else if (participantCount <= 6) {
    return { className: 'grid-cols-3 grid-rows-2' };
  } else if (participantCount <= 9) {
    return { className: 'grid-cols-3 grid-rows-3' };
  } else {
    return { className: 'grid-cols-4 grid-rows-3' };
  }
}