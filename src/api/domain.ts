export interface Sport {
  sport_id: number;
  name: string;
}

export interface FeedbackCategory {
  category_id: number;
  sport_name: string;
  name: string;
}

export interface ActivityType {
  activity_type_id: number;
  sport_name: string;
  name: string;
}

export type UserRole = 'player' | 'coach' | 'admin';
export type MembershipStatus = 'active' | 'inactive' | 'suspended';
export type HealthStatus = 'healthy' | 'injured' | 'recovering';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type ParticipationStatus = 'joined' | 'excused' | 'no_show';
export type ReportType = 'attendance' | 'performance' | 'training';
export type ReportStatus = 'pending' | 'approved';

export interface PlayerProfile {
  player_id: number;
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string | null;
  date_of_birth: string | null;
  team: string | null;
  year_level: number | null;
  profile_photo: string | null;
  membership_status: MembershipStatus;
  health_status: HealthStatus;
  is_active: boolean;
}

export interface PlayerHealthRecord {
  health_record_id: number;
  player_id: number;
  player_name: string | null;
  coach_id: number | null;
  coach_name: string | null;
  status: HealthStatus;
  injury_type: string | null;
  notes: string | null;
  reported_date: string;
  expected_return_date: string | null;
}

export interface CoachProfile {
  coach_id: number;
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string | null;
  specialization: string | null;
  is_active: boolean;
}

export interface AdminProfile {
  admin_id: number;
  user_id: number;
  username: string | null;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export interface SystemUserSummary {
  user_id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  display_name: string;
  email: string | null;
  team: string | null;
}

export interface AttendanceRecord {
  attendance_id: number;
  player_id: number;
  player_name: string | null;
  coach_id: number;
  coach_name: string | null;
  date: string;
  status: AttendanceStatus;
}

export interface TrainingActivity {
  activity_id: number;
  coach_id: number;
  coach_name: string | null;
  activity_name: string;
  activity_date: string;
  duration: number | null;
  notes: string | null;
  activity_type: string | null;
}

export interface ParticipationRecord {
  participation_id: number;
  player_id: number;
  player_name: string | null;
  activity_id: number;
  activity_name: string | null;
  activity_date: string | null;
  participation_status: ParticipationStatus;
}

export interface PerformanceFeedback {
  feedback_id: number;
  player_id: number;
  player_name: string | null;
  coach_id: number;
  coach_name: string | null;
  feedback_date: string;
  comments: string;
  rating: number;
  category: string | null;
}

export interface PlayerNote {
  note_id: number;
  player_id: number;
  note_date: string;
  content: string;
}

export interface LoginHistoryRecord {
  log_id: number;
  user_id: number;
  username: string | null;
  role: UserRole | null;
  login_time: string;
  logout_time: string | null;
  ip_address: string | null;
  device_info: string | null;
}

export interface ArchivedRecord {
  archive_id: number;
  record_type: string;
  record_id: number;
  archive_data: Record<string, unknown>;
  archived_at: string;
  archived_by: number;
  archived_by_name: string | null;
}

export interface ReportRecord {
  report_id: number;
  report_type: ReportType;
  generated_by: number;
  generated_by_name: string | null;
  generated_date: string;
  details: string | null;
  status: ReportStatus;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_date: string | null;
}

export interface PlayerStatistics {
  total_sessions: number;
  present_count: number;
  late_count: number;
  attendance_rate: number;
  participation_count: number;
  average_rating: number | null;
  feedback_count: number;
}

export interface CoachAnalytics {
  total_players: number;
  total_activities: number;
  attendance_rate: number;
  average_rating: number | null;
  participation_by_activity: { activity_name: string; participants: number }[];
}

export interface AdminAnalytics {
  total_players: number;
  total_coaches: number;
  total_activities: number;
  attendance_rate: number;
  average_rating: number | null;
}

export interface SystemStatistics {
  total_users: number;
  total_players: number;
  total_coaches: number;
  total_admins: number;
  active_users: number;
  total_activities: number;
  total_attendance_records: number;
  total_reports: number;
  pending_reports: number;
  archived_records: number;
}

export interface PlayerHealthOverview {
  counts: { healthy: number; injured: number; recovering: number };
  players: (PlayerProfile & { latest_reported_date: string | null; latest_injury_type: string | null })[];
}
