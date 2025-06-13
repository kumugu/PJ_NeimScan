'use client';

import { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import ResultEditor from '@/components/ResultEditor';
import { useSupabase } from '@/hooks/useSupabase';
import type { ContributionRecord } from '@/types'; // 타입이 정의된 곳에서 import 필요

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'camera' | 'edit' | 'records'>('camera');
  const [capturedData, setCapturedData] = useState<Partial<ContributionRecord> | undefined>(undefined);
  const { addRecord } = useSupabase();

  return (
    <main className="min-h-screen bg-gray-50">
      {currentStep === 'camera' && (
        <CameraCapture 
          onCapture={(data: Partial<ContributionRecord>) => {
            setCapturedData(data);
            setCurrentStep('edit');
          }}
          onError={(error) => console.error(error)}
        />
      )}
      
      {currentStep === 'edit' && capturedData && (
        <ResultEditor 
          initialData={capturedData}
          onSave={async (record) => {
            await addRecord(record);
            setCurrentStep('records');
          }}
          onCancel={() => setCurrentStep('camera')}
        />
      )}
    </main>
  );
}
