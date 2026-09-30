export type SubscriptionTier = 'free' | 'starter' | 'business' | 'pro';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug?: string;
  industry?: string;
  currency: string;
  currency_symbol: string;
  phone?: string;
  website?: string;
  address?: string;
  tax_number?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
  total_revenue: number;
  last_interaction_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  business_id: string;
  customer_id?: string;
  customer?: Customer;
  title: string;
  company?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  value: number;
  source: string;
  status: LeadStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  probability: number;
  notes?: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  expected_close_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Payment {
  id: string;
  business_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string;
  customer?: Customer;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at?: string;
}

export interface Proposal {
  id: string;
  business_id: string;
  customer_id?: string;
  customer?: Customer;
  lead_id?: string;
  title: string;
  project_overview?: string;
  deliverables?: Array<{ title: string; cost: number }>;
  timeline?: string;
  total_value: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  pdf_url?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  business_id: string;
  customer_id?: string;
  lead_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at?: string;
}

export interface BusinessKPIs {
  revenueThisMonth: number;
  revenueGrowthPercent: number;
  outstandingAmount: number;
  overdueAmount: number;
  activeLeadsCount: number;
  pendingProposalsCount: number;
  overdueInvoicesCount: number;
}

export interface AIAgentActionCard {
  type: string;
  title: string;
  description: string;
  primary_action_label?: string;
  action_payload?: Record<string, any>;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  agent?: string;
  content: string;
  structured_data?: Record<string, any>;
  action_cards?: AIAgentActionCard[];
  requires_confirmation?: boolean;
  pending_action?: {
    action_type: string;
    payload: Record<string, any>;
  };
  created_at: string;
}

export interface AICommandResult {
  conversation_id: string;
  agent: string;
  intent?: string;
  message: string;
  structured_data?: Record<string, any>;
  action_cards?: AIAgentActionCard[];
  requires_confirmation?: boolean;
  pending_action?: {
    action_type: string;
    payload: Record<string, any>;
  };
  credits_remaining?: number;
}

export interface AIBusinessBrief {
  top_opportunity?: any;
  inactive_leads_count: number;
  inactive_leads_value: number;
  overdue_invoices_count: number;
  overdue_amount: number;
  revenue_collected: number;
  pending_proposals_count: number;
  pending_proposals_value: number;
  generated_at_summary?: string;
}
