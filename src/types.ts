export type Page =
  | 'dashboard'
  | 'users'
  | 'players'
  | 'attendance'
  | 'reports'
  | 'archive'
  | 'settings';

export type UserRole = 'Admin' | 'Coach' | 'Staff';
export type Status = 'Active' | 'Inactive';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: Status;
  lastActive: string;
}

export interface Player {
  id: string;
  name: string;
  sport: string;
  year: string;
  coach: string;
  attendance: number;
  status: Status;
}

export interface Session {
  id: string;
  date: string;
  sport: string;
  session: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
  activities: number;
}

export type ReportStatus = 'Ready' | 'Generating';

export interface Report {
  id: string;
  name: string;
  sport: string;
  range: string;
  generatedOn: string;
  status: ReportStatus;
}

export type ArchiveType = 'Player' | 'User' | 'Session';

export interface ArchiveItem {
  id: string;
  name: string;
  type: ArchiveType;
  archivedOn: string;
  archivedBy: string;
}

export interface AddUserForm {
  name: string;
  email: string;
  role: UserRole;
}

export interface GenReportForm {
  name: string;
  format: 'PDF' | 'CSV';
}

export interface ViewDialogState {
  title: string;
  rows: { k: string; v: string }[];
}

export interface ConfirmDialogState {
  title: string;
  body: string;
  confirmLabel: string;
  run: () => void;
}

export type SortDir = 'asc' | 'desc';
