export interface JoinSessionData {
  roomId: string;
  participantName: string;
  isHost?: boolean;
}

export interface SessionSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  waitingRoomEnabled: boolean;
}

export interface MediaSettings {
  video: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high' | 'hd';
    frameRate: number;
  };
  audio: {
    enabled: boolean;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  speed: number;
  timeRemaining: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
}