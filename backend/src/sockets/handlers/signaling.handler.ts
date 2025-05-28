import { Socket } from 'socket.io';

interface SignalingData {
  roomId: string;
  targetId: string;
  senderId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

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

export class SignalingHandler {
  constructor(private rooms: Map<string, RoomInfo>) {}

  handleOffer(socket: Socket, data: SignalingData) {
    try {
      const { roomId, targetId, senderId, offer } = data;
      
      console.log(`📤 Offer from ${senderId} to ${targetId} in room ${roomId}`);
      
      // Validate room exists
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Send offer to target participant
      socket.to(targetId).emit('offer', {
        senderId,
        offer,
        roomId
      });

      console.log(`✅ Offer relayed to ${targetId}`);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      socket.emit('error', { message: 'Failed to process offer' });
    }
  }

  handleAnswer(socket: Socket, data: SignalingData) {
    try {
      const { roomId, targetId, senderId, answer } = data;
      
      console.log(`📤 Answer from ${senderId} to ${targetId} in room ${roomId}`);
      
      // Validate room exists
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Send answer to target participant
      socket.to(targetId).emit('answer', {
        senderId,
        answer,
        roomId
      });

      console.log(`✅ Answer relayed to ${targetId}`);
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      socket.emit('error', { message: 'Failed to process answer' });
    }
  }

  handleIceCandidate(socket: Socket, data: SignalingData) {
    try {
      const { roomId, targetId, senderId, candidate } = data;
      
      console.log(`🧊 ICE candidate from ${senderId} to ${targetId}`);
      
      // Validate room exists
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Send ICE candidate to target participant
      socket.to(targetId).emit('ice-candidate', {
        senderId,
        candidate,
        roomId
      });
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
      socket.emit('error', { message: 'Failed to process ICE candidate' });
    }
  }

  handleRequestConnection(socket: Socket, data: { roomId: string; targetId: string }) {
    try {
      const { roomId, targetId } = data;
      const senderId = socket.id;
      
      console.log(`🤝 Connection request from ${senderId} to ${targetId} in room ${roomId}`);
      
      // Validate room exists
      const room = this.rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if both participants are in the room
      if (!room.participants.has(senderId) || !room.participants.has(targetId)) {
        socket.emit('error', { message: 'One or both participants not in room' });
        return;
      }

      // Notify target about connection request
      socket.to(targetId).emit('connection-request', {
        senderId,
        roomId
      });

      console.log(`✅ Connection request sent to ${targetId}`);
    } catch (error) {
      console.error('❌ Error handling connection request:', error);
      socket.emit('error', { message: 'Failed to process connection request' });
    }
  }
}