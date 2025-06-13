'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

// 브라우저 호환성을 위한 타입 정의
interface MediaDevicePermission {
  state: 'granted' | 'denied' | 'prompt';
}

export interface CameraHookReturn {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
  switchCamera: () => void;
  currentFacingMode: 'user' | 'environment';
  resetCamera: () => Promise<void>;
  isClient: boolean;
}

/**
 * ✅ 수정된 Safari PWA 카메라 권한 관리 훅
 * Hook 순서 변경 문제를 해결하고 Hydration 오류를 방지
 */
export const useCamera = (): CameraHookReturn => {
  // ✅ 1. 모든 useState를 먼저 선언 (조건 없이)
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [isClient, setIsClient] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastPermissionCheck, setLastPermissionCheck] = useState<number>(0);
  
  // ✅ 2. 모든 useRef를 다음에 선언
  const permissionRef = useRef<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ✅ 3. useLayoutEffect로 클라이언트 체크 (렌더링 전 실행)
  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ 4. 모든 useCallback을 조건부 로직 이전에 선언
  const isBrowserAPIAvailable = useCallback((): boolean => {
    return (
      isClient &&
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }, [isClient]);

  const checkPermissionStatus = useCallback(async (): Promise<boolean | null> => {
    if (!isBrowserAPIAvailable()) {
      return null;
    }

    try {
      if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
        try {
          const permissionStatus = await navigator.permissions.query({ 
            name: 'camera' as PermissionName 
          });
          
          if (permissionStatus.state === 'granted') {
            return true;
          } else if (permissionStatus.state === 'denied') {
            return false;
          } else {
            return null;
          }
        } catch (permErr) {
          console.warn('Permissions API 사용 불가:', permErr);
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput');

      if (videoDevices.length > 0 && videoDevices.some(device => device.label !== '')) {
        return true;
      }
      
      if (videoDevices.length > 0) {
        return null;
      }
      
      return false;
    } catch (err) {
      console.error('권한 확인 중 오류:', err);
      return null;
    }
  }, [isBrowserAPIAvailable]);

  const initializeCamera = useCallback(async () => {
    if (!isBrowserAPIAvailable() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setHasPermission(true);
      permissionRef.current = true;
      setLastPermissionCheck(Date.now());
      setRetryCount(0);
    } catch (err: any) {
      console.error('카메라 초기화 오류:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasPermission(false);
        permissionRef.current = false;
        setError('카메라 접근이 거부되었습니다. 설정에서 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
        setError('카메라에 접근할 수 없습니다. 다른 앱에서 사용 중일 수 있습니다.');
        
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            initializeCamera();
          }, 1000 * (retryCount + 1));
        }
      } else if (err.name === 'OverconstrainedError') {
        setError('요청한 카메라 설정을 지원하지 않습니다.');
      } else {
        setError(`카메라 접근 중 오류가 발생했습니다: ${err.message}`);
      }
      
      setStream(null);
      streamRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [currentFacingMode, isLoading, retryCount, isBrowserAPIAvailable]);

  const requestPermission = useCallback(async () => {
    if (!isBrowserAPIAvailable()) {
      setError('브라우저에서 카메라를 지원하지 않습니다.');
      return;
    }
    
    await initializeCamera();
  }, [initializeCamera, isBrowserAPIAvailable]);

  const switchCamera = useCallback(() => {
    if (!isBrowserAPIAvailable()) return;
    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [isBrowserAPIAvailable]);

  const resetCamera = useCallback(async () => {
    if (!isBrowserAPIAvailable()) return;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setStream(null);
    streamRef.current = null;
    
    if (permissionRef.current === true) {
      await initializeCamera();
    }
  }, [initializeCamera, isBrowserAPIAvailable]);
  
  // ✅ 5. 모든 useEffect를 항상 같은 순서로 호출
  // Effect 1: 초기 권한 확인
  useEffect(() => {
    let mounted = true;
    
    const checkInitialPermission = async () => {
      // ✅ 조건 체크는 useEffect 내부에서 처리
      if (!isClient || !mounted) return;
      
      const permissionStatus = await checkPermissionStatus();
      if (!mounted) return;
      
      setHasPermission(permissionStatus);
      permissionRef.current = permissionStatus;
      
      if (permissionStatus === true) {
        await initializeCamera();
      }
    };
    
    checkInitialPermission();
    
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isClient, checkPermissionStatus, initializeCamera]);
  
  // Effect 2: 카메라 방향 변경 처리
  useEffect(() => {
    // ✅ 조건 체크는 useEffect 내부에서 처리
    if (isClient && permissionRef.current === true) {
      initializeCamera();
    }
  }, [currentFacingMode, initializeCamera, isClient]);
  
  // Effect 3: 페이지 가시성 변경 처리
  useEffect(() => {
    // ✅ 조건 체크는 useEffect 내부에서 처리
    if (!isClient) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastCheck = Date.now() - lastPermissionCheck;
        
        if (permissionRef.current === true && (!streamRef.current || timeSinceLastCheck > 60000)) {
          await resetCamera();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [lastPermissionCheck, resetCamera, isClient]);

  return {
    stream,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    switchCamera,
    currentFacingMode,
    resetCamera,
    isClient
  };
};

export default useCamera;