import { Server, Socket } from 'socket.io';
import { SignalingHandler } from './handlers/signaling.handler';
import { SessionHandler } from './handlers/session.handler';

interface ParticipantInfo {
  id: string;
  name: string;
  isHost: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  joinedAt: Date;
}

interface RoomInfo {
  participants: Map<string, ParticipantInfo>;
  hostId: string;
  createdAt: Date;
}

// Global room storage (use Redis in production)
const rooms = new Map<string, RoomInfo>();

export function setupSocketHandlers(io: Server) {
  const signalingHandler = new SignalingHandler(rooms);
  const sessionHandler = new SessionHandler(rooms);

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Session management
    socket.on('join-room', (data) => sessionHandler.handleJoinRoom(socket, data));
    socket.on('leave-room', (data) => sessionHandler.handleLeaveRoom(socket, data));
    socket.on('get-participants', (data) => sessionHandler.handleGetParticipants(socket, data));
    socket.on('toggle-media', (data) => sessionHandler.handleToggleMedia(socket, data));

    // WebRTC signaling
    socket.on('offer', (data) => signalingHandler.handleOffer(socket, data));
    socket.on('answer', (data) => signalingHandler.handleAnswer(socket, data));
    socket.on('ice-candidate', (data) => signalingHandler.handleIceCandidate(socket, data));
    socket.on('request-connection', (data) => signalingHandler.handleRequestConnection(socket, data));

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      sessionHandler.handleDisconnect(socket);
    });
  });

  // Room cleanup interval (every 30 minutes)
  setInterval(() => {
    const now = new Date();
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants.size === 0) {
        const timeSinceCreated = now.getTime() - room.createdAt.getTime();
        if (timeSinceCreated > 30 * 60 * 1000) { // 30 minutes
          rooms.delete(roomId);
          console.log(`🧹 Cleaned up empty room: ${roomId}`);
        }
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}