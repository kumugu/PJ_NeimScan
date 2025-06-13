'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CameraState } from '@/types';

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    hasPermission: false,
    currentFacingMode: 'environment'
  });
  
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: state.currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setState(prev => ({
        ...prev,
        isActive: true,
        isLoading: false,
        hasPermission: true,
        error: null
      }));

    } catch (error) {
      let errorMessage = '카메라 접근에 실패했습니다.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '카메라를 찾을 수 없습니다.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '카메라가 다른 애플리케이션에서 사용 중입니다.';
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasPermission: false
      }));
    }
  }, [state.currentFacingMode]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = state.currentFacingMode === 'environment' ? 'user' : 'environment';
    
    stopStream();
    
    setState(prev => ({ ...prev, currentFacingMode: newFacingMode }));
    
    // 잠시 후 새로운 카메라로 재시작
    setTimeout(() => {
      requestPermission();
    }, 100);
  }, [state.currentFacingMode, stopStream, requestPermission]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream: streamRef.current,
    isLoading: state.isLoading,
    error: state.error,
    hasPermission: state.hasPermission,
    currentFacingMode: state.currentFacingMode,
    isActive: state.isActive,
    requestPermission,
    switchCamera,
    stopStream
  };
}