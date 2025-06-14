import React from 'react';

export interface ContributionRecord {
  id?: string;
  name: string;
  amount: number;
  memo?: string;
  date: Date;
  imageData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CameraCapture {
  imageData: string;
  timestamp: Date;
}

export interface UseOCRReturn {
  processOCR: (imageData: string) => Promise<OCRResult>;
  isLoading: boolean;
  error: string | null;
}

export interface OCRResult {
  extractedText: string;
  name?: string;
  amount?: number;
  confidence: number;
}

export interface CameraCaptureProps {
  onCapture: (capture: CameraCapture) => void;
  onError: (error: string) => void;
  className?: string;
}

export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  width?: { ideal: number };
  height?: { ideal: number };
}

export interface UseCameraReturn {
  isClient: boolean;
  stream: MediaStream | null;
  error: Error | null;
  isCameraReady: boolean;
  facingMode: 'user' | 'environment';
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  toggleFacingMode: () => void;
  takePhoto: () => string | null;
}
