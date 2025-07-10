// Application Priority Types
export enum ApplicationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

// Referral Message Types
export enum ReferralMessageType {
  COLD_OUTREACH = "cold_outreach",
  WARM_INTRODUCTION = "warm_introduction", 
  FOLLOW_UP = "follow_up",
  THANK_YOU = "thank_you",
  NETWORKING = "networking"
}

export interface ReferralMessage {
  id: string;
  title: string;
  message_type: ReferralMessageType;
  subject_template?: string;
  message_template: string;
  target_company?: string;
  target_position?: string;
  is_active: boolean;
  usage_count: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralMessageCreate {
  title: string;
  message_type: ReferralMessageType;
  subject_template?: string;
  message_template: string;
  target_company?: string;
  target_position?: string;
  is_active?: boolean;
  notes?: string;
}

export interface ReferralMessageUpdate {
  title?: string;
  message_type?: ReferralMessageType;
  subject_template?: string;
  message_template?: string;
  target_company?: string;
  target_position?: string;
  is_active?: boolean;
  notes?: string;
}

export interface GenerateReferralMessageRequest {
  template_id: string;
  contact_name?: string;
  company_name?: string;
  position_title?: string;
  your_name?: string;
  your_background?: string;
  custom_variables?: Record<string, string>;
}

export interface GeneratedReferralMessage {
  subject?: string;
  message: string;
  template_title: string;
  variables_used: Record<string, string>;
}

export interface ReferralMessageAnalytics {
  total_templates: number;
  active_templates: number;
  total_usage: number;
  usage_by_type: Record<string, number>;
  most_used_template?: {
    id: string;
    title: string;
    usage_count: number;
  };
}

// Common Application and Contact types for reference
export interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  priority: ApplicationPriority;
  date_applied: string;
  job_url: string;
  portal_url?: string;
  email_used: string;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  role?: string;
  linkedin_url?: string;
  contact_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
} 