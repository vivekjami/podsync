'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateRoom = () => {
    if (!participantName.trim()) {
      alert('Please enter your name');
      return;
    }

    const newRoomId = generateRoomId();
    router.push(`/session/${newRoomId}?name=${encodeURIComponent(participantName)}&host=true`);
  };

  const handleJoinRoom = () => {
    if (!participantName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    router.push(`/session/${roomId}?name=${encodeURIComponent(participantName)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Pod<span className="text-blue-400">Sync</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Next-generation AI-powered podcast recording studio. 
            Record with up to 10 participants, get automatic transcriptions, 
            and AI-generated summaries.
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Get Started
            </h2>

            {/* Name input */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Create room */}
            <button
              onClick={handleCreateRoom}
              disabled={!participantName.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              🎙️ Create New Session
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-white/30"></div>
              <span className="px-4 text-gray-300">or</span>
              <div className="flex-1 border-t border-white/30"></div>
            </div>

            {/* Join room */}
            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!participantName.trim() || !roomId.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🚀 Join Session
            </button>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎥</div>
              <h3 className="text-white font-semibold mb-2">HD Video Calls</h3>
              <p className="text-gray-300 text-sm">Crystal clear video with up to 10 participants</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🎙️</div>
              <h3 className="text-white font-semibold mb-2">Studio Recording</h3>
              <p className="text-gray-300 text-sm">High-quality local recording for each participant</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-white font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-300 text-sm">Automatic transcription and smart summaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}