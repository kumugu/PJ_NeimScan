'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
 * 개선된 Safari PWA 카메라 권한 관리 훅
 * Hydration 오류를 방지하고 iOS Safari에서 카메라 권한 지속성 문제를 해결
 */
export const useCamera = (): CameraHookReturn => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  
  // 클라이언트 전용 상태
  const [isClient, setIsClient] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastPermissionCheck, setLastPermissionCheck] = useState<number>(0);
  
  // 권한 상태와 스트림 참조 유지
  const permissionRef = useRef<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 클라이언트 체크 (SSR 호환성)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  /**
   * 브라우저 API 안전 체크
   */
  const isBrowserAPIAvailable = useCallback((): boolean => {
    return (
      isClient &&
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }, [isClient]);

  /**
   * 카메라 권한 상태 확인
   * iOS 버전별 차이를 고려한 구현
   */
  const checkPermissionStatus = useCallback(async (): Promise<boolean | null> => {
    if (!isBrowserAPIAvailable()) {
      return null;
    }

    try {
      // Permissions API 사용 가능 여부 확인
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
            return null; // 'prompt' 상태
          }
        } catch (permErr) {
          console.warn('Permissions API 사용 불가:', permErr);
          // Permissions API 실패 시 대체 방법 사용
        }
      }
      
      // navigator.permissions가 지원되지 않는 경우 대체 방법
      // 디바이스 열거를 통한 권한 체크 (Safari에서 작동)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput');

      // 장치 레이블이 있으면 권한이 있는 것
      if (videoDevices.length > 0 && videoDevices.some(device => device.label !== '')) {
        return true;
      }
      
      // 장치는 있지만 레이블이 없는 경우 - 권한 미정
      if (videoDevices.length > 0) {
        return null;
      }
      
      // 비디오 장치가 없는 경우
      return false;
    } catch (err) {
      console.error('권한 확인 중 오류:', err);
      return null;
    }
  }, [isBrowserAPIAvailable]);

  /**
   * 카메라 스트림 초기화
   * 다양한 에러 상황 처리 강화
   */
  const initializeCamera = useCallback(async () => {
    if (!isBrowserAPIAvailable() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 현재 스트림이 있으면 트랙 중지
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 기본 제약 조건 설정
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      // getUserMedia 호출
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 스트림 설정
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setHasPermission(true);
      permissionRef.current = true;
      
      // 마지막 권한 체크 시간 갱신
      setLastPermissionCheck(Date.now());
      
      // 재시도 카운터 리셋
      setRetryCount(0);
    } catch (err: any) {
      console.error('카메라 초기화 오류:', err);
      
      // 에러 타입별 처리
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasPermission(false);
        permissionRef.current = false;
        setError('카메라 접근이 거부되었습니다. 설정에서 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
        setError('카메라에 접근할 수 없습니다. 다른 앱에서 사용 중일 수 있습니다.');
        
        // Safari PWA에서 자주 발생하는 오류, 자동 재시도
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            initializeCamera();
          }, 1000 * (retryCount + 1)); // 점진적 재시도 간격
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

  /**
   * 권한 요청 처리
   */
  const requestPermission = useCallback(async () => {
    if (!isBrowserAPIAvailable()) {
      setError('브라우저에서 카메라를 지원하지 않습니다.');
      return;
    }
    
    await initializeCamera();
  }, [initializeCamera, isBrowserAPIAvailable]);

  /**
   * 전/후면 카메라 전환
   */
  const switchCamera = useCallback(() => {
    if (!isBrowserAPIAvailable()) return;
    
    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [isBrowserAPIAvailable]);

  /**
   * 카메라 재설정
   * Safari PWA에서 백그라운드-포그라운드 전환 시 필요
   */
  const resetCamera = useCallback(async () => {
    if (!isBrowserAPIAvailable()) return;
    
    // 현재 스트림이 있으면 트랙 중지
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setStream(null);
    streamRef.current = null;
    
    // 권한이 있는 경우에만 재초기화
    if (permissionRef.current === true) {
      await initializeCamera();
    }
  }, [initializeCamera, isBrowserAPIAvailable]);
  
  /**
   * 초기 마운트 시 권한 상태 확인 (클라이언트에서만)
   */
  useEffect(() => {
    if (!isClient) return;

    const checkInitialPermission = async () => {
      const permissionStatus = await checkPermissionStatus();
      setHasPermission(permissionStatus);
      permissionRef.current = permissionStatus;
      
      // 이미 권한이 있는 경우 자동으로 카메라 초기화
      if (permissionStatus === true) {
        await initializeCamera();
      }
    };
    
    checkInitialPermission();
    
    return () => {
      // 컴포넌트 언마운트 시 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isClient, checkPermissionStatus, initializeCamera]);
  
  /**
   * 카메라 방향 변경 시 재초기화
   */
  useEffect(() => {
    // 이미 권한이 있고 클라이언트인 경우에만 처리
    if (isClient && permissionRef.current === true) {
      initializeCamera();
    }
  }, [currentFacingMode, initializeCamera, isClient]);
  
  /**
   * Safari PWA 특화 이벤트 리스너
   * 페이지 가시성 변경 시 카메라 상태 관리
   */
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = async () => {
      // 페이지가 다시 보이게 되었을 때
      if (document.visibilityState === 'visible') {
        // 마지막 권한 체크 후 일정 시간이 지났거나 스트림이 없는 경우
        const timeSinceLastCheck = Date.now() - lastPermissionCheck;
        
        if (permissionRef.current === true && (!streamRef.current || timeSinceLastCheck > 60000)) {
          // 1분 이상 지났거나 스트림이 없는 경우 재설정
          await resetCamera();
        }
      }
    };
    
    // PWA 환경에서 중요한 이벤트들
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    // iOS PWA에서 추가로 필요한 이벤트
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