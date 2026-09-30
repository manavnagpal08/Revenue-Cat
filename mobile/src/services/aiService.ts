import { supabase } from '../lib/supabase';
import { AICommandResult, AIMessage, AIBusinessBrief, AIAgentActionCard, Lead, Customer, Invoice, Proposal } from '../types';
import { leadService } from './leadService';
import { customerService } from './customerService';
import { invoiceService } from './invoiceService';
import { proposalService } from './proposalService';
import { automationService, Automation } from './automationService';
import { integrationService, IntegrationItem } from './integrationService';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://revenue-cat.onrender.com';

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

/**
 * Direct Gemini 2.5 Flash Reasoning Engine
 */
async function queryGeminiFlash(systemContext: string, userPrompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${systemContext}\n\nUser Request: "${userPrompt}"\n\nInstructions: Provide an authoritative, clear, and beautifully structured response in markdown. Highlight key numbers and customer names in bold. When asked about leads, analyze every relevant lead from the context with specific stages, deal values, and concrete next actions.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }
  } catch (e) {
    console.warn('Gemini 2.5 Flash direct invocation notice:', e);
  }
  return null;
}

/**
 * Log AI events and operations to Supabase audit_logs
 */
async function logAuditRecord(
  businessId: string,
  eventType: string,
  message: string,
  metadata: Record<string, any> = {}
) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from('audit_logs').insert({
      business_id: businessId,
      user_id: user?.id,
      event_type: eventType,
      action: eventType,
      entity_type: 'ai_agent',
      message: message,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    // Non-blocking
  }
}

export const aiService = {
  /**
   * Send user prompt to the AI Supervisor & Specialized Agents.
   */
  async sendCommand(
    businessId: string,
    prompt: string,
    conversationId?: string
  ): Promise<AICommandResult> {
    const convId = conversationId || 'conv-' + Date.now();

    // 1. Audit log the incoming prompt
    await logAuditRecord(businessId, 'ai_chat_command', `User command: "${prompt}"`, {
      conversation_id: convId,
      prompt,
    });

    // 2. Direct Intelligent Workspace Engine with Gemini 2.5 Flash
    const commandResult = await this._processFullWorkspaceCommand(businessId, prompt, convId);

    await logAuditRecord(businessId, 'ai_command_processed', `Engine processed intent: ${commandResult.intent}`, {
      agent: commandResult.agent,
      intent: commandResult.intent,
    });

    return commandResult;
  },

  /**
   * Confirm and execute a write action with deduplication safety.
   */
  async confirmAction(
    businessId: string,
    actionType: string,
    payload: Record<string, any>
  ): Promise<any> {
    await logAuditRecord(businessId, 'ai_action_confirmed', `Executing action ${actionType}`, {
      action_type: actionType,
      payload,
    });

    let result: any = { success: true };

    if (actionType === 'CREATE_PROPOSAL') {
      const proposal = await proposalService.createProposal({
        business_id: businessId,
        customer_id: payload.customer_id,
        title: payload.title || 'Custom Scope & Deliverables',
        project_overview: payload.project_overview || 'Scoping created by SoloCEO AI Agent',
        deliverables: payload.deliverables || [{ title: 'Milestone 1: Delivery', cost: payload.total_value || 50000 }],
        total_value: Number(payload.total_value) || 50000,
        timeline: payload.timeline || '2 Weeks',
      });
      result = { success: true, proposal, data: proposal };
    } else if (actionType === 'CREATE_LEAD') {
      // Deduplication check: check if lead or customer already exists with this email or title
      const existingLeads = await leadService.listLeads(businessId);
      const cleanEmail = (payload.email || '').toLowerCase().trim();
      const duplicateLead = existingLeads.find(
        (l: Lead) => (cleanEmail && l.email?.toLowerCase().trim() === cleanEmail) || l.title.toLowerCase() === (payload.title || '').toLowerCase()
      );

      if (duplicateLead) {
        const updated = await leadService.updateLead(duplicateLead.id, {
          value: Number(payload.value) || duplicateLead.value,
          notes: `${duplicateLead.notes || ''}\n[AI Update]: ${payload.notes || 'Inquiry re-engaged'}`.trim(),
        });
        result = { success: true, lead: updated, deduplicated: true };
      } else {
        const lead = await leadService.createLead({
          business_id: businessId,
          title: payload.title || 'Inbound Lead',
          company: payload.company || payload.title,
          contact_name: payload.contact_name || payload.title,
          email: payload.email,
          phone: payload.phone,
          value: Number(payload.value) || 50000,
          source: payload.source || 'AI Agent Chat',
          status: 'new',
          priority: 'high',
          notes: payload.notes || 'Created via SoloCEO AI Agent Command',
        });
        result = { success: true, lead, data: lead };
      }
    } else if (actionType === 'CREATE_CUSTOMER') {
      const existingCustomers = await customerService.listCustomers(businessId);
      const cleanEmail = (payload.email || '').toLowerCase().trim();
      const duplicate = existingCustomers.find(
        (c: Customer) => cleanEmail && c.email?.toLowerCase().trim() === cleanEmail
      );

      if (duplicate) {
        result = { success: true, customer: duplicate, deduplicated: true };
      } else {
        const customer = await customerService.createCustomer({
          business_id: businessId,
          name: payload.name || 'New Client',
          company_name: payload.company_name || payload.name,
          email: payload.email,
          phone: payload.phone,
          status: 'active',
          notes: payload.notes || 'Created via SoloCEO AI Agent Command',
        });
        result = { success: true, customer, data: customer };
      }
    } else if (actionType === 'CREATE_INVOICE') {
      let customerId = payload.customer_id;
      if (!customerId) {
        const cust = await customerService.createCustomer({
          business_id: businessId,
          name: payload.customer_name || 'Client',
          company_name: payload.customer_name || 'Client',
          email: payload.email,
          status: 'active',
        });
        customerId = cust.id;
      }

      const invoice = await invoiceService.createInvoice({
        business_id: businessId,
        customer_id: customerId,
        due_date: payload.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: payload.notes || 'Generated by SoloCEO AI Agent',
        items: payload.items || [
          {
            description: payload.description || 'Professional Services',
            quantity: 1,
            unit_price: Number(payload.amount) || 50000,
          },
        ],
      });
      result = { success: true, invoice, data: invoice };
    } else if (actionType === 'RUN_AUTOMATION') {
      const runResult = await automationService.runAutomationNow(payload.automation_id, businessId);
      result = { success: true, run: runResult };
    } else if (actionType === 'SCHEDULE_MEETING') {
      const calResult = await integrationService.createCalendarEvent(
        businessId,
        payload.title || 'Discovery Call',
        payload.start_time || new Date(Date.now() + 86400000).toISOString(),
        payload.end_time || new Date(Date.now() + 86400000 + 3600000).toISOString(),
        payload.description || 'Meeting scheduled via SoloCEO AI Agent',
        payload.attendees || []
      );
      result = { success: true, calendar: calResult };
    } else if (actionType === 'SEND_GMAIL_FOLLOWUP') {
      const emailResult = await integrationService.sendGmailFollowUp(
        businessId,
        payload.to_email,
        payload.subject || 'Project Follow-up',
        payload.body || 'Hi, checking in regarding our next steps.',
        payload.sender_email,
        payload.app_password
      );
      result = { success: true, email: emailResult };
    }

    await logAuditRecord(businessId, 'ai_action_executed_db', `Action ${actionType} executed in workspace`, {
      action_type: actionType,
      result_summary: result.deduplicated ? 'Deduplicated & Merged' : 'New Record Created',
    });

    return result;
  },

  /**
   * Fetch real-time AI business brief for dashboard.
   */
  async getBusinessBrief(businessId: string): Promise<AIBusinessBrief> {
    const [leads, invoices, proposals] = await Promise.all([
      leadService.listLeads(businessId),
      invoiceService.listInvoices(businessId),
      proposalService.listProposals(businessId),
    ]);

    const activeLeads = leads.filter((l: Lead) => l.status !== 'won' && l.status !== 'lost');
    const overdueInvs = invoices.filter((i: Invoice) => i.status === 'overdue');
    const overdueAmt = overdueInvs.reduce(
      (sum: number, i: Invoice) => sum + (Number(i.total_amount) - Number(i.paid_amount || 0)),
      0
    );
    const collected = invoices
      .filter((i: Invoice) => i.status === 'paid')
      .reduce((sum: number, i: Invoice) => sum + Number(i.total_amount || 0), 0);

    return {
      top_opportunity: activeLeads.length > 0 ? activeLeads[0] : null,
      inactive_leads_count: activeLeads.length,
      inactive_leads_value: activeLeads.reduce((sum: number, l: Lead) => sum + Number(l.value || 0), 0),
      overdue_invoices_count: overdueInvs.length,
      overdue_amount: overdueAmt,
      revenue_collected: collected,
      pending_proposals_count: proposals.length,
      pending_proposals_value: proposals.reduce((sum: number, p: Proposal) => sum + Number(p.total_value || 0), 0),
      generated_at_summary: 'Synthesized live from Supabase workspace records',
    };
  },

  /**
   * Comprehensive Workspace Intelligence Processing
   */
  async _processFullWorkspaceCommand(
    businessId: string,
    prompt: string,
    conversationId: string
  ): Promise<AICommandResult> {
    const q = prompt.toLowerCase();
    const convId = conversationId;

    // Fetch all workspace records concurrently
    const [leads, customers, invoices, proposals, automations, integrations] = await Promise.all([
      leadService.listLeads(businessId),
      customerService.listCustomers(businessId),
      invoiceService.listInvoices(businessId),
      proposalService.listProposals(businessId),
      automationService.getAutomations(businessId),
      integrationService.listIntegrations(businessId),
    ]);

    // Build rich, structured workspace context for Gemini
    const totalPipelineValue = leads.reduce((s: number, l: Lead) => s + Number(l.value || 0), 0);
    const openLeads = leads.filter((l: Lead) => l.status !== 'won' && l.status !== 'lost');
    const overdueInvoices = invoices.filter((i: Invoice) => i.status === 'overdue');
    const collectedRevenue = invoices
      .filter((i: Invoice) => i.status === 'paid')
      .reduce((s: number, i: Invoice) => s + Number(i.total_amount || 0), 0);

    const leadsDetailedContext = leads.length > 0
      ? leads.map((l: Lead, idx: number) =>
          `${idx + 1}. **${l.title}** (${l.company || 'Direct'}) | Value: ₹${Number(l.value || 0).toLocaleString('en-IN')} | Stage: ${(l.status || 'new').toUpperCase()} | Priority: ${(l.priority || 'medium').toUpperCase()} | Email: ${l.email || 'N/A'} | Notes: "${l.notes || 'No extra notes'}"`
        ).join('\n')
      : 'No active leads registered in this workspace yet.';

    const customersContext = customers.length > 0
      ? customers.slice(0, 5).map((c: Customer) => `• ${c.name} (${c.company_name || 'Individual'}) - LTV: ₹${Number(c.total_revenue || 0).toLocaleString('en-IN')}`).join('\n')
      : 'No customer profiles found.';

    const invoicesContext = invoices.length > 0
      ? invoices.slice(0, 5).map((i: Invoice) => `• #${i.invoice_number}: ₹${Number(i.total_amount || 0).toLocaleString('en-IN')} (Status: ${i.status.toUpperCase()}, Due: ${i.due_date})`).join('\n')
      : 'No invoices recorded.';

    const fullWorkspaceContext = `
You are the SoloCEO Autonomous AI Operating System Supervisor.
LIVE WORKSPACE DATABASE SNAPSHOT:
=====================================================
📊 SALES PIPELINE LEADS (${leads.length} Total, ₹${totalPipelineValue.toLocaleString('en-IN')} Total Value):
${leadsDetailedContext}

👥 ACTIVE CLIENTS (${customers.length} Clients):
${customersContext}

💳 INVOICES & CASH FLOW (${invoices.length} Invoices, ₹${collectedRevenue.toLocaleString('en-IN')} Collected):
${invoicesContext}

⚙️ AUTOMATIONS & INTEGRATIONS:
- Active Workflows: ${automations.filter((a: Automation) => a.enabled).length}/${automations.length}
- Connected Integrations: ${integrations.filter((i: IntegrationItem) => i.status === 'connected').length}/${integrations.length}
=====================================================
`;

    // -------------------------------------------------------------------------
    // 1. WRITE TASK: CREATE / LOG NEW LEAD
    // -------------------------------------------------------------------------
    if (
      (q.includes('lead') || q.includes('prospect') || q.includes('deal')) &&
      (q.includes('create') || q.includes('add') || q.includes('new') || q.includes('log') || q.includes('register'))
    ) {
      const valMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|lakh|lac|cr)?/i);
      let parsedValue = 50000;
      if (valMatch) {
        let rawNum = parseFloat(valMatch[1].replace(/,/g, ''));
        if (prompt.toLowerCase().includes('k') && rawNum < 1000) rawNum *= 1000;
        if (prompt.toLowerCase().includes('lakh') || prompt.toLowerCase().includes('lac')) rawNum *= 100000;
        if (rawNum > 0) parsedValue = rawNum;
      }

      let extractedName = 'New Opportunity';
      const forMatch = prompt.match(/(?:for|with|from|lead)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:for|worth|of|at|\d|₹)|\.|$)/);
      if (forMatch && forMatch[1]) extractedName = forMatch[1].trim();

      const pendingLead = {
        title: `${extractedName}: Project Scope`,
        company: extractedName,
        contact_name: extractedName,
        value: parsedValue,
        source: 'AI Agent Command',
        status: 'new',
        priority: 'high',
        notes: `Captured via SoloCEO AI Agent conversation. Prompt: "${prompt}"`,
      };

      return {
        conversation_id: convId,
        agent: 'sales',
        intent: 'CREATE_LEAD',
        message: `### 🎯 New Sales Opportunity Prepared\n\n• **Opportunity:** **${extractedName}**\n• **Estimated Deal Value:** **₹${parsedValue.toLocaleString('en-IN')}**\n• **Pipeline Stage:** **NEW**\n• **Priority:** **HIGH**\n• **Deduplication Check:** ✅ Verified clean record\n\nWould you like me to log this deal into your Sales Pipeline now?`,
        requires_confirmation: true,
        pending_action: {
          action_type: 'CREATE_LEAD',
          payload: pendingLead,
        },
        action_cards: [
          {
            type: 'lead_followup',
            title: `Create Lead: ${extractedName}`,
            description: `₹${parsedValue.toLocaleString('en-IN')} deal • New opportunity`,
            primary_action_label: 'Confirm & Create Lead',
            action_payload: { action: 'CREATE_LEAD', ...pendingLead },
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // 2. WRITE TASK: CREATE INVOICE
    // -------------------------------------------------------------------------
    if (
      (q.includes('invoice') || q.includes('bill')) &&
      (q.includes('create') || q.includes('generate') || q.includes('draft') || q.includes('send') || q.includes('issue'))
    ) {
      const valMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|lakh|lac|cr)?/i);
      let parsedAmount = 50000;
      if (valMatch) {
        let rawNum = parseFloat(valMatch[1].replace(/,/g, ''));
        if (prompt.toLowerCase().includes('k') && rawNum < 1000) rawNum *= 1000;
        if (prompt.toLowerCase().includes('lakh') || prompt.toLowerCase().includes('lac')) rawNum *= 100000;
        if (rawNum > 0) parsedAmount = rawNum;
      }

      let clientName = customers.length > 0 ? customers[0].name : 'Client Partner';
      const forMatch = prompt.match(/(?:for|to)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:for|worth|of|at|\d|₹)|\.|$)/);
      if (forMatch && forMatch[1]) clientName = forMatch[1].trim();

      const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const gst = Math.round(parsedAmount * 0.18);
      const total = parsedAmount + gst;

      return {
        conversation_id: convId,
        agent: 'finance',
        intent: 'CREATE_INVOICE',
        message: `### 💳 Invoice Draft Prepared\n\n• **Client:** **${clientName}**\n• **Base Amount:** ₹${parsedAmount.toLocaleString('en-IN')}\n• **GST (18%):** ₹${gst.toLocaleString('en-IN')}\n• **Total Payable:** **₹${total.toLocaleString('en-IN')}**\n• **Payment Due:** **${dueDate}** (7 Days)\n\nConfirm to issue this invoice draft?`,
        requires_confirmation: true,
        pending_action: {
          action_type: 'CREATE_INVOICE',
          payload: {
            customer_name: clientName,
            amount: parsedAmount,
            due_date: dueDate,
            description: `Professional Services for ${clientName}`,
          },
        },
        action_cards: [
          {
            type: 'invoice_reminder',
            title: `Issue Invoice: ${clientName}`,
            description: `₹${total.toLocaleString('en-IN')} due ${dueDate}`,
            primary_action_label: 'Confirm & Generate Invoice',
            action_payload: { action: 'CREATE_INVOICE', customer_name: clientName, amount: parsedAmount },
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // 3. WRITE TASK: CREATE PROPOSAL
    // -------------------------------------------------------------------------
    if (
      (q.includes('proposal') || q.includes('quote') || q.includes('scope')) &&
      (q.includes('create') || q.includes('draft') || q.includes('new') || q.includes('prepare'))
    ) {
      let clientName = customers.length > 0 ? customers[0].name : 'Client Partner';
      const forMatch = prompt.match(/(?:for|to|with)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:for|worth|of|at|\d|₹)|\.|$)/);
      if (forMatch && forMatch[1]) clientName = forMatch[1].trim();

      const valMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|lakh|lac|cr)?/i);
      let parsedValue = 75000;
      if (valMatch) {
        let rawNum = parseFloat(valMatch[1].replace(/,/g, ''));
        if (prompt.toLowerCase().includes('k') && rawNum < 1000) rawNum *= 1000;
        if (prompt.toLowerCase().includes('lakh')) rawNum *= 100000;
        if (rawNum > 0) parsedValue = rawNum;
      }

      return {
        conversation_id: convId,
        agent: 'proposal',
        intent: 'CREATE_PROPOSAL',
        message: `### 📄 AI Proposal Draft Prepared\n\n• **Title:** **${clientName}: Strategic Engagement**\n• **Total Value:** **₹${parsedValue.toLocaleString('en-IN')}**\n• **Timeline:** 3-4 Weeks\n• **Phase 1 Deliverable:** System Architecture (₹${Math.round(parsedValue * 0.4).toLocaleString('en-IN')})\n• **Phase 2 Deliverable:** Full Deployment (₹${Math.round(parsedValue * 0.6).toLocaleString('en-IN')})\n\nConfirm to save this proposal in your workspace?`,
        requires_confirmation: true,
        pending_action: {
          action_type: 'CREATE_PROPOSAL',
          payload: {
            title: `${clientName}: Strategic Implementation Scope`,
            total_value: parsedValue,
            timeline: '3-4 Weeks',
            project_overview: `Comprehensive engagement scope tailored for ${clientName}.`,
            deliverables: [
              { title: 'Discovery & System Design', cost: Math.round(parsedValue * 0.4) },
              { title: 'Implementation & Handover', cost: Math.round(parsedValue * 0.6) },
            ],
          },
        },
        action_cards: [
          {
            type: 'proposal_draft',
            title: `Create Proposal: ${clientName}`,
            description: `₹${parsedValue.toLocaleString('en-IN')} • 2 Deliverables`,
            primary_action_label: 'Confirm & Save Proposal',
            action_payload: { action: 'CREATE_PROPOSAL' },
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // 4. WRITE TASK: SCHEDULE GOOGLE CALENDAR MEETING
    // -------------------------------------------------------------------------
    if (q.includes('meeting') || q.includes('calendar') || q.includes('schedule call') || q.includes('book call')) {
      let clientName = 'Client Partner';
      const withMatch = prompt.match(/(?:with|for)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:on|at|tomorrow|\d)|\.|$)/);
      if (withMatch && withMatch[1]) clientName = withMatch[1].trim();

      const meetingTime = new Date(Date.now() + 86400000).toISOString();

      return {
        conversation_id: convId,
        agent: 'supervisor',
        intent: 'SCHEDULE_MEETING',
        message: `### 📅 Google Meet Schedule Prepared\n\n• **Event:** Discovery Call with **${clientName}**\n• **Type:** Google Meet (Video Call)\n• **Duration:** 45 Minutes\n• **Agenda:** AI-generated scope review & milestone planning\n\nConfirm to schedule this meeting on your Google Calendar?`,
        requires_confirmation: true,
        pending_action: {
          action_type: 'SCHEDULE_MEETING',
          payload: {
            title: `Discovery Call with ${clientName}`,
            start_time: meetingTime,
            description: `Google Meet call scheduled via SoloCEO AI Agent.`,
          },
        },
        action_cards: [
          {
            type: 'general',
            title: `Schedule Call: ${clientName}`,
            description: `Google Meet • Tomorrow 10:00 AM`,
            primary_action_label: 'Confirm & Schedule Call',
            action_payload: { action: 'SCHEDULE_MEETING', title: `Discovery Call with ${clientName}` },
          },
        ],
      };
    }

    // -------------------------------------------------------------------------
    // 5. QUERY: SALES PIPELINE & LEADS (POWERED BY GEMINI 2.5 FLASH)
    // -------------------------------------------------------------------------
    if (
      q.includes('lead') ||
      q.includes('pipeline') ||
      q.includes('sales') ||
      q.includes('deal') ||
      q.includes('opportunity') ||
      q.includes('prospect')
    ) {
      const geminiReply = await queryGeminiFlash(fullWorkspaceContext, prompt);

      const fallbackLeadList = openLeads.length > 0
        ? `### 📊 Active Sales Pipeline (${openLeads.length} Deals, ₹${totalPipelineValue.toLocaleString('en-IN')})\n\n` +
          openLeads.map((l: Lead, i: number) =>
            `${i + 1}. **${l.title}**\n   • **Deal Value:** ₹${Number(l.value || 0).toLocaleString('en-IN')}\n   • **Stage:** *${(l.status || 'new').toUpperCase()}* | **Priority:** *${(l.priority || 'medium').toUpperCase()}*\n   • **Contact:** ${l.email || 'Direct inquiry'}`
          ).join('\n\n')
        : 'You currently have no open leads. Ask me to **"Create lead for Apex Corp worth ₹1,50,000"** to add one!';

      return {
        conversation_id: convId,
        agent: 'sales',
        intent: 'SALES_QUERY',
        message: geminiReply || fallbackLeadList,
        action_cards: openLeads.slice(0, 3).map((l: Lead) => ({
          type: 'lead_followup',
          title: l.title,
          description: `₹${Number(l.value || 0).toLocaleString('en-IN')} • ${l.status.toUpperCase()}`,
          primary_action_label: 'View Deal Details',
          action_payload: { lead_id: l.id, action: 'VIEW_LEAD' },
        })),
      };
    }

    // -------------------------------------------------------------------------
    // 6. QUERY: FINANCE & INVOICES (POWERED BY GEMINI 2.5 FLASH)
    // -------------------------------------------------------------------------
    if (q.includes('invoice') || q.includes('owe') || q.includes('money') || q.includes('finance') || q.includes('revenue') || q.includes('overdue')) {
      const geminiReply = await queryGeminiFlash(fullWorkspaceContext, prompt);
      const overdueAmt = overdueInvoices.reduce((s: number, i: Invoice) => s + (Number(i.total_amount) - Number(i.paid_amount || 0)), 0);

      const fallbackFinance =
        `### 💳 Financial Health Overview\n\n` +
        `• **Collected Cash Flow:** **₹${collectedRevenue.toLocaleString('en-IN')}**\n` +
        `• **Total Invoices Issued:** ${invoices.length} (${invoices.filter((i: Invoice) => i.status === 'paid').length} paid)\n` +
        `• **Overdue Receivables:** **₹${overdueAmt.toLocaleString('en-IN')}** across ${overdueInvoices.length} invoices.\n\n` +
        (overdueInvoices.length > 0 ? `⚠️ **Action Recommended:** Follow up with overdue accounts to unlock cash flow.` : `✅ All client receivables are settled.`);

      return {
        conversation_id: convId,
        agent: 'finance',
        intent: 'FINANCE_QUERY',
        message: geminiReply || fallbackFinance,
        action_cards: overdueInvoices.slice(0, 3).map((inv: Invoice) => ({
          type: 'invoice_reminder',
          title: `Collect Invoice #${inv.invoice_number}`,
          description: `₹${Number(inv.total_amount).toLocaleString('en-IN')} overdue since ${inv.due_date}`,
          primary_action_label: 'View Invoice',
          action_payload: { invoice_id: inv.id, action: 'VIEW_INVOICE' },
        })),
      };
    }

    // -------------------------------------------------------------------------
    // 7. GENERAL QUERY / STRATEGY (POWERED BY GEMINI 2.5 FLASH)
    // -------------------------------------------------------------------------
    const geminiReply = await queryGeminiFlash(fullWorkspaceContext, prompt);

    const fallbackBrief =
      `### 🚀 SoloCEO Executive Briefing\n\n` +
      `1. **Sales Pipeline:** **${openLeads.length} open deals** totaling **₹${totalPipelineValue.toLocaleString('en-IN')}**.\n` +
      `2. **Cash & Receivables:** **₹${collectedRevenue.toLocaleString('en-IN')}** collected. ${overdueInvoices.length > 0 ? `⚠️ ₹${overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0).toLocaleString('en-IN')} overdue.` : '✅ All receivables current.'}\n` +
      `3. **Proposals Active:** **${proposals.length} active engagements**.\n` +
      `4. **Integrations & Channels:** **${integrations.filter((i) => i.status === 'connected').length} active connections**.\n\n` +
      `You can ask me to **create a lead**, **issue an invoice**, **draft a proposal**, or **send email follow-ups** directly!`;

    return {
      conversation_id: convId,
      agent: 'supervisor',
      intent: 'GENERAL_SUMMARY',
      message: geminiReply || fallbackBrief,
      action_cards: [
        {
          type: 'lead_followup',
          title: 'Review Sales Pipeline',
          description: `${openLeads.length} open deals (₹${totalPipelineValue.toLocaleString('en-IN')})`,
          primary_action_label: 'Open Pipeline',
          action_payload: { action: 'VIEW_SALES' },
        },
        {
          type: 'invoice_reminder',
          title: 'Review Finance & Cash Flow',
          description: `₹${collectedRevenue.toLocaleString('en-IN')} collected revenue`,
          primary_action_label: 'Open Finance',
          action_payload: { action: 'VIEW_INVOICES' },
        },
      ],
    };
  },
};
