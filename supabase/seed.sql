-- ==============================================================================
-- SoloCEO Seed Data (Realistic Demo Business Data)
-- Exactly matching the Master Specification demo figures & use-cases
-- ==============================================================================

DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_biz_id UUID := '00000000-0000-0000-0000-000000000002';
    cust_acme_id UUID := uuid_generate_v4();
    cust_xyz_id UUID := uuid_generate_v4();
    cust_rahul_id UUID := uuid_generate_v4();
    cust_zenith_id UUID := uuid_generate_v4();
    inv_acme_id UUID := uuid_generate_v4();
    inv_xyz_id UUID := uuid_generate_v4();
    inv_rahul_id UUID := uuid_generate_v4();
    inv_zenith_id UUID := uuid_generate_v4();
    prop_acme_id UUID := uuid_generate_v4();
BEGIN
    -- 1. Create Demo Profile if not exists
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (demo_user_id, 'alex.founder@soloceo.app', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 2. Create Demo Business
    INSERT INTO public.businesses (id, owner_id, name, slug, industry, currency, currency_symbol, phone, website)
    VALUES (demo_biz_id, demo_user_id, 'Rivera Design & Tech Studio', 'rivera-studio', 'Design & Technology Consulting', 'INR', '₹', '+91 98765 43210', 'https://riverastudio.io')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- 3. Business Member
    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (demo_biz_id, demo_user_id, 'owner')
    ON CONFLICT (business_id, user_id) DO NOTHING;

    -- 4. Business Settings
    INSERT INTO public.business_settings (business_id, ai_tone, default_invoice_due_days, default_tax_rate)
    VALUES (demo_biz_id, 'professional', 14, 18.00)
    ON CONFLICT (business_id) DO NOTHING;

    -- 5. Customers
    INSERT INTO public.customers (id, business_id, name, company_name, email, phone, status, total_revenue, last_interaction_at)
    VALUES 
    (cust_acme_id, demo_biz_id, 'Vikram Mehta', 'Acme Interiors', 'vikram@acmeinteriors.com', '+91 98201 11223', 'active', 120000.00, NOW() - INTERVAL '6 days'),
    (cust_xyz_id, demo_biz_id, 'Priya Sharma', 'XYZ Studio', 'priya@xyzstudio.in', '+91 98302 22334', 'active', 85000.00, NOW() - INTERVAL '3 days'),
    (cust_rahul_id, demo_biz_id, 'Rahul Verma', 'Rahul Designs', 'rahul@rahuldesigns.com', '+91 98403 33445', 'active', 45000.00, NOW() - INTERVAL '8 days'),
    (cust_zenith_id, demo_biz_id, 'Siddharth Rao', 'Zenith Logistics', 'siddharth@zenithlog.com', '+91 98504 44556', 'active', 210000.00, NOW() - INTERVAL '1 day');

    -- 6. Leads (Pipeline matches prompt: Acme ₹85K Proposal, XYZ ₹42K Contacted, Rahul ₹25K New)
    INSERT INTO public.leads (business_id, customer_id, title, value, source, status, probability, notes, last_contacted_at, next_followup_at)
    VALUES
    (demo_biz_id, cust_acme_id, 'Brand Redesign & Mobile App Suite', 85000.00, 'referral', 'proposal', 80, 'Sent proposal 6 days ago. Awaiting sign-off. Highest priority!', NOW() - INTERVAL '6 days', NOW()),
    (demo_biz_id, cust_xyz_id, 'E-Commerce Store & Operations Portal', 42000.00, 'website', 'contacted', 50, 'Discussed scope on Zoom. Needs follow-up call on timeline.', NOW() - INTERVAL '3 days', NOW() + INTERVAL '1 day'),
    (demo_biz_id, cust_rahul_id, 'Marketing Strategy & Social Retainer', 25000.00, 'direct', 'new', 25, 'Inquired via WhatsApp for quarterly retainer.', NOW() - INTERVAL '8 days', NOW());

    -- 7. Invoices (Revenue ₹184,500 this month, Overdue ₹31,200: Acme ₹18k, XYZ ₹8.5k, Rahul ₹4.7k)
    INSERT INTO public.invoices (id, business_id, customer_id, invoice_number, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, paid_amount, status)
    VALUES
    (inv_acme_id, demo_biz_id, cust_acme_id, 'INV-2026-001', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '10 days', 15254.24, 18.00, 2745.76, 18000.00, 0.00, 'overdue'),
    (inv_xyz_id, demo_biz_id, cust_xyz_id, 'INV-2026-002', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '5 days', 7203.39, 18.00, 1296.61, 8500.00, 0.00, 'overdue'),
    (inv_rahul_id, demo_biz_id, cust_rahul_id, 'INV-2026-003', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '3 days', 3983.05, 18.00, 716.95, 4700.00, 0.00, 'overdue'),
    (inv_zenith_id, demo_biz_id, cust_zenith_id, 'INV-2026-004', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 156355.93, 18.00, 28144.07, 184500.00, 184500.00, 'paid');

    -- Invoice Items
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price)
    VALUES
    (inv_acme_id, 'Phase 1 UI/UX Architecture & Prototyping', 1, 15254.24, 15254.24),
    (inv_xyz_id, 'Shopify Store Configuration & Custom Theme', 1, 7203.39, 7203.39),
    (inv_rahul_id, 'Quarterly Graphic & Social Media Kit', 1, 3983.05, 3983.05),
    (inv_zenith_id, 'Enterprise Logistics Mobile App Development (Milestone 2)', 1, 156355.93, 156355.93);

    -- 8. Payments (Zenith paid ₹184,500)
    INSERT INTO public.payments (business_id, invoice_id, customer_id, amount, payment_date, payment_method, reference_number)
    VALUES
    (demo_biz_id, inv_zenith_id, cust_zenith_id, 184500.00, CURRENT_DATE - INTERVAL '2 days', 'bank_transfer', 'HDFC-TXN-98421039');

    -- 9. Proposals
    INSERT INTO public.proposals (id, business_id, customer_id, title, project_overview, total_value, status, valid_until, deliverables)
    VALUES
    (prop_acme_id, demo_biz_id, cust_acme_id, 'Brand Redesign & Native Mobile Suite', 'Comprehensive multi-platform digital redesign with scalable React Native mobile architecture.', 85000.00, 'sent', CURRENT_DATE + INTERVAL '14 days', 
    '[{"title": "Design System & Figma Tokens", "cost": 25000}, {"title": "React Native Mobile App Development", "cost": 45000}, {"title": "Supabase Cloud Deployment & QA", "cost": 15000}]'::jsonb);

    -- 10. Tasks
    INSERT INTO public.tasks (business_id, customer_id, title, description, status, priority, due_date)
    VALUES
    (demo_biz_id, cust_acme_id, 'Follow up with Vikram on pending proposal', 'Proposal sent 6 days ago. Check if they have questions regarding timeline.', 'pending', 'urgent', NOW() + INTERVAL '4 hours'),
    (demo_biz_id, cust_xyz_id, 'Send reminder for overdue invoice #INV-2026-002', '₹8,500 overdue by 5 days.', 'pending', 'high', NOW() + INTERVAL '1 day'),
    (demo_biz_id, cust_rahul_id, 'Schedule discovery call for Q4 retainer', 'Respond to inquiry from WhatsApp.', 'pending', 'medium', NOW() + INTERVAL '2 days');

    -- 11. Subscription (RevenueCat active Pro plan)
    INSERT INTO public.subscriptions (business_id, user_id, tier, status, active_entitlements)
    VALUES (demo_biz_id, demo_user_id, 'pro', 'active', '["pro_access", "sales_agent", "finance_agent", "proposal_agent", "unlimited_ai"]'::jsonb)
    ON CONFLICT (business_id) DO NOTHING;

END $$;
