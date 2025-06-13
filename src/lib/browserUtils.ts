
/**
 * 브라우저 호환성 체크 유틸리티
 * Safari PWA, Chrome, Edge 등 다양한 환경 지원
 */

export interface BrowserCapabilities {
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasPermissionsAPI: boolean;
  hasEnumerateDevices: boolean;
  isPWA: boolean;
  isSafari: boolean;
  isIOS: boolean;
}

/**
 * 현재 브라우저의 미디어 API 지원 여부 확인
 */
export const checkBrowserCapabilities = (): BrowserCapabilities => {
  const hasMediaDevices = 
    typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator;

  const hasGetUserMedia = 
    hasMediaDevices && 
    'getUserMedia' in navigator.mediaDevices;

  const hasPermissionsAPI = 
    typeof navigator !== 'undefined' && 
    'permissions' in navigator && 
    'query' in navigator.permissions;

  const hasEnumerateDevices = 
    hasMediaDevices && 
    'enumerateDevices' in navigator.mediaDevices;

  // PWA 환경 감지
  const isPWA = 
    typeof window !== 'undefined' && 
    (window.matchMedia('(display-mode: standalone)').matches || 
     (window.navigator as any).standalone === true);

  // Safari 감지
  const isSafari = 
    typeof navigator !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // iOS 감지
  const isIOS = 
    typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  return {
    hasMediaDevices,
    hasGetUserMedia,
    hasPermissionsAPI,
    hasEnumerateDevices,
    isPWA,
    isSafari,
    isIOS
  };
};

/**
 * MediaDevices API 사용 가능 여부 체크 (타입 가드)
 */
export const isMediaDevicesSupported = (): boolean => {
  const capabilities = checkBrowserCapabilities();
  return capabilities.hasMediaDevices && capabilities.hasGetUserMedia;
};

/**
 * 권한 API 사용 가능 여부 체크
 */
export const isPermissionsAPISupported = (): boolean => {
  const capabilities = checkBrowserCapabilities();
  return capabilities.hasPermissionsAPI;
};

/**
 * Safari PWA 환경 특별 처리가 필요한지 확인
 */
export const needsSafariPWAHandling = (): boolean => {
  const capabilities = checkBrowserCapabilities();
  return capabilities.isSafari && capabilities.isPWA;
};

/**
 * 에러 메시지를 브라우저별로 맞춤 제공
 */
export const getBrowserSpecificErrorMessage = (error: DOMException): string => {
  const capabilities = checkBrowserCapabilities();

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      if (capabilities.isSafari) {
        return '카메라 접근이 거부되었습니다. Safari 설정 > 웹사이트 > 카메라에서 권한을 허용해주세요.';
      } else {
        return '카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
      }

    case 'NotFoundError':
      return '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';

    case 'NotReadableError':
    case 'AbortError':
      if (capabilities.isSafari && capabilities.isPWA) {
        return '카메라를 사용할 수 없습니다. 앱을 재실행하거나 다른 앱에서 카메라를 사용 중인지 확인해주세요.';
      } else {
        return '카메라에 접근할 수 없습니다. 다른 앱에서 사용 중일 수 있습니다.';
      }

    default:
      return `카메라 접근 중 오류가 발생했습니다: ${error.message}`;
  }
};