import { useState, useCallback, useRef, useEffect } from 'react';
import { WebRTCConnection } from '@/services/webrtc/connection';
import { SocketService } from '@/services/socket';
import { ParticipantInfo, ConnectionState, WebRTCConfig } from '@/types/webrtc.types';
import { JoinSessionData } from '@/types/session.types';

const DEFAULT_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(serverUrl: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Map<string, ParticipantInfo>>(new Map());
  const [connections, setConnections] = useState<Map<string, WebRTCConnection>>(new Map());
  const [connectionStates, setConnectionStates] = useState<Map<string, ConnectionState>>(new Map());
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketService = useRef<SocketService | null>(null);

  // Initialize socket service
  useEffect(() => {
    socketService.current = new SocketService(serverUrl);
    
    socketService.current.onConnect(() => {
      setIsConnected(true);
      setError(null);
    });

    socketService.current.onDisconnect(() => {
      setIsConnected(false);
    });

    socketService.current.onSocketError((error) => {
      setError(error);
    });

    socketService.current.onParticipantJoin((participant) => {
      setParticipants(prev => new Map(prev.set(participant.id, participant)));
      
      // Initiate connection to new participant if we're already in the room
      if (currentRoom && localStream) {
        initiateConnection(participant.id);
      }
    });

    socketService.current.onParticipantLeave((participantId) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
      
      // Clean up connection
      const connection = connections.get(participantId);
      if (connection) {
        connection.close();
        setConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
      }
    });

    socketService.current.onSignaling(handleSignalingMessage);

    return () => {
      socketService.current?.disconnect();
      cleanupConnections();
    };
  }, [serverUrl]);

  const handleSignalingMessage = useCallback(async (message: any) => {
    const { type, senderId, data } = message;
    
    try {
      switch (type) {
        case 'connection-request':
          await handleConnectionRequest(senderId);
          break;
          
        case 'offer':
          await handleOffer(senderId, data);
          break;
          
        case 'answer':
          await handleAnswer(senderId, data);
          break;
          
        case 'ice-candidate':
          await handleIceCandidate(senderId, data);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }, []);

  const createConnection = useCallback((participantId: string): WebRTCConnection => {
    const connection = new WebRTCConnection(
      DEFAULT_CONFIG,
      (state) => {
        setConnectionStates(prev => new Map(prev.set(participantId, state)));
      },
      (stream) => {
        setParticipants(prev => {
          const participant = prev.get(participantId);
          if (participant) {
            return new Map(prev.set(participantId, { ...participant, stream }));
          }
          return prev;
        });
      }
    );

    if (localStream) {
      connection.setLocalStream(localStream);
    }

    setConnections(prev => new Map(prev.set(participantId, connection)));
    return connection;
  }, [localStream]);

  const initiateConnection = useCallback(async (participantId: string) => {
    if (!currentRoom || !socketService.current) return;
    
    try {
      const connection = createConnection(participantId);
      const offer = await connection.createOffer();
      
      socketService.current.sendOffer(currentRoom, participantId, offer);
    } catch (error) {
      console.error('Error initiating connection:', error);
    }
  }, [currentRoom, createConnection]);

  const handleConnectionRequest = useCallback(async (senderId: string) => {
    // This is handled automatically when we receive an offer
    console.log('Connection request from:', senderId);
  }, []);

  const handleOffer = useCallback(async (senderId: string, offer: RTCSessionDescriptionInit) => {
    if (!currentRoom || !socketService.current) return;
    
    try {
      let connection = connections.get(senderId);
      if (!connection) {
        connection = createConnection(senderId);
      }
      
      const answer = await connection.createAnswer(offer);
      socketService.current.sendAnswer(currentRoom, senderId, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [currentRoom, connections, createConnection]);

  const handleAnswer = useCallback(async (senderId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const connection = connections.get(senderId);
      if (connection) {
        await connection.handleAnswer(answer);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, [connections]);

  const handleIceCandidate = useCallback(async (senderId: string, candidate: RTCIceCandidateInit) => {
    try {
      const connection = connections.get(senderId);
      if (connection) {
        await connection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [connections]);

  const joinRoom = useCallback(async (data: JoinSessionData, stream: MediaStream) => {
    if (!socketService.current) {
      throw new Error('Socket service not initialized');
    }

    try {
      setLocalStream(stream);
      setCurrentRoom(data.roomId);
      setIsHost(data.isHost || false);
      
      socketService.current.joinRoom(data);
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (currentRoom && socketService.current) {
      socketService.current.leaveRoom(currentRoom);
    }
    
    cleanupConnections();
    setCurrentRoom(null);
    setIsHost(false);
    setParticipants(new Map());
  }, [currentRoom]);

  const cleanupConnections = useCallback(() => {
    connections.forEach(connection => connection.close());
    setConnections(new Map());
    setConnectionStates(new Map());
  }, [connections]);

  const toggleMedia = useCallback((mediaType: 'video' | 'audio', enabled: boolean) => {
    if (!currentRoom || !socketService.current) return;
    
    if (localStream) {
      if (mediaType === 'video') {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = enabled;
        });
      } else {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = enabled;
        });
      }
    }
    
    socketService.current.toggleMedia(currentRoom, mediaType, enabled);
  }, [currentRoom, localStream]);

  const getParticipantsList = useCallback(() => {
    return Array.from(participants.values());
  }, [participants]);

  const getConnectionState = useCallback((participantId: string): ConnectionState | null => {
    return connectionStates.get(participantId) || null;
  }, [connectionStates]);

  return {
    isConnected,
    participants: getParticipantsList(),
    currentRoom,
    isHost,
    localStream,
    error,
    joinRoom,
    leaveRoom,
    toggleMedia,
    getConnectionState,
    socketService: socketService.current
  };
}