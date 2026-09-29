-- ==============================================================================
-- SoloCEO Database Schema
-- Production PostgreSQL schema for Supabase
-- Multi-tenant business operating system with RLS and optimized indexes
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES (Workspaces)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    industry TEXT,
    currency TEXT DEFAULT 'INR', -- e.g. INR (₹), USD ($), EUR (€)
    currency_symbol TEXT DEFAULT '₹',
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS MEMBERS (Team/Role support)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner', -- 'owner', 'admin', 'member'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

-- 4. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    ai_tone TEXT DEFAULT 'professional', -- 'professional', 'casual', 'direct'
    default_invoice_due_days INT DEFAULT 14,
    default_tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
    notes TEXT,
    total_revenue NUMERIC(12, 2) DEFAULT 0.00,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS (Sales Pipeline)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    company TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    value NUMERIC(12, 2) DEFAULT 0.00,
    source TEXT DEFAULT 'direct', -- 'direct', 'website', 'referral', 'email', 'social'
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'converted'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    probability INT DEFAULT 20, -- percentage 0-100
    expected_close_date DATE,
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LEAD ACTIVITIES / INTERACTIONS
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'note', 'email', 'call', 'meeting', 'proposal_sent', 'ai_brief'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'bank_transfer', -- 'bank_transfer', 'upi', 'card', 'cash', 'other'
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PROPOSALS
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    project_overview TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    timeline TEXT,
    total_value NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    valid_until DATE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PROPOSAL ITEMS
CREATE TABLE IF NOT EXISTS public.proposal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cost NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Business Session',
    agent_type TEXT DEFAULT 'supervisor', -- 'supervisor', 'sales', 'finance', 'proposal', 'support'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    agent TEXT DEFAULT 'supervisor',
    content TEXT NOT NULL,
    structured_data JSONB, -- For cards, action recommendations, lists, metrics
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AI USAGE & CREDIT TRACKING
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'business_brief', 'lead_analysis', 'proposal_generation', 'finance_query', 'supervisor_chat'
    tokens_used INT DEFAULT 0,
    credits_consumed INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SUBSCRIPTIONS (RevenueCat synced)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'starter', 'business', 'pro'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'canceled', 'past_due'
    revenuecat_customer_id TEXT,
    active_entitlements JSONB DEFAULT '[]'::jsonb,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'lead_alert', 'invoice_overdue', 'proposal_update', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON public.invoices(business_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_proposals_business ON public.proposals(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_business_status ON public.tasks(business_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_business ON public.ai_usage(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a member of business
CREATE OR REPLACE FUNCTION public.is_business_member(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = business_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view & edit their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (id = auth.uid());

-- Businesses: Users can access businesses they own or belong to
CREATE POLICY "Members can view their businesses" ON public.businesses
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.business_members WHERE business_id = id AND user_id = auth.uid())
    );

CREATE POLICY "Owners can insert/update business" ON public.businesses
    FOR ALL USING (owner_id = auth.uid());

-- Business Members policies
CREATE POLICY "Users can view memberships" ON public.business_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    );

CREATE POLICY "Owners can insert/manage memberships" ON public.business_members
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    );

-- Business Settings policies
CREATE POLICY "Members can view/edit settings" ON public.business_settings
    FOR ALL USING (
        public.is_business_member(business_id) OR
        EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    );

-- Universal multi-tenant policies for business resources
CREATE POLICY "Business data access" ON public.customers
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business leads access" ON public.leads
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business activities access" ON public.lead_activities
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business invoices access" ON public.invoices
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business invoice items access" ON public.invoice_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_items.invoice_id AND public.is_business_member(business_id))
    );

CREATE POLICY "Business payments access" ON public.payments
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business proposals access" ON public.proposals
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business proposal items access" ON public.proposal_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_items.proposal_id AND public.is_business_member(business_id))
    );

CREATE POLICY "Business tasks access" ON public.tasks
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business ai conversations access" ON public.ai_conversations
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business ai messages access" ON public.ai_messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = ai_messages.conversation_id AND public.is_business_member(business_id))
    );

CREATE POLICY "Business ai usage access" ON public.ai_usage
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business subscriptions access" ON public.subscriptions
    FOR ALL USING (public.is_business_member(business_id));

CREATE POLICY "Business notifications access" ON public.notifications
    FOR ALL USING (user_id = auth.uid());
