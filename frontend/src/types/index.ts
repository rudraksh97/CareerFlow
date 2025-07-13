// Application Priority Types
export enum ApplicationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Email Types
export enum EmailStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DISCARDED = 'DISCARDED',
  ARCHIVED = 'ARCHIVED',
}

export enum EmailPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum EmailCategory {
  JOB_APPLICATION = 'JOB_APPLICATION',
  INTERVIEW_INVITATION = 'INTERVIEW_INVITATION',
  REJECTION = 'REJECTION',
  OFFER = 'OFFER',
  RECRUITER_OUTREACH = 'RECRUITER_OUTREACH',
  FOLLOW_UP = 'FOLLOW_UP',
  OTHER = 'OTHER',
}

export interface Email {
  id: string;
  thread_id: string;
  subject: string;
  sender_name?: string;
  sender_email: string;
  recipient_email: string;
  body_text?: string;
  body_html?: string;
  date_received: string;
  status: EmailStatus;
  priority: EmailPriority;
  category?: EmailCategory;
  is_hiring_related: boolean;
  confidence_score?: string;
  labels?: string;
  attachments?: string;
  company_name?: string;
  job_title?: string;
  application_id?: string;
  notes?: string;
  is_synced: boolean;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCreate {
  id: string;
  thread_id: string;
  subject: string;
  sender_name?: string;
  sender_email: string;
  recipient_email: string;
  body_text?: string;
  body_html?: string;
  date_received: string;
  status?: EmailStatus;
  priority?: EmailPriority;
  category?: EmailCategory;
  is_hiring_related?: boolean;
  confidence_score?: string;
  labels?: string;
  attachments?: string;
  company_name?: string;
  job_title?: string;
  application_id?: string;
  notes?: string;
}

export interface EmailUpdate {
  subject?: string;
  sender_name?: string;
  status?: EmailStatus;
  priority?: EmailPriority;
  category?: EmailCategory;
  is_hiring_related?: boolean;
  company_name?: string;
  job_title?: string;
  application_id?: string;
  notes?: string;
}

// Referral Message Types
export enum ReferralMessageType {
  COLD_OUTREACH = 'cold_outreach',
  WARM_INTRODUCTION = 'warm_introduction',
  FOLLOW_UP = 'follow_up',
  THANK_YOU = 'thank_you',
  NETWORKING = 'networking',
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

// Resource Types
export interface ResourceGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceGroupCreate {
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface ResourceGroupUpdate {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  description?: string;
  group_id?: string;
  tags?: string;
  is_favorite: boolean;
  visit_count: string;
  last_visited?: string;
  created_at: string;
  updated_at: string;
  group?: ResourceGroup;
}

export interface ResourceCreate {
  name: string;
  url: string;
  description?: string;
  group_id?: string;
  tags?: string;
  is_favorite?: boolean;
}

export interface ResourceUpdate {
  name?: string;
  url?: string;
  description?: string;
  group_id?: string;
  tags?: string;
  is_favorite?: boolean;
}

export interface ResourceAnalytics {
  total_resources: number;
  total_groups: number;
  favorites_count: number;
  most_visited: Resource[];
  recent_resources: Resource[];
}

// Todo Types
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface TodoCreate {
  text: string;
  completed?: boolean;
}

export interface TodoUpdate {
  text?: string;
  completed?: boolean;
}

// Reminder Types
export enum ReminderType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ONE_TIME = 'one_time',
}

export enum ReminderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_time: string;
  reminder_date: string;
  type: ReminderType;
  priority: ReminderPriority;
  completed: boolean;
  is_active: boolean;
  recurrence_pattern?: string;
  next_reminder_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreate {
  title: string;
  description?: string;
  reminder_time: string;
  reminder_date: string;
  type?: ReminderType;
  priority?: ReminderPriority;
  completed?: boolean;
  is_active?: boolean;
  recurrence_pattern?: string;
  next_reminder_date?: string;
}

export interface ReminderUpdate {
  title?: string;
  description?: string;
  reminder_time?: string;
  reminder_date?: string;
  type?: ReminderType;
  priority?: ReminderPriority;
  completed?: boolean;
  is_active?: boolean;
  recurrence_pattern?: string;
  next_reminder_date?: string;
}
