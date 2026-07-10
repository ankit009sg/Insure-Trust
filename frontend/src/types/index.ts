export type Role = 'applicant' | 'policy_manager' | 'senior_manager';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface Flag {
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ExtractedField {
  label: string;
  value: any;
  original_value: any;
  flags: Flag[];
}

export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated';

export interface Application {
  id: number;
  applicant_id: number;
  status: ApplicationStatus;
  file_path?: string;
  extracted_data: Record<string, ExtractedField>;
  summary?: string;
  risk_rating?: 'low' | 'medium' | 'high';
  action_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  email: string;
}
