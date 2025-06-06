import { useState, useCallback, useRef } from 'react';
import { RecordingState } from '@/types/webrtc.types';

export function useMediaRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    chunks: []
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (stream: MediaStream, options?: MediaRecorderOptions) => {
    try {
      // Default high-quality recording options
      const defaultOptions: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps for high quality
        audioBitsPerSecond: 128000   // 128 kbps for audio
      };

      // Fallback options if the preferred codec isn't supported
      const fallbackOptions: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2000000,
        audioBitsPerSecond: 128000
      };

      let recordingOptions = { ...defaultOptions, ...options };
      
      // Check if the preferred MIME type is supported
      if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType!)) {
        console.warn('Preferred codec not supported, falling back to VP8');
        recordingOptions = { ...fallbackOptions, ...options };
        
        if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType!)) {
          // Use browser default
          recordingOptions = { ...options };
          delete recordingOptions.mimeType;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, recordingOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setRecordingState(prev => ({
            ...prev,
            chunks: [...chunksRef.current]
          }));
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        const startTime = new Date();
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          startTime,
          duration: 0
        }));

        // Update duration every second
        intervalRef.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: Date.now() - startTime.getTime()
          }));
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        setRecordingState(prev => ({
          ...prev,
          isRecording: false
        }));
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        stopRecording();
      };

      // Start recording with 1-second chunks for better memory management
      mediaRecorder.start(1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [recordingState.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.pause();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [recordingState.isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
      
      // Resume duration tracking
      const resumeTime = Date.now() - recordingState.duration;
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: Date.now() - resumeTime
        }));
      }, 1000);
    }
  }, [recordingState.duration]);

  const getRecordedBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    return new Blob(chunksRef.current, { type: mimeType });
  }, []);

  const clearRecording = useCallback(() => {
    chunksRef.current = [];
    setRecordingState({
      isRecording: false,
      duration: 0,
      chunks: []
    });
  }, []);

  const downloadRecording = useCallback((filename?: string) => {
    const blob = getRecordedBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getRecordedBlob]);

  // Format duration for display
  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordedBlob,
    clearRecording,
    downloadRecording,
    formatDuration: (duration?: number) => formatDuration(duration || recordingState.duration),
    isSupported: typeof MediaRecorder !== 'undefined'
  };
}