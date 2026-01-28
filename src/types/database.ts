export type UserRole = 'student' | 'coach';
export type EventType = 'training' | 'match' | 'tournament' | 'lesson';
export type LinkStatus = 'pending' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingCard {
  id: string;
  user_id: string;
  event_id: string | null;
  training_date: string;
  session_type: 'training' | 'match';
  partners: string[] | null;
  coach_present: boolean;
  objective: string | null;
  done_well_intensity: boolean;
  done_well_concentration: boolean;
  done_well_attitude: boolean;
  done_well_other: string | null;
  improve_position: boolean;
  improve_decision_making: boolean;
  improve_partner_communication: boolean;
  improve_error_management: boolean;
  improve_other: string | null;
  personal_notes: string | null;
  student_feedback: string | null;
  coach_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommonErrors {
  id: string;
  user_id: string;
  tech_simple_volley: boolean;
  tech_late_hit: boolean;
  tech_bandeja_bounce: boolean;
  tech_smash_ineffective: boolean;
  tech_other: string | null;
  tact_unclear_decisions: boolean;
  tact_wrong_timing_attack: boolean;
  tact_lose_position: boolean;
  tact_misread_opponent: boolean;
  tact_other: string | null;
  mental_get_nervous: boolean;
  mental_lose_focus_after_error: boolean;
  mental_hesitate_key_points: boolean;
  mental_drop_tension_when_ahead: boolean;
  mental_other: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeasonGoals {
  id: string;
  user_id: string;
  season_year: number;
  technical_goal: string | null;
  sports_goal: string | null;
  mental_goal: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentCoachLink {
  id: string;
  student_id: string;
  coach_id: string;
  status: LinkStatus;
  created_at: string;
  updated_at: string;
}
