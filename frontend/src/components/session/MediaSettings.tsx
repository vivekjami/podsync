'use client';

import { useState } from 'react';
import { useMediaDevices } from '@/hooks/useMediaDevices';

interface MediaSettingsProps {
  onClose: () => void;
}

export function MediaSettings({ onClose }: MediaSettingsProps) {
  const {
    devices,
    selectedDevices,
    switchDevice,
    refreshDevices
  } = useMediaDevices();

  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');

  const audioInputDevices = devices.filter(d => d.kind === 'audioinput');
  const videoInputDevices = devices.filter(d => d.kind === 'videoinput');
  const audioOutputDevices = devices.filter(d => d.kind === 'audiooutput');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Audio & Video Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'audio'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎤 Audio
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'video'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📹 Video
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'audio' && (
            <>
              {/* Microphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Microphone
                </label>
                <select
                  value={selectedDevices.audioInput}
                  onChange={(e) => switchDevice('audioInput', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {audioInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speakers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speakers
                </label>
                <select
                  value={selectedDevices.audioOutput}
                  onChange={(e) => switchDevice('audioOutput' as any, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {audioOutputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio settings */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm text-gray-700">Echo cancellation</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm text-gray-700">Noise suppression</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm text-gray-700">Auto gain control</span>
                </label>
              </div>
            </>
          )}

          {activeTab === 'video' && (
            <>
              {/* Camera */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camera
                </label>
                <select
                  value={selectedDevices.videoInput}
                  onChange={(e) => switchDevice('videoInput', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {videoInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Quality
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="low">Low (480p)</option>
                  <option value="medium">Medium (720p)</option>
                  <option value="high" selected>High (1080p)</option>
                </select>
              </div>

              {/* Frame rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frame Rate
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="15">15 FPS</option>
                  <option value="24">24 FPS</option>
                  <option value="30" selected>30 FPS</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <button
            onClick={refreshDevices}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            🔄 Refresh Devices
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}