'use client';

import { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import ImagePreview from '@/components/ImagePreview';
import OCRProcess from '@/components/OCRProcess';
import ResultEditor from '@/components/ResultEditor';
import { useSupabase } from '@/hooks/useSupabase';
import type { CameraCapture as CameraCaptureType } from '@/types';

type AppStep = 'camera' | 'preview' | 'processing' | 'editing' | 'records';

interface OCRResult {
  name: string;
  amount: number;
  extractedText: string[];
  confidence: number;
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('camera');
  const [capturedImage, setCapturedImage] = useState<CameraCaptureType | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addRecord } = useSupabase();

  // 카메라 촬영 완료
  const handleCameraCapture = (capture: CameraCaptureType) => {
    setCapturedImage(capture);
    setCurrentStep('preview');
    setError(null);
  };

  // 카메라 에러
  const handleCameraError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 이미지 미리보기에서 확인
  const handlePreviewConfirm = () => {
    setCurrentStep('processing');
  };

  // 이미지 미리보기에서 다시 촬영
  const handlePreviewRetake = () => {
    setCapturedImage(null);
    setCurrentStep('camera');
  };

  // OCR 처리 성공
  const handleOCRSuccess = (result: OCRResult) => {
    setOcrResult(result);
    setCurrentStep('editing');
  };

  // OCR 처리 실패
  const handleOCRError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('preview'); // 미리보기로 돌아가기
  };

  // OCR 처리 취소
  const handleOCRCancel = () => {
    setCurrentStep('preview');
  };

  // 결과 편집 완료
  const handleEditingSave = async (record: any) => {
    try {
      // 캡처된 이미지 데이터 포함
      const recordWithImage = {
        ...record,
        imageData: capturedImage?.imageData,
        ocrConfidence: ocrResult?.confidence || 0,
        extractedText: ocrResult?.extractedText || [],
      };

      await addRecord(recordWithImage);
      
      // 초기화 후 기록 화면으로 이동
      resetToCamera();
      setCurrentStep('records');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    }
  };

  // 결과 편집 취소
  const handleEditingCancel = () => {
    resetToCamera();
  };

  // 초기화
  const resetToCamera = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setError(null);
    setCurrentStep('camera');
  };

  // 에러 상태 표시
  if (error && currentStep === 'camera') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">NeimScan</h1>
              <p className="text-sm text-gray-600">축의금 봉투 스캔 앱</p>
            </div>
            
            {/* 진행 상태 표시 */}
            <div className="flex space-x-2">
              {['camera', 'preview', 'processing', 'editing'].map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    getCurrentStepIndex() > index 
                      ? 'bg-primary-500' 
                      : getCurrentStepIndex() === index 
                        ? 'bg-primary-300' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1" style={{ height: 'calc(100vh - 80px)' }}>
        {currentStep === 'camera' && (
          <CameraCapture 
            onCapture={handleCameraCapture}
            onError={handleCameraError}
          />
        )}
        
        {currentStep === 'preview' && capturedImage && (
          <ImagePreview 
            capture={capturedImage}
            onConfirm={handlePreviewConfirm}
            onRetake={handlePreviewRetake}
          />
        )}
        
        {currentStep === 'processing' && capturedImage && (
          <OCRProcess 
            capture={capturedImage}
            onSuccess={handleOCRSuccess}
            onError={handleOCRError}
            onCancel={handleOCRCancel}
          />
        )}
        
        {currentStep === 'editing' && ocrResult && (
          <ResultEditor 
            initialData={{
              name: ocrResult.name,
              amount: ocrResult.amount,
              imageData: capturedImage?.imageData,
            }}
            onSave={handleEditingSave}
            onCancel={handleEditingCancel}
          />
        )}
        
        {currentStep === 'records' && (
          <div className="flex flex-col h-full items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">저장 완료!</h3>
              <p className="text-gray-600 mb-6 text-sm">
                축의금 정보가 성공적으로 저장되었습니다.
              </p>
              <button
                onClick={resetToCamera}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
              >
                새로운 촬영
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  // 현재 단계의 인덱스 반환
  function getCurrentStepIndex(): number {
    const steps = ['camera', 'preview', 'processing', 'editing'];
    return steps.indexOf(currentStep);
  }
}