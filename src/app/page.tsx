'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ResultEditor from '@/components/ResultEditor';
import { useSupabase } from '@/hooks/useSupabase';
import type { ContributionRecord } from '@/types';

// CameraCapture를 동적 임포트로 변경 (SSR 비활성화)
const CameraCapture = dynamic(() => import('@/components/CameraCapture'), {
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

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'camera' | 'edit' | 'records'>('camera');
  const [capturedData, setCapturedData] = useState<Partial<ContributionRecord> | undefined>(undefined);
  const { addRecord } = useSupabase();

  const handleCameraCapture = (data: Partial<ContributionRecord>) => {
    setCapturedData(data);
    setCurrentStep('edit');
  };

  const handleCameraError = (error: string) => {
    console.error('카메라 오류:', error);
  };

  const handleSave = async (record: any) => {
    try {
      await addRecord(record);
      setCurrentStep('records');
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  const handleCancel = () => {
    setCapturedData(undefined); // null 대신 undefined
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
        
        {currentStep === 'edit' && (
          <div className="h-full overflow-auto">
            <ResultEditor 
              initialData={capturedData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        {currentStep === 'records' && (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">저장 완료</h2>
              <p className="text-gray-600 mb-4">축의금 정보가 성공적으로 저장되었습니다.</p>
              <button
                onClick={() => setCurrentStep('camera')}
                className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600"
              >
                새로운 촬영
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}