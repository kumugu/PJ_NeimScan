'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCamera } from '../hooks/useCamera';
import type { CameraCaptureProps, CameraCapture } from '../types/index';

const CameraCaptureComponent: React.FC<CameraCaptureProps> = ({
  onCapture,
  onError,
  className = 'camera-container'
}) => {
  // 1. 모든 useState 선언부 - 항상 같은 순서로 호출
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isCapturing, setIsCapturing] = useState(false);
  
  // 2. 모든 useRef 선언부
  const mountedRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 3. useCamera 훅 호출 - 항상 같은 위치에서 호출
  const {
    isClient,
    stream,
    error,
    isCameraReady,
    facingMode,
    videoRef,
    canvasRef,
    toggleFacingMode,
    takePhoto
  } = useCamera({
    facingMode: 'environment', // OCR을 위해 후면 카메라 기본 사용
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  });
  
  // 4. 모든 useCallback 선언부
  const handleCapture = useCallback(() => {
    if (!isClient || !isCameraReady || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const photoData = takePhoto();
      if (photoData && mountedRef.current) {
        setCapturedImage(photoData);
        
        const captureData: CameraCapture = {
          imageData: photoData,
          timestamp: new Date()
        };
        
        onCapture(captureData);
      }
    } catch (err) {
      if (mountedRef.current) {
        onError(err instanceof Error ? err.message : '사진 촬영 중 오류가 발생했습니다.');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isClient, isCameraReady, isCapturing, takePhoto, onCapture, onError]);
  
  const handleClearImage = useCallback(() => {
    if (!isClient) return;
    
    if (mountedRef.current) {
      setCapturedImage(null);
    }
  }, [isClient]);
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isClient) return;
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      onError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result && mountedRef.current) {
        const imageData = e.target.result as string;
        setCapturedImage(imageData);
        
        const captureData: CameraCapture = {
          imageData,
          timestamp: new Date()
        };
        
        onCapture(captureData);
      }
    };
    reader.readAsDataURL(file);
  }, [isClient, onCapture, onError]);
  
  const handleOpenFileDialog = useCallback(() => {
    if (!isClient || !fileInputRef.current) return;
    fileInputRef.current.click();
  }, [isClient]);
  
  const handleDownload = useCallback(() => {
    if (!isClient || !capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `capture-${new Date().toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [isClient, capturedImage]);
  
  // 5. 모든 useEffect 선언부
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 오류 처리를 위한 useEffect
  useEffect(() => {
    if (!isClient) return;
    
    if (error) {
      if (mountedRef.current) {
        setCameraPermission('denied');
        onError(error.message || '카메라 접근 중 오류가 발생했습니다.');
      }
    } else if (stream) {
      if (mountedRef.current) {
        setCameraPermission('granted');
      }
    }
  }, [isClient, error, stream, onError]);
  
  // 카메라 권한 확인을 위한 useEffect
  useEffect(() => {
    if (!isClient) return;
    
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        if (mountedRef.current) {
          setCameraPermission(result.state as 'prompt' | 'granted' | 'denied');
          
          result.onchange = () => {
            if (mountedRef.current) {
              setCameraPermission(result.state as 'prompt' | 'granted' | 'denied');
            }
          };
        }
      } catch (err) {
        // 일부 브라우저는 permissions API를 지원하지 않음
        console.log('Permissions API not supported');
      }
    };
    
    checkPermissions();
  }, [isClient]);
  
  // 6. 조건부 렌더링 - 모든 Hook 이후에 배치
  if (!isClient) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-600">카메라 준비 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {cameraPermission === 'denied' && (
        <div className="flex flex-col h-full bg-gray-50 justify-center items-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">카메라 권한 필요</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              축의금 봉투를 촬영하려면 카메라 권한이 필요합니다.
              브라우저 설정에서 카메라 권한을 허용해주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleOpenFileDialog}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                📁 파일에서 선택
              </button>
              <p className="text-xs text-gray-500">대신 갤러리에서 사진을 선택할 수 있습니다</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      )}
      
      {cameraPermission === 'granted' && (
        <div className="flex flex-col h-full">
          {!capturedImage ? (
            <>
              {/* 카메라 뷰 */}
              <div className="flex-1 relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* 촬영 가이드 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 opacity-50">
                    <div className="text-white text-center mt-20 text-sm">
                      축의금 봉투를 이 영역에 맞춰주세요
                    </div>
                  </div>
                </div>
                
                {/* 상단 버튼들 */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <button
                    onClick={toggleFacingMode}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full"
                  >
                    📷
                  </button>
                  <button
                    onClick={handleOpenFileDialog}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full"
                  >
                    📁
                  </button>
                </div>
              </div>
              
              {/* 하단 컨트롤 */}
              <div className="bg-white p-6">
                <div className="flex justify-center items-center">
                  <button
                    onClick={handleCapture}
                    disabled={!isCameraReady || isCapturing}
                    className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCapturing ? '...' : '📸'}
                  </button>
                </div>
                <p className="text-center text-gray-600 text-sm mt-2">
                  축의금 봉투를 촬영하세요
                </p>
              </div>
            </>
          ) : (
            <>
              {/* 촬영된 이미지 뷰 */}
              <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
              
              {/* 하단 버튼들 */}
              <div className="bg-white p-6">
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearImage}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    다시 촬영
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    💾
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileSelect}
      />
      
      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraCaptureComponent;