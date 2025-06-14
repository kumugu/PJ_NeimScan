'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ResultEditor from '../components/ResultEditor';
import OCRProcess from '../components/OCRProcess';
import { useSupabase } from '../hooks/useSupabase';
import type { ContributionRecord, CameraCapture } from '../types/index';

// CameraCapture를 동적 임포트로 변경 (SSR 비활성화)
const CameraCapture = dynamic(() => import('../components/CameraCapture'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">카메라 준비 중...</p>
        </div>
      </div>
    </div>
  )
});

type AppStep = 'camera' | 'ocr' | 'edit' | 'records';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('camera');
  const [capturedData, setCapturedData] = useState<CameraCapture | undefined>(undefined);
  const [ocrResult, setOcrResult] = useState<Partial<ContributionRecord> | undefined>(undefined);
  const { addRecord } = useSupabase();

  const handleCameraCapture = (capture: CameraCapture) => {
    setCapturedData(capture);
    setCurrentStep('ocr');
  };

  const handleCameraError = (error: string) => {
    console.error('카메라 오류:', error);
    // 에러 메시지 표시 또는 사용자에게 알림
    alert(`카메라 오류: ${error}`);
  };

  const handleOCRSuccess = (result: Partial<ContributionRecord>) => {
    setOcrResult(result);
    setCurrentStep('edit');
  };

  const handleOCRError = (error: string) => {
    console.error('OCR 오류:', error);
    alert(`OCR 처리 오류: ${error}`);
    setCurrentStep('camera'); // 카메라로 돌아가기
  };

  const handleOCRCancel = () => {
    setCapturedData(undefined);
    setOcrResult(undefined);
    setCurrentStep('camera');
  };

  const handleSave = async (record: Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addRecord(record);
      setCurrentStep('records');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    setCapturedData(undefined);
    setOcrResult(undefined);
    setCurrentStep('camera');
  };

  const handleNewCapture = () => {
    setCapturedData(undefined);
    setOcrResult(undefined);
    setCurrentStep('camera');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">NeimScan</h1>
          <p className="text-sm text-gray-600">축의금 봉투 스캔 앱</p>
        </div>
      </header>

      <div className="flex-1" style={{ height: 'calc(100vh - 80px)' }}>
        {currentStep === 'camera' && (
          <CameraCapture 
            onCapture={handleCameraCapture}
            onError={handleCameraError}
          />
        )}
        
        {currentStep === 'ocr' && capturedData && (
          <OCRProcess
            capture={capturedData}
            onSuccess={handleOCRSuccess}
            onError={handleOCRError}
            onCancel={handleOCRCancel}
          />
        )}
        
        {currentStep === 'edit' && ocrResult && (
          <div className="h-full overflow-auto">
            <ResultEditor 
              initialData={ocrResult}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        {currentStep === 'records' && (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                {/* 성공 아이콘 */}
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-lg font-semibold mb-2 text-gray-900">저장 완료!</h2>
                <p className="text-gray-600 mb-6">축의금 정보가 성공적으로 저장되었습니다.</p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleNewCapture}
                    className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600"
                  >
                    📸 새로운 촬영
                  </button>
                  
                  <button
                    onClick={() => {/* TODO: 기록 목록 보기 기능 */}}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
                  >
                    📋 기록 보기
                  </button>
                  
                  <button
                    onClick={() => {/* TODO: 엑셀 내보내기 기능 */}}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
                  >
                    📊 엑셀로 내보내기
                  </button>
                </div>
              </div>
            </div>
            
            {/* 안내 메시지 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                💡 축의금 정보가 안전하게 저장되었습니다. 언제든지 기록을 확인하고 내보낼 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}