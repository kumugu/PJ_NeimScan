import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { ContributionRecord } from '../types/index';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useSupabase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRecord = useCallback(async (record: Omit<ContributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contribution_records')
        .insert([
          {
            name: record.name,
            amount: record.amount,
            memo: record.memo,
            date: record.date.toISOString(),
            image_data: record.imageData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      return data[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터 저장 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contribution_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(record => ({
        id: record.id,
        name: record.name,
        amount: record.amount,
        memo: record.memo,
        date: new Date(record.date),
        imageData: record.image_data,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRecord = useCallback(async (id: string, updates: Partial<ContributionRecord>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contribution_records')
        .update({
          name: updates.name,
          amount: updates.amount,
          memo: updates.memo,
          date: updates.date?.toISOString(),
          image_data: updates.imageData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return data[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('contribution_records')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addRecord,
    getRecords,
    updateRecord,
    deleteRecord,
    isLoading,
    error
  };
};