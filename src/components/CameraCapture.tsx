'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import type { CameraCapture as CameraCaptureType } from '@/types';

interface CameraCaptureProps {
  onCapture: (capture: CameraCaptureType) => void;
  onError: (error: string) => void;
}

export default function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    stream,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    switchCamera,
    currentFacingMode
  } = useCamera();

  const [isCapturing, setIsCapturing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // 가이드 자동 숨김
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGuide(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas context not available');

      // 캔버스 크기를 비디오 크기에 맞춤
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 비디오 프레임을 캔버스에 그리기
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Base64 이미지 데이터 생성 (고품질)
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      const capture: CameraCaptureType = {
        id: `capture_${Date.now()}`,
        imageData,
        timestamp: new Date(),
        width: canvas.width,
        height: canvas.height
      };

      onCapture(capture);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture, onError]);

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">카메라 권한 필요</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            축의금 봉투를 촬영하기 위해<br />
            카메라 접근 권한이 필요합니다.
          </p>
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '권한 요청 중...' : '카메라 권한 허용'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 비디오 미리보기 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* 캡처용 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 오버레이 UI */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {/* 상단 컨트롤 */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className={`bg-black/70 text-white px-3 py-2 rounded-full text-sm transition-opacity duration-300 ${showGuide ? 'opacity-100' : 'opacity-0'}`}>
            📝 축의금 봉투를 화면에 맞춰 주세요
          </div>
          <button
            onClick={switchCamera}
            className="bg-black/70 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
            title="카메라 전환"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* 촬영 가이드 프레임 */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative">
            {/* 가이드 프레임 */}
            <div className="border-2 border-white/80 border-dashed rounded-xl w-72 h-44 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 text-white/70 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-white/70 text-sm font-medium">
                  축의금 봉투
                </span>
              </div>
            </div>
            
            {/* 모서리 포커스 인디케이터 */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center items-center">
            {/* 촬영 버튼 */}
            <button
              onClick={captureImage}
              disabled={isCapturing || isLoading}
              className="relative w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 active:scale-95"
            >
              {isCapturing ? (
                <div className="absolute inset-4 border-2 border-primary-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="absolute inset-4 bg-white rounded-full"></div>
              )}
            </button>
          </div>
          
          {/* 안내 메시지 */}
          <div className="mt-4 text-center">
            <p className="text-white/80 text-sm">
              💡 손글씨가 선명하게 보이도록 촬영해주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}