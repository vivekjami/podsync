import { io, Socket } from 'socket.io-client';
import { SignalingMessage, ParticipantInfo } from '@/types/webrtc.types';
import { JoinSessionData } from '@/types/session.types';

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event handlers
  private onConnected?: () => void;
  private onDisconnected?: () => void;
  private onParticipantJoined?: (participant: ParticipantInfo) => void;
  private onParticipantLeft?: (participantId: string) => void;
  private onSignalingMessage?: (message: SignalingMessage) => void;
  private onError?: (error: string) => void;

  constructor(serverUrl: string) {
    this.connect(serverUrl);
  }

  private connect(serverUrl: string) {
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to signaling server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnected?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from signaling server:', reason);
      this.isConnected = false;
      this.onDisconnected?.();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // Session events
    this.socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
    });

    this.socket.on('participant-joined', (data) => {
      console.log('Participant joined:', data.participant);
      this.onParticipantJoined?.(data.participant);
    });

    this.socket.on('participant-left', (data) => {
      console.log('Participant left:', data.participantId);
      this.onParticipantLeft?.(data.participantId);
    });

    this.socket.on('participant-media-changed', (data) => {
      console.log('Participant media changed:', data);
    });

    this.socket.on('host-changed', (data) => {
      console.log('Host changed:', data.newHostId);
    });

    // WebRTC signaling events
    this.socket.on('offer', (data) => {
      this.onSignalingMessage?.({
        type: 'offer',
        roomId: data.roomId,
        senderId: data.senderId,
        targetId: this.socket?.id || '',
        data: data.offer
      });
    });

    this.socket.on('answer', (data) => {
      this.onSignalingMessage?.({
        type: 'answer',
        roomId: data.roomId,
        senderId: data.senderId,
        targetId: this.socket?.id || '',
        data: data.answer
      });
    });

    this.socket.on('ice-candidate', (data) => {
      this.onSignalingMessage?.({
        type: 'ice-candidate',
        roomId: data.roomId,
        senderId: data.senderId,
        targetId: this.socket?.id || '',
        data: data.candidate
      });
    });

    this.socket.on('connection-request', (data) => {
      this.onSignalingMessage?.({
        type: 'connection-request',
        roomId: data.roomId,
        senderId: data.senderId,
        targetId: this.socket?.id || '',
        data: {}
      });
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data.message);
      this.onError?.(data.message);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.onError?.('Connection failed after multiple attempts');
    }
  }

  // Public methods
  joinRoom(data: JoinSessionData) {
    if (!this.isConnected) {
      throw new Error('Not connected to signaling server');
    }
    
    this.socket?.emit('join-room', data);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', { roomId });
  }

  sendOffer(roomId: string, targetId: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('offer', {
      roomId,
      targetId,
      senderId: this.socket?.id,
      offer
    });
  }

  sendAnswer(roomId: string, targetId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('answer', {
      roomId,
      targetId,
      senderId: this.socket?.id,
      answer
    });
  }

  sendIceCandidate(roomId: string, targetId: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit('ice-candidate', {
      roomId,
      targetId,
      senderId: this.socket?.id,
      candidate
    });
  }

  requestConnection(roomId: string, targetId: string) {
    this.socket?.emit('request-connection', {
      roomId,
      targetId
    });
  }

  toggleMedia(roomId: string, mediaType: 'video' | 'audio', enabled: boolean) {
    this.socket?.emit('toggle-media', {
      roomId,
      mediaType,
      enabled
    });
  }

  getParticipants(roomId: string) {
    this.socket?.emit('get-participants', { roomId });
  }

  // Event handler setters
  onConnect(handler: () => void) {
    this.onConnected = handler;
  }

  onDisconnect(handler: () => void) {
    this.onDisconnected = handler;
  }

  onParticipantJoin(handler: (participant: ParticipantInfo) => void) {
    this.onParticipantJoined = handler;
  }

  onParticipantLeave(handler: (participantId: string) => void) {
    this.onParticipantLeft = handler;
  }

  onSignaling(handler: (message: SignalingMessage) => void) {
    this.onSignalingMessage = handler;
  }

  onSocketError(handler: (error: string) => void) {
    this.onError = handler;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  disconnect() {
    this.socket?.disconnect();
    this.isConnected = false;
  }
}