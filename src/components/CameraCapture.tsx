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
    currentFacingMode,
    resetCamera
  } = useCamera();

  const [isCapturing, setIsCapturing] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 렌더링 시작 부분에 추가
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [stream]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || !stream) return;

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

      // Base64 이미지 데이터 생성 (OCR 최적화를 위해 품질 높게)
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
  }, [isCapturing, onCapture, onError, stream]);

  const handleCameraButtonClick = async () => {
    // 카메라가 이미 활성화되어 있는 경우 촬영
    if (isCameraActive && stream) {
      captureImage();
      return;
    }

    // 권한이 없거나 스트림이 없는 경우 권한 요청
    await requestPermission();
  };

  const handleRetryCamera = async () => {
    await resetCamera();
  };

  const openPermissionGuide = () => {
    setShowPermissionGuide(true);
  };

  // 권한이 없는 경우 사용자 안내 화면
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-3 text-gray-900">카메라 권한이 차단됨</h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            축의금 봉투를 스캔하려면 카메라 접근 권한이 필요합니다.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '권한 확인 중...' : '카메라 권한 다시 요청'}
            </button>
            
            <button
              onClick={openPermissionGuide}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
            >
              설정 방법 보기
            </button>
          </div>
        </div>

        {/* 권한 설정 가이드 모달 */}
        {showPermissionGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Safari 카메라 권한 설정</h4>
                  <button
                    onClick={() => setShowPermissionGuide(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Safari 브라우저에서:</h5>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>주소창 왼쪽의 "aA" 버튼 터치</li>
                      <li>"웹사이트 설정" 선택</li>
                      <li>"카메라"를 "허용"으로 변경</li>
                      <li>페이지 새로고침</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h5 className="font-medium text-amber-900 mb-2">설정 앱에서 (전체 허용):</h5>
                    <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                      <li>설정 - Safari</li>
                      <li>"카메라" 선택</li>
                      <li>"허용"으로 변경</li>
                    </ol>
                    <p className="text-xs text-amber-700 mt-2">⚠️ 모든 웹사이트에 카메라 권한이 부여됩니다</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 권한 상태를 확인 중인 경우
  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-3 text-gray-900">카메라 준비 중...</h3>
          <p className="text-gray-700 mb-6">
            잠시만 기다려주세요.
          </p>
          
          <button
            onClick={handleCameraButtonClick}
            disabled={isLoading}
            className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '카메라 시작 중...' : '카메라 시작하기'}
          </button>
        </div>
      </div>
    );
  }

  // 카메라가 활성화된 경우
  return (
    <div className="relative w-full h-full bg-black">
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

      {/* 에러 시 오버레이 */}
      {error && !isCameraActive && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold mb-2 text-gray-900">카메라 오류</h4>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRetryCamera}
              className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 카메라 UI 오버레이 */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* 상단 컨트롤 */}
        <div className="flex justify-between items-center">
          <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            {isCameraActive ? '축의금 봉투를 화면에 맞춰 주세요' : '카메라 시작하기'}
          </div>
          
          {isCameraActive && (
            <button
              onClick={switchCamera}
              className="bg-black bg-opacity-60 text-white p-3 rounded-full hover:bg-opacity-80 backdrop-blur-sm"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {/* 촬영 가이드 프레임 (카메라가 활성화된 경우에만) */}
        {isCameraActive && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="relative border-2 border-white border-dashed rounded-xl w-full max-w-sm aspect-[4/3] flex items-center justify-center">
              {/* 모서리 포커스 인디케이터 */}
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-white"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-white"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-white"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-white"></div>
              
              <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                봉투를 이 영역에 맞춰 주세요
              </span>
            </div>
          </div>
        )}

        {/* 하단 컨트롤 */}
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-6">
            {/* 촬영/시작 버튼 */}
            <button
              onClick={handleCameraButtonClick}
              disabled={isCapturing || isLoading}
              className={`
                relative w-20 h-20 rounded-full border-4 border-white 
                ${isCameraActive 
                  ? 'bg-white hover:bg-gray-100' 
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 ease-in-out
                shadow-lg
              `}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
              ) : isCapturing ? (
                <div className="absolute inset-2 border-2 border-primary-500 rounded-full animate-pulse" />
              ) : isCameraActive ? (
                // 촬영 버튼 (카메라 아이콘)
                <svg className="w-8 h-8 mx-auto text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1L21.99 10c-.25-2.69-2.61-5-5.33-5.24l-.21-1.77C16.24 2.45 15.47 2 14.59 2H9.41c-.88 0-1.65.45-1.86 1.01L7.34 4.78C4.62 5.03 2.26 7.34 2.01 10L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97L2.01 14c.25 2.66 2.61 4.97 5.33 5.22l.21 1.77C7.76 21.55 8.53 22 9.41 22h5.18c.88 0 1.65-.45 1.86-1.01l.21-1.76C19.38 18.97 21.74 16.66 21.99 14l-2.56-1.03Z"/>
                </svg>
              ) : (
                // 시작 버튼 (플레이 아이콘)
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 촬영 중 오버레이 */}
      {isCapturing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-700 font-medium">촬영 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}