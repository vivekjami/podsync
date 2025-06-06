import { WebRTCConfig, ConnectionState } from '@/types/webrtc.types';

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private connectionState: ConnectionState = { status: 'disconnected', quality: 'excellent' };
  private onStateChange?: (state: ConnectionState) => void;
  private onRemoteStream?: (stream: MediaStream) => void;

  constructor(
    config: WebRTCConfig,
    onStateChange?: (state: ConnectionState) => void,
    onRemoteStream?: (stream: MediaStream) => void
  ) {
    this.onStateChange = onStateChange;
    this.onRemoteStream = onRemoteStream;
    
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers,
      iceTransportPolicy: config.iceTransportPolicy || 'all',
      bundlePolicy: config.bundlePolicy || 'balanced'
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      this.updateConnectionState({ status: state as any });
    };

    // ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      console.log('ICE connection state:', state);
      
      if (state === 'failed' || state === 'disconnected') {
        this.updateConnectionState({ status: 'failed' });
      }
    };

    // Remote stream handling
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const [remoteStream] = event.streams;
      this.remoteStream = remoteStream;
      this.onRemoteStream?.(remoteStream);
    };

    // ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // This will be handled by the signaling service
        console.log('New ICE candidate:', event.candidate);
      }
    };

    // Data channel for quality metrics
    this.setupDataChannel();
  }

  private setupDataChannel() {
    const dataChannel = this.peerConnection.createDataChannel('quality-metrics', {
      ordered: true
    });

    dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.startQualityMonitoring();
    };

    dataChannel.onmessage = (event) => {
      try {
        const metrics = JSON.parse(event.data);
        this.updateConnectionQuality(metrics);
      } catch (error) {
        console.error('Error parsing quality metrics:', error);
      }
    };
  }

  private startQualityMonitoring() {
    setInterval(async () => {
      try {
        const stats = await this.peerConnection.getStats();
        const metrics = this.parseConnectionStats(stats);
        this.updateConnectionQuality(metrics);
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  private parseConnectionStats(stats: RTCStatsReport) {
    let latency = 0;
    let bandwidth = { upload: 0, download: 0 };

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime * 1000; // Convert to ms
      }
      
      if (report.type === 'outbound-rtp') {
        bandwidth.upload = report.bytesSent || 0;
      }
      
      if (report.type === 'inbound-rtp') {
        bandwidth.download = report.bytesReceived || 0;
      }
    });

    return { latency, bandwidth };
  }

  private updateConnectionQuality(metrics: any) {
    let quality: ConnectionState['quality'] = 'excellent';
    
    if (metrics.latency > 300) quality = 'very-poor';
    else if (metrics.latency > 200) quality = 'poor';
    else if (metrics.latency > 100) quality = 'good';

    this.updateConnectionState({
      quality,
      latency: metrics.latency,
      bandwidth: metrics.bandwidth
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onStateChange?.(this.connectionState);
  }

  async setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection.setRemoteDescription(offer);
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    this.peerConnection.close();
    this.connectionState = { status: 'disconnected', quality: 'excellent' };
    this.onStateChange?.(this.connectionState);
  }
}