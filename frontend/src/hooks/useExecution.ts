import { useState, useCallback, useEffect, useRef } from 'react';
import { executionApi } from '../api/execution.api';
import { Execution } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { toast } from 'sonner';

export const useExecution = (executionId?: string) => {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchExecution = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await executionApi.getExecution(id);
      const data = response.data.data;
      setExecution(data);
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback((id: string, interval = 3000) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await executionApi.getExecution(id);
        const data = response.data.data;
        setExecution(data);
        
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.status)) {
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (executionId) {
      fetchExecution(executionId);
    }
    return () => stopPolling();
  }, [executionId, fetchExecution, stopPolling]);

  return {
    execution,
    loading,
    fetchExecution,
    startPolling,
    stopPolling,
  };
};
