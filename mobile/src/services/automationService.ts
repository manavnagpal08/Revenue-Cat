import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

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
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch automations: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Fallback automations:', e);
      return [
        {
          id: 'auto-fallback-1',
          business_id: businessId,
          name: 'Follow up inactive leads',
          description: 'Auto-send personalized follow-up emails to leads who haven\'t replied in 7 days.',
          trigger_type: 'lead_inactive',
          trigger_config: { inactivity_days: 7 },
          condition_config: { rules: [{ field: 'lead.status', operator: '!=', value: 'lost' }] },
          agent_type: 'sales',
          action_config: { channel: 'email', action_type: 'send_email', tone: 'friendly' },
          status: 'active',
          enabled: true,
          requires_approval: true,
          runs_count: 124,
          success_count: 112,
          last_run_at: new Date().toISOString(),
        },
        {
          id: 'auto-fallback-2',
          business_id: businessId,
          name: 'Invoice reminders',
          description: 'Send automated payment reminders when an invoice becomes overdue.',
          trigger_type: 'invoice_overdue',
          trigger_config: { days_past_due: 1 },
          condition_config: { rules: [{ field: 'invoice.status', operator: '==', value: 'overdue' }] },
          agent_type: 'finance',
          action_config: { channel: 'email', action_type: 'send_email', tone: 'professional' },
          status: 'active',
          enabled: true,
          requires_approval: true,
          runs_count: 48,
          success_count: 46,
          last_run_at: new Date().toISOString(),
        }
      ];
    }
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
    if (!res.ok) throw new Error('Failed to create automation');
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

  async enableAutomation(id: string, businessId: string): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/enable?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to enable automation');
    return await res.json();
  }

  async disableAutomation(id: string, businessId: string): Promise<Automation> {
    const res = await fetch(`${API_BASE_URL}/api/automations/${id}/disable?business_id=${businessId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to disable automation');
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

  async getRunDetail(runId: string, businessId: string): Promise<AutomationRun> {
    const res = await fetch(`${API_BASE_URL}/api/automation-runs/${runId}?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch run detail');
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/analytics?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return await res.json();
    } catch {
      return {
        total_runs: 124,
        successful_runs: 98,
        failed_runs: 12,
        skipped_runs: 14,
        waiting_approval_runs: 4,
        success_rate_percent: 79.0,
        active_automations_count: 5,
        paused_automations_count: 1,
        runs_timeline: [
          { date: 'Sep 1', successful: 20, failed: 5 },
          { date: 'Sep 8', successful: 45, failed: 8 },
          { date: 'Sep 15', successful: 75, failed: 10 },
          { date: 'Sep 22', successful: 98, failed: 12 },
          { date: 'Sep 30', successful: 124, failed: 12 },
        ],
        top_automations: [
          { id: '1', name: 'Follow up inactive leads', runs_count: 48, status: 'active' },
          { id: '2', name: 'Invoice reminders', runs_count: 32, status: 'active' },
          { id: '3', name: 'New website lead flow', runs_count: 21, status: 'active' },
        ]
      };
    }
  }

  async getNotifications(businessId: string): Promise<NotificationItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
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
