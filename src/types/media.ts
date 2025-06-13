export interface CameraHookReturn {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
  switchCamera: () => void;
  currentFacingMode: 'user' | 'environment';
  resetCamera: () => Promise<void>;
  isBrowserSupported: boolean;
}

export interface MediaDevicePermission {
  camera: boolean;
  microphone?: boolean;
}

// Safari PWA 특화 타입
export interface SafariPWAMediaConstraints extends MediaStreamConstraints {
  video: {
    facingMode: 'user' | 'environment';
    width: { ideal: number };
    height: { ideal: number };
  };
}

// 카메라 권한 상태 타입
export type PermissionState = 'granted' | 'denied' | 'prompt';

// OCR 연동을 위한 캡처 데이터 타입
export interface CameraCaptureData {
  id: string;
  imageData: string; // Base64 형식
  timestamp: Date;
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}