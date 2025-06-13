'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContributionRecord } from '@/types';
import type { Database } from '@/types/database';

type ContributionRow = Database['public']['Tables']['contributions']['Row'];
type ContributionInsert = Database['public']['Tables']['contributions']['Insert'];
type ContributionUpdate = Database['public']['Tables']['contributions']['Update'];

export function useSupabase() {
  const [records, setRecords] = useState<ContributionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터베이스 행을 ContributionRecord로 변환
  const transformRecord = (row: ContributionRow): ContributionRecord => ({
    id: row.id,
    name: row.name,
    amount: row.amount,
    memo: row.memo || undefined,
    date: new Date(row.date),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    imageData: row.image_data || undefined
  });

  // 모든 기록 조회
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRecords = data.map(transformRecord);
      setRecords(transformedRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Fetch records error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 새 기록 추가
  const addRecord = useCallback(async (record: Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const insertData: ContributionInsert = {
        name: record.name,
        amount: record.amount,
        memo: record.memo || null,
        date: record.date.toISOString().split('T')[0],
        image_data: record.imageData || null
      };

      const { data, error } = await supabase
        .from('contributions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newRecord = transformRecord(data);
      setRecords(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기록 저장에 실패했습니다.';
      setError(errorMessage);
      console.error('Add record error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 기록 수정
  const updateRecord = useCallback(async (id: string, updates: Partial<Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: ContributionUpdate = {
        ...(updates.name && { name: updates.name }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.memo !== undefined && { memo: updates.memo || null }),
        ...(updates.date && { date: updates.date.toISOString().split('T')[0] }),
        ...(updates.imageData !== undefined && { image_data: updates.imageData || null }),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('contributions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRecord = transformRecord(data);
      setRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기록 수정에 실패했습니다.';
      setError(errorMessage);
      console.error('Update record error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 기록 삭제
  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(prev => prev.filter(record => record.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기록 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('Delete record error:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색
  const searchRecords = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .or(`name.ilike.%${query}%,memo.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRecords = data.map(transformRecord);
      setRecords(transformedRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '검색에 실패했습니다.';
      setError(errorMessage);
      console.error('Search records error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 날짜 범위로 조회
  const fetchRecordsByDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRecords = data.map(transformRecord);
      setRecords(transformedRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Fetch records by date range error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 실시간 구독 설정
  useEffect(() => {
    const subscription = supabase
      .channel('contributions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'contributions' 
        }, 
        (payload) => {
          console.log('Real-time update:', payload);
          // 변경사항이 있을 때 데이터 다시 로드
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    fetchRecords,
    fetchRecordsByDateRange
  };
}