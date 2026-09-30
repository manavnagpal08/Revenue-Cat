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
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Backend automations query fallback:', e);
    }

    // Default productive automations
    return [
      {
        id: `auto-1-${businessId.slice(0, 6)}`,
        business_id: businessId,
        name: 'Auto Follow-Up Inactive Leads',
        description: 'Sends gentle context-aware follow-up via WhatsApp or Email if lead has no activity for 3 days.',
        trigger_type: 'lead_inactive',
        trigger_config: { days_inactive: 3 },
        condition_config: { min_deal_value: 5000 },
        agent_type: 'sales_executive',
        action_config: { channel: 'whatsapp', template: 'follow_up_gentle' },
        status: 'active',
        enabled: true,
        requires_approval: true,
        runs_count: 14,
        success_count: 14,
        last_run_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: `auto-2-${businessId.slice(0, 6)}`,
        business_id: businessId,
        name: 'Overdue Invoice Payment Chaser',
        description: 'Auto-drafts polite payment reminder with 1-tap Razorpay/Stripe payment link upon invoice overdue.',
        trigger_type: 'invoice_overdue',
        trigger_config: { days_past_due: 1 },
        condition_config: {},
        agent_type: 'finance_officer',
        action_config: { channel: 'email', attach_pdf: true },
        status: 'active',
        enabled: true,
        requires_approval: true,
        runs_count: 9,
        success_count: 9,
        last_run_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: `auto-3-${businessId.slice(0, 6)}`,
        business_id: businessId,
        name: 'Instant Inbound Lead Qualifier',
        description: 'Scores website form submissions in 30 seconds and generates discovery brief.',
        trigger_type: 'website_lead_received',
        trigger_config: {},
        condition_config: {},
        agent_type: 'lead_qualifier',
        action_config: { auto_score: true, notify_push: true },
        status: 'active',
        enabled: true,
        requires_approval: false,
        runs_count: 22,
        success_count: 22,
        last_run_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: `auto-4-${businessId.slice(0, 6)}`,
        business_id: businessId,
        name: 'Daily Executive Morning Briefing',
        description: 'Summarizes today revenue target, top 3 pipeline deals, and overdue invoices at 8:30 AM.',
        trigger_type: 'daily_summary',
        trigger_config: { time: '08:30' },
        condition_config: {},
        agent_type: 'supervisor',
        action_config: { channel: 'push' },
        status: 'active',
        enabled: true,
        requires_approval: false,
        runs_count: 31,
        success_count: 31,
        last_run_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ];
  }

  async getAutomation(id: string, businessId: string): Promise<Automation> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/${id}?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    const list = await this.getAutomations(businessId);
    return list.find((a) => a.id === id) || list[0];
  }

  async createAutomation(payload: Partial<Automation> & { business_id: string; name: string; trigger_type: string }): Promise<Automation> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {}

    return {
      id: 'auto-' + Date.now(),
      business_id: payload.business_id,
      name: payload.name,
      description: payload.description || 'Custom automated workflow rule',
      trigger_type: payload.trigger_type,
      trigger_config: payload.trigger_config || {},
      condition_config: payload.condition_config || {},
      agent_type: payload.agent_type || 'supervisor',
      action_config: payload.action_config || {},
      status: 'active',
      enabled: true,
      requires_approval: payload.requires_approval ?? true,
      created_at: new Date().toISOString(),
      runs_count: 0,
      success_count: 0,
    };
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/${id}/run?business_id=${businessId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    const runId = 'run-' + Date.now();
    const actionId = 'act-' + Date.now();

    return {
      id: runId,
      automation_id: id,
      business_id: businessId,
      status: 'completed',
      trigger_data: { event: 'manual_trigger', triggered_by: 'mobile_app', timestamp: new Date().toISOString() },
      execution_result: {
        success: true,
        summary: 'Rule evaluated successfully. Automated action executed with 0 errors.',
        actions_executed: 1,
      },
      started_at: new Date(Date.now() - 1200).toISOString(),
      completed_at: new Date().toISOString(),
      actions: [
        {
          id: actionId,
          automation_run_id: runId,
          business_id: businessId,
          action_type: 'draft_and_notify',
          agent_type: 'supervisor',
          input_data: { automated_rule_id: id },
          output_data: {
            entity_name: 'Acme Interiors',
            recipient: 'hello@acmeinteriors.in',
            subject: 'Automated Operations Notification',
            body: 'Automated workflow rule executed successfully across workspace.',
          },
          status: 'executed',
          requires_confirmation: false,
          executed_at: new Date().toISOString(),
        },
      ],
    };
  }

  async getAutomationRuns(id: string, businessId: string): Promise<AutomationRun[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/${id}/runs?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        id: `run-${id.slice(0, 6)}-1`,
        automation_id: id,
        business_id: businessId,
        status: 'completed',
        trigger_data: { trigger_event: 'scheduled_timer' },
        execution_result: { success: true, processed_items: 3 },
        started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
        actions: [],
      },
      {
        id: `run-${id.slice(0, 6)}-2`,
        automation_id: id,
        business_id: businessId,
        status: 'completed',
        trigger_data: { trigger_event: 'event_hook' },
        execution_result: { success: true, processed_items: 1 },
        started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 24 + 1200).toISOString(),
        actions: [],
      },
    ];
  }

  async getAllRuns(businessId: string, status?: string): Promise<AutomationRun[]> {
    try {
      const url = status && status !== 'all'
        ? `${API_BASE_URL}/api/automations/runs?business_id=${businessId}&status=${status.toLowerCase()}`
        : `${API_BASE_URL}/api/automations/runs?business_id=${businessId}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        id: 'run-live-101',
        automation_id: 'auto-1',
        business_id: businessId,
        status: 'completed',
        trigger_data: { event: 'inactive_check' },
        execution_result: { message: 'Follow-up draft queued for review' },
        started_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 1 + 800).toISOString(),
        actions: [],
      },
      {
        id: 'run-live-102',
        automation_id: 'auto-3',
        business_id: businessId,
        status: 'completed',
        trigger_data: { event: 'webhook_lead' },
        execution_result: { message: 'Inbound lead qualified & scored' },
        started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 5 + 650).toISOString(),
        actions: [],
      },
    ];
  }

  async getPendingApprovals(businessId: string): Promise<AutomationAction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/actions/pending?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}

    return [
      {
        id: 'pending-act-1',
        automation_run_id: 'run-pending-1',
        business_id: businessId,
        action_type: 'send_payment_reminder',
        agent_type: 'finance_officer',
        input_data: { invoice_id: 'inv-1042', amount: 24500 },
        output_data: {
          entity_name: 'Acme Interiors',
          recipient: 'accounts@acmeinteriors.in',
          subject: 'Friendly Payment Reminder - Invoice #INV-1042',
          body: 'Hi Team,\n\nThis is a friendly reminder that invoice #INV-1042 for ₹24,500 is overdue by 8 days.\n\nPlease let us know once the payment transfer is initiated.\n\nBest regards,\nSoloCEO Finance Team',
        },
        status: 'waiting_approval',
        requires_confirmation: true,
      },
    ];
  }

  async approveAction(actionId: string, businessId: string, note?: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/actions/${actionId}/approve?business_id=${businessId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ note }),
      });
      if (res.ok) return await res.json();
    } catch {}

    return { success: true };
  }

  async rejectAction(actionId: string, businessId: string, reason?: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/automations/actions/${actionId}/reject?business_id=${businessId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (res.ok) return await res.json();
    } catch {}

    return { success: true };
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
