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
  
  // 2. 모든 useRef 선언부 - null assertion으로 타입 오류 해결
  const mountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  
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
    
    // JPEG 형식으로 데이터 URL 생성 (OCR API 호환성 및 파일 크기 최적화)
    return canvas.toDataURL('image/jpeg', 0.92);
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
              // focusMode와 exposureMode 제거 - 표준 Web API에 없음
            }
            // audio 완전 제거 - OCR 목적이므로 불필요
          };
          
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (mountedRef.current) {
            setStream(mediaStream);
            setError(null);
            
            // 비디오 요소에 스트림 연결 (중요: 이 부분이 누락되어 있었음)
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
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
    
    if (mountedRef.current && videoRef.current) {
      // 비디오 메타데이터 로드 완료 시 카메라 준비 완료로 설정
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
        if (mountedRef.current) {
          setIsCameraReady(true);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
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