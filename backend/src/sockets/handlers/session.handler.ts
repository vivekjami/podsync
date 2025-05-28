import { Socket } from 'socket.io';

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

interface JoinRoomData {
  roomId: string;
  participantName: string;
  isHost?: boolean;
}

interface ToggleMediaData {
  roomId: string;
  mediaType: 'video' | 'audio';
  enabled: boolean;
}

export class SessionHandler {
  constructor(private rooms: Map<string, RoomInfo>) {}

  handleJoinRoom(socket: Socket, data: JoinRoomData) {
    try {
      const { roomId, participantName, isHost = false } = data;
      const participantId = socket.id;

      console.log(`👤 ${participantName} (${participantId}) joining room ${roomId}`);

      // Get or create room
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          participants: new Map(),
          hostId: isHost ? participantId : '',
          createdAt: new Date()
        };
        this.rooms.set(roomId, room);
        console.log(`🏠 Created new room: ${roomId}`);
      }

      // Check room capacity (max 10 for now)
      if (room.participants.size >= 10) {
        socket.emit('error', { message: 'Room is full (max 10 participants)' });
        return;
      }

      // Add participant to room
      const participant: ParticipantInfo = {
        id: participantId,
        name: participantName,
        isHost: isHost || room.participants.size === 0, // First person becomes host
        hasVideo: true,
        hasAudio: true,
        joinedAt: new Date()
      };

      room.participants.set(participantId, participant);
      
      // Update host if this is the first participant
      if (room.participants.size === 1) {
        room.hostId = participantId;
        participant.isHost = true;
      }

      // Join socket room
      socket.join(roomId);

      // Send current participants to the new user
      const participantsList = Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio
      }));

      socket.emit('joined-room', {
        roomId,
        participants: participantsList,
        isHost: participant.isHost
      });

      // Notify other participants about the new user
      socket.to(roomId).emit('participant-joined', {
        participant: {
          id: participant.id,
          name: participant.name,
          isHost: participant.isHost,
          hasVideo: participant.hasVideo,
          hasAudio: participant.hasAudio
        }
      });

      console.log(`✅ ${participantName} joined room ${roomId}. Total participants: ${room.participants.size}`);
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  handleLeaveRoom(socket: Socket, data: { roomId: string }) {
    try {
      const { roomId } = data;
      const participantId = socket.id;

      const room = this.rooms.get(roomId);
      if (!room) return;

      const participant = room.participants.get(participantId);
      if (!participant) return;

      console.log(`👋 ${participant.name} leaving room ${roomId}`);

      // Remove participant from room
      room.participants.delete(participantId);
      socket.leave(roomId);

      // Notify other participants
      socket.to(roomId).emit('participant-left', {
        participantId
      });

      // Handle host transfer if needed
      if (participant.isHost && room.participants.size > 0) {
        const newHost = room.participants.values().next().value;
        if (newHost) {

        newHost.isHost = true;
        
        room.hostId = newHost.id;

        socket.to(roomId).emit('host-changed', {
          newHostId: newHost.id
        });

        console.log(`👑 Host transferred to ${newHost.name}`);
        
        }
      }

      // Clean up empty room
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Deleted empty room: ${roomId}`);
      }

      socket.emit('left-room', { roomId });
      console.log(`✅ ${participant.name} left room ${roomId}`);
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  }

  handleGetParticipants(socket: Socket, data: { roomId: string }) {
    try {
      const { roomId } = data;
      const room = this.rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const participantsList = Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        hasVideo: p.hasVideo,
        hasAudio: p.hasAudio
      }));

      socket.emit('participants-list', {
        roomId,
        participants: participantsList
      });
    } catch (error) {
      console.error('❌ Error getting participants:', error);
      socket.emit('error', { message: 'Failed to get participants' });
    }
  }

  handleToggleMedia(socket: Socket, data: ToggleMediaData) {
    try {
      const { roomId, mediaType, enabled } = data;
      const participantId = socket.id;

      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const participant = room.participants.get(participantId);
      if (!participant) {
        socket.emit('error', { message: 'Participant not found' });
        return;
      }

      // Update participant media state
      if (mediaType === 'video') {
        participant.hasVideo = enabled;
      } else if (mediaType === 'audio') {
        participant.hasAudio = enabled;
      }

      // Notify other participants
      socket.to(roomId).emit('participant-media-changed', {
        participantId,
        mediaType,
        enabled
      });

      console.log(`🎥 ${participant.name} ${enabled ? 'enabled' : 'disabled'} ${mediaType}`);
    } catch (error) {
      console.error('❌ Error toggling media:', error);
      socket.emit('error', { message: 'Failed to toggle media' });
    }
  }

  handleDisconnect(socket: Socket) {
    try {
      const participantId = socket.id;

      // Find and leave all rooms this participant was in
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.participants.has(participantId)) {
          this.handleLeaveRoom(socket, { roomId });
        }
      }
    } catch (error) {
      console.error('❌ Error handling disconnect:', error);
    }
  }
}