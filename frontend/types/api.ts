/**
 * TypeScript type definitions for API responses
 * This would define the exact shape of data from our refactored backend
 */

// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "agent" | "client";
  client_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Add this new interface
export interface DemoBooking {
  booking_name_shared?: string;
  booking_phone_shared?: string;
  booking_email_shared?: string;
  booking_date_shared?: string;
  booking_time_shared?: string;
  calendar_event_id_shared?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: "admin" | "agent" | "client";
  client_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Lead types
export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status:
    | "new"
    | "contacted"
    | "converted"
    | "lost"
    | "no_response"
    | "completed"
    | "busy"
    | "no_answer"
    | "ready"
    | "pending_preview"
    | "previewed"
    | string
    | null;
  assigned_to?: string;
  campaign_id?: string;
  campaign_name?: string;
  batch_id?: string;
  campaign_history: CampaignHistory[];
  created_by: string;
  created_at: string;
  updated_at: string;

  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_summary_vb?: string;
  leads_notes?: string;
  decision_maker_identified_shared?: boolean;
  first_contact_name_vb?: string;
  referral_name_vb?: string;
  referral_phone_vb?: string;
  referral_email_vb?: string;
  referral_role_vb?: string;
  next_attempt_at_vb?: string;
  call_status_vb?: string;
  call_duration_vb?: number;
  conversation_summary_vb?: string;
  follow_up_count_pc?: boolean;
  follow_up_next_attempt_at_vb?: string;
  undetermined_flag_pc?: boolean;
  meeting_booked_shared?: boolean;
  demo_booking_shared?: DemoBooking;
  updated_by_shared?: string;
  is_processed_shared?: boolean;
}

export interface LeadCreate {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  source?: string;
  notes?: string;
  status?: "new" | "contacted" | "converted" | "lost" | "no_response";
  assigned_to?: string;
  campaign_id?: string;

  // NEW: Optional fields for creation
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_summary_vb?: string;
  leads_notes?: string;
  decision_maker_identified_shared?: boolean;
  first_contact_name_vb?: string;
  referral_name_vb?: string;
  referral_phone_vb?: string;
  referral_email_vb?: string;
  referral_role_vb?: string;
  call_status_vb?: string;
  call_duration_vb?: number;
  conversation_summary_vb?: string;
  follow_up_count_pc?: boolean;
  undetermined_flag_pc?: boolean;
  meeting_booked_shared?: boolean;
  demo_booking_shared?: DemoBooking;
  updated_by_shared?: string;
  is_processed_shared?: boolean;
}

export interface CampaignHistory {
  from_campaign_id?: string;
  to_campaign_id?: string;
  changed_at: string;
  changed_by: string;
}

// Campaign types
export interface Campaign {
  id: string;
  // New mandatory fields
  campaign_id: string;
  campaign_name: string;
  campaign_description: string;
  client_id: string;
  agent_id: string;
  // Legacy fields (for backward compatibility)
  name?: string;
  description?: string;
  agent_id_vb?: string;
  // Common fields
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_leads: number;
  completed_leads: number;
  // Optional configuration fields
  main_sequence_attempts?: number;
  follow_up_delay_days_pc?: number;
  follow_up_max_attempts_pc?: number;
  holiday_calendar_pc?: string;
  weekend_adjustment_pc?: boolean;
  timezone_shared?: string;
  start_call?: string;
}

export interface CampaignCreate {
  campaign_name: string;
  campaign_description: string;
  lead_ids: string[];
  campaign_id?: string;
  client_id?: string;
  agent_id?: string;
  main_sequence_attempts?: number;
  follow_up_delay_days_pc?: number;
  follow_up_max_attempts_pc?: number;
  holiday_calendar_pc?: string;
  weekend_adjustment_pc?: boolean;
  timezone_shared?: string;
  is_active?: boolean;
  start_call?: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  attempts_made: number;
  max_attempts: number;
  last_attempt_at?: string;
  next_attempt_at?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  last_call_outcome?: "answered" | "no_answer" | "busy" | "voicemail";
  notes?: string;
  assigned_agent?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  campaign_lead_id: string;
  agent_id: string;
  outcome: "answered" | "no_answer" | "busy" | "voicemail";
  duration_seconds?: number;
  notes?: string;
  call_time: string;
}

export interface CallLogCreate {
  campaign_lead_id: string;
  outcome: "answered" | "no_answer" | "busy" | "voicemail";
  duration_seconds?: number;
  notes?: string;
}

export interface NextLeadResponse {
  campaign_lead: CampaignLead;
  lead: Lead;
  message: string;
}

// Meeting types
export interface Meeting {
  id: string;
  lead_id: string;
  organizer_id: string;
  title?: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: "proposed" | "confirmed" | "rescheduled" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface MeetingCreate {
  lead_id: string;
  title?: string;
  start_time: string;
  duration_minutes?: number;
  notes?: string;
}

export interface MeetingProposal {
  lead_id: string;
  requested_time: string;
  duration_minutes?: number;
  title?: string;
  notes?: string;
}

// Ticket types
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketCreate {
  title: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

export interface TicketUpdate {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "in_progress" | "resolved" | "closed";
  assigned_to?: string;
  notes?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Statistics types
export interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  completed_leads: number;
  in_progress_leads: number;
  failed_leads: number;
  pending_leads: number;
  call_outcomes: Record<string, number>;
  conversion_rate: number;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
}
