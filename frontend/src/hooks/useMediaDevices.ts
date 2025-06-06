import { useState, useEffect, useCallback } from 'react';
import { MediaDeviceInfo } from '@/types/webrtc.types';

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    videoInput: '',
    audioOutput: ''
  });
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available media devices
  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const formattedDevices: MediaDeviceInfo[] = deviceList.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
        kind: device.kind as 'audioinput' | 'videoinput' | 'audiooutput'
      }));
      
      setDevices(formattedDevices);
      
      // Auto-select first available devices if none selected
      if (!selectedDevices.audioInput) {
        const audioInput = formattedDevices.find(d => d.kind === 'audioinput');
        if (audioInput) {
          setSelectedDevices(prev => ({ ...prev, audioInput: audioInput.deviceId }));
        }
      }
      
      if (!selectedDevices.videoInput) {
        const videoInput = formattedDevices.find(d => d.kind === 'videoinput');
        if (videoInput) {
          setSelectedDevices(prev => ({ ...prev, videoInput: videoInput.deviceId }));
        }
      }
    } catch (error) {
      console.error('Error getting devices:', error);
      setError('Failed to get media devices');
    }
  }, [selectedDevices.audioInput, selectedDevices.videoInput]);

  // Request media permissions
  const requestPermissions = useCallback(async (audio = true, video = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const constraints: MediaStreamConstraints = {};
      
      if (audio) {
        constraints.audio = selectedDevices.audioInput 
          ? { deviceId: { exact: selectedDevices.audioInput } }
          : true;
      }
      
      if (video) {
        constraints.video = selectedDevices.videoInput
          ? { 
              deviceId: { exact: selectedDevices.videoInput },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      setPermissions({
        camera: video && mediaStream.getVideoTracks().length > 0,
        microphone: audio && mediaStream.getAudioTracks().length > 0
      });
      
      // Refresh device list after getting permissions
      await getDevices();
      
      return mediaStream;
    } catch (error: any) {
      console.error('Error requesting permissions:', error);
      
      let errorMessage = 'Failed to access media devices';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevices, getDevices]);

  // Get screen share stream
  const getScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      return screenStream;
    } catch (error) {
      console.error('Error getting screen share:', error);
      throw error;
    }
  }, []);

  // Switch camera/microphone
  const switchDevice = useCallback(async (deviceType: 'audioInput' | 'videoInput', deviceId: string) => {
    setSelectedDevices(prev => ({ ...prev, [deviceType]: deviceId }));
    
    if (stream) {
      // Stop current stream
      stream.getTracks().forEach(track => track.stop());
      
      // Request new stream with updated device
      await requestPermissions(
        deviceType === 'audioInput' || permissions.microphone,
        deviceType === 'videoInput' || permissions.camera
      );
    }
  }, [stream, permissions, requestPermissions]);

  // Toggle audio/video
  const toggleAudio = useCallback((enabled: boolean) => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, [stream]);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }, [stream]);

  // Stop all tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setPermissions({ camera: false, microphone: false });
    }
  }, [stream]);

  // Initialize devices on mount
  useEffect(() => {
    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      stopStream();
    };
  }, [getDevices, stopStream]);

  return {
    devices,
    selectedDevices,
    permissions,
    stream,
    isLoading,
    error,
    requestPermissions,
    getScreenShare,
    switchDevice,
    toggleAudio,
    toggleVideo,
    stopStream,
    refreshDevices: getDevices
  };
}