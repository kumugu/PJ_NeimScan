'use client';

import React, { useEffect, useState } from 'react';
import type { CameraCapture } from '@/types';
import { useOCR } from '@/hooks/useOCR';

interface OCRProcessProps {
  capture: CameraCapture;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function OCRProcess({ 
  capture, 
  onSuccess, 
  onError, 
  onCancel 
}: OCRProcessProps) {
  const { processOCR, isLoading, error } = useOCR();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('이미지 분석 중...');

  useEffect(() => {
    startOCRProcess();
  }, [capture]);

  const startOCRProcess = async () => {
    try {
      // 단계별 진행 시뮬레이션
      setCurrentStep('이미지 전처리 중...');
      setProgress(20);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('네이버 클로바 OCR 분석 중...');
      setProgress(50);
      
      const result = await processOCR(capture.imageData);
      
      setCurrentStep('텍스트 추출 완료!');
      setProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했습니다.');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full bg-gray-50 justify-center items-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">인식 실패</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {error}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => startOCRProcess()}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              다시 시도
            </button>
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              다시 촬영
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 justify-center items-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
        {/* 로딩 애니메이션 */}
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          손글씨 인식 중
        </h3>
        
        {/* 현재 단계 */}
        <p className="text-gray-600 mb-4 text-sm">
          {currentStep}
        </p>
        
        {/* 진행 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* 진행률 */}
        <p className="text-xs text-gray-500 mb-6">
          {progress}% 완료
        </p>
        
        {/* 취소 버튼 */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        
        {/* 안내 메시지 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 손글씨 인식에는 10-30초 정도 소요됩니다
          </p>
        </div>
      </div>
    </div>
  );
}