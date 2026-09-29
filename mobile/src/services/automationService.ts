import { Platform } from 'react-native';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://revenue-cat.onrender.com';

export interface Automation {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  condition_config: Record<string, any>;
  agent_type: string;
  action_config: Record<string, any>;
  status: string; // 'active' | 'paused' | 'draft' | 'error'
  enabled: boolean;
  requires_approval: boolean;
  created_at?: string;
  updated_at?: string;
  last_run_at?: string;
  next_run_at?: string;
  runs_count?: number;
  success_count?: number;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  business_id: string;
  status: string; // 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled' | 'skipped'
  trigger_data: Record<string, any>;
  execution_result: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  actions: AutomationAction[];
}

export interface AutomationAction {
  id: string;
  automation_run_id: string;
  business_id: string;
  action_type: string;
  agent_type: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  status: string; // 'pending' | 'waiting_approval' | 'approved' | 'rejected' | 'executed' | 'failed'
  requires_confirmation: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  executed_at?: string;
}

export interface AutomationTemplate {
  id: string;
  business_id?: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  configuration: Record<string, any>;
  is_system_template: boolean;
}

export interface AutomationStepPreview {
  step_number: number;
  title: string;
  description: string;
  type: string;
  agent_badge?: string;
  requires_approval?: boolean;
}

export interface AutomationAIBuilderResponse {
  success: boolean;
  summary: string;
  suggested_workflow: Automation;
  steps: AutomationStepPreview[];
  warnings: string[];
}

export interface AutomationLimits {
  business_id: string;
  plan_tier: string;
  active_automations_count: number;
  limit: number;
  can_create: boolean;
  upgrade_required: boolean;
}

export interface AutomationLog {
  id: string;
  business_id: string;
  workflow_id?: string;
  run_id?: string;
  event_type: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AutomationAnalytics {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  skipped_runs: number;
  waiting_approval_runs: number;
  success_rate_percent: number;
  active_automations_count: number;
  paused_automations_count: number;
  runs_timeline: Array<{ date: string; successful: number; failed: number }>;
  top_automations: Array<{ id: string; name: string; runs_count: number; status: string }>;
}

export interface NotificationItem {
  id: string;
  business_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  action_data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

class AutomationService {
  private getHeaders(token: string = 'test-token') {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAutomations(businessId: string): Promise<Automation[]> {
    const res = await fetch(`${API_BASE_URL}/api/automations?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch automations: ${res.status}`);
    return await res.json();
  }

  async getAutomation(id: string, businessId: string): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Automation not found');
    return await res.json();
  }

  async createAutomation(payload: Partial<Automation> & { business_id: string; name: string; trigger_type: string }): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create automation' }));
      throw new Error(err.detail || 'Failed to create automation');
    }
    return await res.json();
  }

  async buildWithAI(prompt: string, businessId: string): Promise<AutomationAIBuilderResponse> {
    const res = await fetch(`${API_BASE_URL}/api/automations/ai-builder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ prompt, business_id: businessId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'AI Builder failed' }));
      throw new Error(err.detail || 'AI Builder failed');
    }
    return await res.json();
  }

  async getLimits(businessId: string): Promise<AutomationLimits> {
    const res = await fetch(`${API_BASE_URL}/api/automations/limits?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch automation limits');
    return await res.json();
  }

  async updateAutomation(id: string, businessId: string, payload: Partial<Automation>): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}?business_id=${businessId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update automation');
    return await res.json();
  }

  async deleteAutomation(id: string, businessId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}?business_id=${businessId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete automation');
    return await res.json();
  }

  async activateAutomation(id: string, businessId: string): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/activate?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to activate automation' }));
      throw new Error(err.detail || 'Failed to activate automation');
    }
    return await res.json();
  }

  async pauseAutomation(id: string, businessId: string): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/pause?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to pause automation');
    return await res.json();
  }

  async runAutomationNow(id: string, businessId: string): Promise<AutomationRun> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/run?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run automation');
    return await res.json();
  }

  async getAutomationRuns(id: string, businessId: string): Promise<AutomationRun[]> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/runs?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch runs');
    return await res.json();
  }

  async getAllRuns(businessId: string, status?: string): Promise<AutomationRun[]> {
    const url = status && status !== 'all'
      ? `${API_BASE_URL}/api/automations/runs?business_id=${businessId}&status=${status.toLowerCase()}`
      : `${API_BASE_URL}/api/automations/runs?business_id=${businessId}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch all runs');
    return await res.json();
  }

  async getRunDetail(runId: string, businessId: string): Promise<AutomationRun> {
    const res = await fetch(`${API_BASE_URL}/api/automation-runs/${runId}?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch run detail');
    return await res.json();
  }

  async getLogs(automationId: string, businessId: string, runId?: string): Promise<AutomationLog[]> {
    const url = runId
      ? `${API_BASE_URL}/api/automations/${automationId}/logs?business_id=${businessId}&run_id=${runId}`
      : `${API_BASE_URL}/api/automations/${automationId}/logs?business_id=${businessId}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return await res.json();
  }

  async getPendingApprovals(businessId: string): Promise<AutomationAction[]> {
    const res = await fetch(`${API_BASE_URL}/api/automation-actions/pending?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pending actions');
    return await res.json();
  }

  async approveAction(actionId: string, businessId: string, note?: string): Promise<{ success: boolean; status: string }> {
    const res = await fetch(`${API_BASE_URL}/api/automation-actions/${actionId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ business_id: businessId, confirmed: true, note }),
    });
    if (!res.ok) throw new Error('Failed to approve action');
    return await res.json();
  }

  async rejectAction(actionId: string, businessId: string, note?: string): Promise<{ success: boolean; status: string }> {
    const res = await fetch(`${API_BASE_URL}/api/automation-actions/${actionId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ business_id: businessId, confirmed: false, note }),
    });
    if (!res.ok) throw new Error('Failed to reject action');
    return await res.json();
  }

  async getTemplates(category?: string): Promise<AutomationTemplate[]> {
    const url = category && category !== 'All' 
      ? `${API_BASE_URL}/api/automations/templates?category=${category.toLowerCase()}` 
      : `${API_BASE_URL}/api/automations/templates`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch templates');
    return await res.json();
  }

  async getTriggers(): Promise<Array<{ type: string; title: string; description: string; category: string; icon: string }>> {
    const res = await fetch(`${API_BASE_URL}/api/automations/triggers`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch triggers');
    return await res.json();
  }

  async getAnalytics(businessId: string): Promise<AutomationAnalytics> {
    const res = await fetch(`${API_BASE_URL}/api/automations/analytics?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return await res.json();
  }

  async getNotifications(businessId: string): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async markNotificationRead(id: string, businessId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/notifications/${id}/read?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }
}

export const automationService = new AutomationService();
