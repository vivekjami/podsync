export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface ParticipantInfo {
  id: string;
  name: string;
  isHost: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  joinedAt: Date;
  stream?: MediaStream;
}

export interface SessionInfo {
  id: string;
  name: string;
  hostId: string;
  participants: ParticipantInfo[];
  createdAt: Date;
  isRecording: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'connection-request';
  roomId: string;
  senderId: string;
  targetId: string;
  data: any;
}

export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  duration: number;
  chunks: Blob[];
  mediaRecorder?: MediaRecorder;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'failed' | 'reconnecting';
  quality: 'excellent' | 'good' | 'poor' | 'very-poor';
  latency?: number;
  bandwidth?: {
    upload: number;
    download: number;
  };
}