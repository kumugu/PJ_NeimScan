import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import type { CameraConfig, UseCameraReturn } from '../types/index';

export const useCamera = (initialConfig: CameraConfig = {}): UseCameraReturn => {
  // 1. 모든 useState 선언부 - 항상 동일한 순서로 호출
  const [isClient, setIsClient] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    initialConfig.facingMode || 'environment'
  );
  
  // 2. 모든 useRef 선언부
  const mountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 3. useLayoutEffect - 클라이언트 감지
  useLayoutEffect(() => {
    setIsClient(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 4. 모든 useCallback 선언부 - 의존성 배열 정확히 지정
  const toggleFacingMode = useCallback(() => {
    if (!isClient) return;
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [isClient]);
  
  const takePhoto = useCallback(() => {
    if (!isClient || !stream || !videoRef.current || !canvasRef.current) {
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // 고해상도로 캔버스 설정 (OCR 최적화)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // PNG 형식으로 데이터 URL 생성 (OCR에 최적)
    return canvas.toDataURL('image/png');
  }, [isClient, stream]);
  
  // 5. 모든 useEffect 선언부
  // 카메라 스트림 초기화
  useEffect(() => {
    if (!isClient) return;
    
    const initializeStream = async () => {
      try {
        if (mountedRef.current) {
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: facingMode,
              width: initialConfig.width || { ideal: 1920 },
              height: initialConfig.height || { ideal: 1080 }
            }
            // audio 완전 제거 - OCR 목적이므로 불필요
          };
          
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (mountedRef.current) {
            setStream(mediaStream);
            setError(null);
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
          setStream(null);
        }
      }
    };
    
    initializeStream();
    
    // 정리 함수
    return () => {
      if (stream) {
        const tracks = (stream as MediaStream).getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, [isClient, facingMode, initialConfig.width, initialConfig.height]);
  
  // 카메라 준비 상태 업데이트
  useEffect(() => {
    if (!stream) {
      setIsCameraReady(false);
      return;
    }
    
    if (mountedRef.current) {
      setIsCameraReady(true);
    }
  }, [stream]);
  
  return {
    isClient,
    stream,
    error,
    isCameraReady,
    facingMode,
    videoRef,
    canvasRef,
    toggleFacingMode,
    takePhoto
  };
};