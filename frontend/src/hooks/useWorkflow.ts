import { useState, useCallback } from 'react';
import { workflowApi } from '../api/workflow.api';
import { stepApi } from '../api/step.api';
import { Workflow, Step } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { toast } from 'sonner';

export const useWorkflow = () => {
  const [loading, setLoading] = useState(false);

  const fetchWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await workflowApi.getWorkflowById(id);
      return response.data.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSteps = useCallback(async (workflowId: string) => {
    setLoading(true);
    try {
      const response = await stepApi.getSteps(workflowId);
      return response.data.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkflow = useCallback(async (id: string, data: Partial<Workflow>) => {
    setLoading(true);
    try {
      const response = await workflowApi.updateWorkflow(id, data);
      toast.success('Workflow updated successfully');
      return response.data.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStep = useCallback(async (workflowId: string, data: Partial<Step>) => {
    setLoading(true);
    try {
      const response = await stepApi.createStep(workflowId, data);
      toast.success('Step created successfully');
      return response.data.data;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchWorkflow,
    fetchSteps,
    updateWorkflow,
    createStep,
  };
};
