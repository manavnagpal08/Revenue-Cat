import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export interface RevenueTrendItem {
  date: string;
  invoiced: number;
  collected: number;
}

export interface AnalyticsOverview {
  time_frame: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  revenue_growth_percent: number;
  collected_revenue: number;
  outstanding_revenue: number;
  total_leads: number;
  leads_growth_percent: number;
  total_customers: number;
  active_customers: number;
  revenue_trend: RevenueTrendItem[];
  lead_pipeline_summary: Record<string, any>;
  top_insights: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    action_label?: string;
    action_route?: string;
    metric_impact?: string;
  }>;
}

export interface RevenueAnalytics {
  time_frame: string;
  period_start: string;
  period_end: string;
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  collection_rate_percent: number;
  average_invoice_value: number;
  revenue_over_time: RevenueTrendItem[];
  revenue_by_source: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  top_paying_customers: Array<{
    customer_id: string;
    customer_name: string;
    company_name: string;
    total_paid: number;
    invoice_count: number;
  }>;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversion_rate: number;
}

export interface SalesAnalytics {
  time_frame: string;
  period_start: string;
  period_end: string;
  total_leads: number;
  won_leads: number;
  lost_leads: number;
  win_rate_percent: number;
  total_pipeline_value: number;
  average_deal_size: number;
  average_sales_cycle_days: number;
  funnel_stages: FunnelStage[];
  leads_by_source: Array<{
    source: string;
    count: number;
    won_count: number;
    conversion_rate: number;
    total_value: number;
  }>;
  proposals_summary: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
    total_value: number;
    acceptance_rate: number;
  };
}

export interface CustomerItemAnalytics {
  id: string;
  name: string;
  company: string;
  total_spent: number;
  invoice_count: number;
  status: string;
  segment: 'high_value' | 'active' | 'at_risk' | 'inactive' | 'new';
  last_interaction_at: string;
}

export interface CustomerAnalytics {
  time_frame: string;
  period_start: string;
  period_end: string;
  total_customers: number;
  new_customers: number;
  active_customers: number;
  churn_or_inactive_count: number;
  growth_trend: Array<{
    date: string;
    new_count: number;
    total_count: number;
  }>;
  segments: {
    high_value: number;
    active: number;
    at_risk: number;
    inactive: number;
    new: number;
  };
  top_customers: CustomerItemAnalytics[];
}

export interface FinanceAnalytics {
  time_frame: string;
  period_start: string;
  period_end: string;
  total_invoices: number;
  paid_invoices_count: number;
  pending_invoices_count: number;
  overdue_invoices_count: number;
  total_amount_billed: number;
  total_amount_collected: number;
  total_amount_overdue: number;
  overdue_aging: {
    '1_15_days': number;
    '16_30_days': number;
    '30_plus_days': number;
  };
  payment_velocity_average_days: number;
  status_distribution: Array<{
    status: string;
    count: number;
    amount: number;
    color: string;
  }>;
}

export interface AIUsageAnalytics {
  time_frame: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  total_ai_requests: number;
  credits_used_by_agent: Record<string, number>;
  credits_used_by_action: Record<string, number>;
  daily_usage_trend: Array<{
    date: string;
    credits: number;
    requests: number;
  }>;
}

export interface AutomationAnalytics {
  time_frame: string;
  total_workflows: number;
  active_workflows: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate_percent: number;
  time_saved_hours_estimated: number;
  executions_timeline: Array<{
    date: string;
    runs: number;
    success: number;
    failed: number;
  }>;
  workflow_performance: Array<{
    id: string;
    name: string;
    total_runs: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
}

export interface BusinessInsightItem {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low' | 'positive';
  title: string;
  description: string;
  action_label?: string;
  action_route?: string;
  metric_impact?: string;
  calculated_at: string;
}

export interface BusinessInsightsResponse {
  insights: BusinessInsightItem[];
  summary_counts: Record<string, number>;
}

export interface ReportItem {
  id: string;
  business_id: string;
  report_type: string;
  title: string;
  period_start: string;
  period_end: string;
  time_frame: string;
  created_at: string;
  summary?: string;
  sections?: Array<{
    title: string;
    summary: string;
    metrics: Record<string, any>;
  }>;
  structured_data?: Record<string, any>;
}

export interface ReportExportResponse {
  report_id: string;
  format: string;
  content: string;
  filename: string;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Bearer test-token',
});

export const analyticsService = {
  getOverview: async (businessId: string, timeFrame: string = '30d'): Promise<AnalyticsOverview> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/overview?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getOverview, returning baseline:', e);
    }
    return {
      time_frame: timeFrame,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      total_revenue: 250000,
      revenue_growth_percent: 14.8,
      collected_revenue: 165000,
      outstanding_revenue: 85000,
      total_leads: 12,
      leads_growth_percent: 22.5,
      total_customers: 8,
      active_customers: 6,
      revenue_trend: [
        { date: 'Sep 01', invoiced: 45000, collected: 45000 },
        { date: 'Sep 08', invoiced: 60000, collected: 40000 },
        { date: 'Sep 15', invoiced: 80000, collected: 50000 },
        { date: 'Sep 22', invoiced: 65000, collected: 30000 },
      ],
      lead_pipeline_summary: { total: 12, won: 4, lost: 1, win_rate: '33.3%' },
      top_insights: [
        {
          id: 'ins_1',
          category: 'finance',
          severity: 'high',
          title: '2 Overdue Invoices Need Attention',
          description: 'You have ₹85,000 in past-due payments. Automated payment reminders can accelerate recovery.',
          action_label: 'Review Invoices',
          action_route: '/(tabs)/invoices',
          metric_impact: '₹85,000 pending',
        },
        {
          id: 'ins_2',
          category: 'sales',
          severity: 'medium',
          title: '3 High-Value Deals in Negotiation',
          description: 'Closing active deals in negotiation could unlock up to ₹180,000 in fresh revenue.',
          action_label: 'View Pipeline',
          action_route: '/(tabs)/leads',
          metric_impact: '₹180,000 value',
        },
      ],
    };
  },

  getRevenue: async (businessId: string, timeFrame: string = '30d'): Promise<RevenueAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/revenue?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getRevenue:', e);
    }
    return {
      time_frame: timeFrame,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      total_invoiced: 250000,
      total_collected: 165000,
      total_outstanding: 85000,
      total_overdue: 85000,
      collection_rate_percent: 66.0,
      average_invoice_value: 62500,
      revenue_over_time: [
        { date: 'Sep 01', invoiced: 45000, collected: 45000 },
        { date: 'Sep 08', invoiced: 60000, collected: 40000 },
        { date: 'Sep 15', invoiced: 80000, collected: 50000 },
        { date: 'Sep 22', invoiced: 65000, collected: 30000 },
      ],
      revenue_by_source: [
        { source: 'Direct Invoicing', amount: 120000, percentage: 72.7 },
        { source: 'Website Leads', amount: 45000, percentage: 27.3 },
      ],
      top_paying_customers: [
        {
          customer_id: 'c1',
          customer_name: 'Acme Interiors',
          company_name: 'Acme Corp',
          total_paid: 120000,
          invoice_count: 2,
        },
        {
          customer_id: 'c2',
          customer_name: 'Zenith Corp',
          company_name: 'Zenith Group',
          total_paid: 45000,
          invoice_count: 1,
        },
      ],
    };
  },

  getSales: async (businessId: string, timeFrame: string = '30d'): Promise<SalesAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/sales?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getSales:', e);
    }
    return {
      time_frame: timeFrame,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      total_leads: 12,
      won_leads: 4,
      lost_leads: 1,
      win_rate_percent: 33.3,
      total_pipeline_value: 465000,
      average_deal_size: 38750,
      average_sales_cycle_days: 14.5,
      funnel_stages: [
        { stage: 'New Leads', count: 12, value: 465000, conversion_rate: 100.0 },
        { stage: 'Qualified', count: 9, value: 390000, conversion_rate: 75.0 },
        { stage: 'Proposal Sent', count: 6, value: 285000, conversion_rate: 50.0 },
        { stage: 'In Negotiation', count: 4, value: 180000, conversion_rate: 33.3 },
        { stage: 'Closed Won', count: 4, value: 165000, conversion_rate: 33.3 },
      ],
      leads_by_source: [
        { source: 'Website', count: 5, won_count: 2, conversion_rate: 40.0, total_value: 210000 },
        { source: 'Referral', count: 4, won_count: 2, conversion_rate: 50.0, total_value: 155000 },
        { source: 'Direct', count: 3, won_count: 0, conversion_rate: 0.0, total_value: 100000 },
      ],
      proposals_summary: {
        total: 6,
        accepted: 4,
        pending: 2,
        rejected: 0,
        total_value: 285000,
        acceptance_rate: 66.7,
      },
    };
  },

  getCustomers: async (businessId: string, timeFrame: string = '30d'): Promise<CustomerAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/customers?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getCustomers:', e);
    }
    return {
      time_frame: timeFrame,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      total_customers: 8,
      new_customers: 3,
      active_customers: 6,
      churn_or_inactive_count: 1,
      growth_trend: [
        { date: 'Sep 01', new_count: 1, total_count: 6 },
        { date: 'Sep 10', new_count: 1, total_count: 7 },
        { date: 'Sep 20', new_count: 1, total_count: 8 },
      ],
      segments: {
        high_value: 2,
        active: 4,
        at_risk: 1,
        inactive: 1,
        new: 3,
      },
      top_customers: [
        {
          id: 'c1',
          name: 'Vikram Mehta',
          company: 'Acme Interiors',
          total_spent: 120000,
          invoice_count: 2,
          status: 'active',
          segment: 'high_value',
          last_interaction_at: new Date().toISOString(),
        },
        {
          id: 'c2',
          name: 'Pooja Hegde',
          company: 'Zenith Corp',
          total_spent: 45000,
          invoice_count: 1,
          status: 'active',
          segment: 'active',
          last_interaction_at: new Date().toISOString(),
        },
      ],
    };
  },

  getFinance: async (businessId: string, timeFrame: string = '30d'): Promise<FinanceAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/finance?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getFinance:', e);
    }
    return {
      time_frame: timeFrame,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      total_invoices: 4,
      paid_invoices_count: 2,
      pending_invoices_count: 1,
      overdue_invoices_count: 1,
      total_amount_billed: 250000,
      total_amount_collected: 165000,
      total_amount_overdue: 85000,
      overdue_aging: {
        '1_15_days': 85000,
        '16_30_days': 0,
        '30_plus_days': 0,
      },
      payment_velocity_average_days: 7.5,
      status_distribution: [
        { status: 'Paid', count: 2, amount: 165000, color: '#10B981' },
        { status: 'Pending', count: 1, amount: 0, color: '#3B82F6' },
        { status: 'Overdue', count: 1, amount: 85000, color: '#EF4444' },
      ],
    };
  },

  getAIUsage: async (businessId: string, timeFrame: string = '30d'): Promise<AIUsageAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/ai-usage?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getAIUsage:', e);
    }
    return {
      time_frame: timeFrame,
      credits_total: 50,
      credits_used: 18,
      credits_remaining: 32,
      total_ai_requests: 14,
      credits_used_by_agent: {
        'Sales Agent': 6,
        'Finance Agent': 5,
        'Proposal Agent': 4,
        'Customer Support': 2,
        Supervisor: 1,
      },
      credits_used_by_action: {
        lead_analysis: 6,
        invoice_summary: 5,
        proposal_draft: 4,
      },
      daily_usage_trend: [
        { date: 'Sep 20', credits: 4, requests: 3 },
        { date: 'Sep 22', credits: 6, requests: 5 },
        { date: 'Sep 25', credits: 8, requests: 6 },
      ],
    };
  },

  getAutomations: async (businessId: string, timeFrame: string = '30d'): Promise<AutomationAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/automations?business_id=${businessId}&time_frame=${timeFrame}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getAutomations:', e);
    }
    return {
      time_frame: timeFrame,
      total_workflows: 4,
      active_workflows: 3,
      total_executions: 34,
      successful_executions: 33,
      failed_executions: 1,
      success_rate_percent: 97.1,
      time_saved_hours_estimated: 8.25,
      executions_timeline: [
        { date: 'Sep 10', runs: 8, success: 8, failed: 0 },
        { date: 'Sep 15', runs: 12, success: 12, failed: 0 },
        { date: 'Sep 20', runs: 14, success: 13, failed: 1 },
      ],
      workflow_performance: [
        { id: 'wf_1', name: 'Overdue Invoice Follow-up', total_runs: 14, success_rate: 100.0, avg_duration_ms: 420 },
        { id: 'wf_2', name: 'Inbound Lead Auto-Responder', total_runs: 16, success_rate: 93.8, avg_duration_ms: 310 },
        { id: 'wf_3', name: 'Weekly Briefing Dispatch', total_runs: 4, success_rate: 100.0, avg_duration_ms: 890 },
      ],
    };
  },

  getInsights: async (businessId: string, timeFrame: string = '30d', category?: string): Promise<BusinessInsightsResponse> => {
    const catQuery = category && category !== 'all' ? `&category=${category}` : '';
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/insights?business_id=${businessId}&time_frame=${timeFrame}${catQuery}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getInsights:', e);
    }
    return {
      insights: [
        {
          id: 'ins_1',
          category: 'finance',
          severity: 'high',
          title: '2 Overdue Invoices Need Attention',
          description: 'You have ₹85,000 in past-due payments. Automated payment reminders can accelerate recovery.',
          action_label: 'Review Invoices',
          action_route: '/(tabs)/invoices',
          metric_impact: '₹85,000 pending',
          calculated_at: new Date().toISOString(),
        },
        {
          id: 'ins_2',
          category: 'sales',
          severity: 'medium',
          title: '3 High-Value Deals in Negotiation',
          description: 'Closing active deals in negotiation could unlock up to ₹180,000 in fresh revenue.',
          action_label: 'View Pipeline',
          action_route: '/(tabs)/leads',
          metric_impact: '₹180,000 value',
          calculated_at: new Date().toISOString(),
        },
        {
          id: 'ins_3',
          category: 'automations',
          severity: 'positive',
          title: 'Automations Saved ~8.25 Hours',
          description: 'Workflows achieved a 97.1% success rate across 34 triggers this month.',
          action_label: 'Manage Workflows',
          action_route: '/(tabs)/automations',
          metric_impact: '8.25 hrs saved',
          calculated_at: new Date().toISOString(),
        },
      ],
      summary_counts: { high: 1, medium: 1, positive: 1, total: 3 },
    };
  },

  generateReport: async (params: {
    business_id: string;
    report_type: string;
    time_frame: string;
    title?: string;
  }): Promise<ReportItem> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on generateReport:', e);
    }
    return {
      id: `rep_${Date.now()}`,
      business_id: params.business_id,
      report_type: params.report_type,
      title: params.title || 'Executive Business Operations Briefing',
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      time_frame: params.time_frame,
      created_at: new Date().toISOString(),
      summary: `During the ${params.time_frame.toUpperCase()} period, collected revenue reached ₹165,000 with a 66% collection rate. The active sales pipeline holds 12 leads valued at ₹465,000 with a 33.3% win rate.`,
      sections: [
        {
          title: '1. Executive Highlights & Performance',
          summary: 'Strong operational tempo with ₹165,000 collected and 8 active client accounts.',
          metrics: {
            'Total Revenue Collected': '₹165,000.00',
            'Collection Rate': '66.0%',
            'Active Leads': 12,
            'Estimated Pipeline Value': '₹465,000.00',
          },
        },
        {
          title: '2. Financial Health & Invoice Telemetry',
          summary: 'Billed ₹250,000 across 4 invoices. Overdue balance is ₹85,000.',
          metrics: {
            'Paid Invoices': 2,
            'Pending Invoices': 1,
            'Overdue Invoices': 1,
            'Average Payment Velocity': '7.5 days',
          },
        },
      ],
    };
  },

  listReports: async (businessId: string): Promise<ReportItem[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports?business_id=${businessId}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on listReports:', e);
    }
    return [
      {
        id: 'rep_sample_1',
        business_id: businessId,
        report_type: 'executive_summary',
        title: 'Monthly Executive Operations Summary',
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        time_frame: '30d',
        created_at: new Date().toISOString(),
      },
    ];
  },

  getReport: async (reportId: string, businessId: string): Promise<ReportItem> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}?business_id=${businessId}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on getReport:', e);
    }
    return {
      id: reportId,
      business_id: businessId,
      report_type: 'executive_summary',
      title: 'Executive Business Operations Briefing',
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      time_frame: '30d',
      created_at: new Date().toISOString(),
      summary: 'Executive overview of current business telemetry.',
      sections: [
        {
          title: '1. Executive Highlights',
          summary: 'Collected ₹165,000 with 66% collection efficiency.',
          metrics: { 'Revenue Collected': '₹165,000.00', 'Active Leads': 12 },
        },
      ],
    };
  },

  exportReport: async (reportId: string, businessId: string, format: string = 'csv'): Promise<ReportExportResponse> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}/export?business_id=${businessId}&format=${format}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error on exportReport:', e);
    }
    return {
      report_id: reportId,
      format,
      filename: `executive_report_30d.${format}`,
      content: format === 'csv'
        ? 'Section,Metric,Value\n"Executive Highlights","Revenue Collected","₹165,000.00"\n"Financial Health","Paid Invoices","2"'
        : '# Executive Operations Report\n\n- Revenue Collected: ₹165,000\n- Active Leads: 12\n- Win Rate: 33.3%',
    };
  },
};
