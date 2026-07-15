import { useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { AddUserModal } from './components/modals/AddUserModal';
import { GenerateReportModal } from './components/modals/GenerateReportModal';
import { ViewDetailModal } from './components/modals/ViewDetailModal';
import { ConfirmDialog } from './components/modals/ConfirmDialog';
import { Dashboard, type ChartBar, type StatCard } from './pages/Dashboard';
import { UsersPage, type UserRow } from './pages/UsersPage';
import { PlayersPage, type PlayerRow } from './pages/PlayersPage';
import { AttendancePage, type SessionRow } from './pages/AttendancePage';
import { ReportsPage, type ReportRow } from './pages/ReportsPage';
import { ArchivePage, type ArchiveRow } from './pages/ArchivePage';
import { SettingsPage } from './pages/SettingsPage';
import { SPORTS, makeArchive, makePlayers, makeReports, makeSessions, makeUsers } from './data';
import {
  ActivitiesIcon,
  ArchiveIcon,
  AttendanceIcon,
  CoachesIcon,
  PlayersIcon,
  ReportsIcon,
  SessionsIcon,
  UsersIcon,
} from './icons';
import type {
  AddUserForm,
  ArchiveItem,
  ConfirmDialogState,
  GenReportForm,
  Page,
  Report,
  SortDir,
  UserRole,
  ViewDialogState,
} from './types';

const PAGE_SIZE = 6;

const PAGE_TITLES: Record<Page, [string, string]> = {
  dashboard: ['Dashboard', 'Overview of players, coaches and activity across the program'],
  users: ['User management', 'Manage administrator, coach and staff accounts'],
  players: ['Player management', 'View and manage varsity athlete records'],
  attendance: ['Attendance', 'Session-by-session attendance records'],
  reports: ['Reports & analytics', 'Generate and export program reports'],
  archive: ['Archive', 'Restore or permanently remove archived records'],
  settings: ['Settings', 'Account and system configuration'],
};

function sortList<T>(list: T[], key: keyof T, dir: SortDir): T[] {
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
    return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

function arrow(sort: string, dir: SortDir, key: string) {
  return sort === key ? (dir === 'asc' ? '▲' : '▼') : '';
}

const CHART_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHART_ACTIVITIES = [14, 18, 12, 20, 16, 9, 7];
const CHART_RATES = [88, 92, 79, 95, 90, 70, 60];

export default function App() {
  const [page, setPageState] = useState<Page>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState(makeUsers);
  const [players, setPlayers] = useState(makePlayers);
  const [sessions] = useState(makeSessions);
  const [reports, setReports] = useState<Report[]>(makeReports);
  const [archived, setArchived] = useState<ArchiveItem[]>(makeArchive);

  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('all');
  const [usersSort, setUsersSort] = useState<'name' | 'role' | 'lastActive'>('name');
  const [usersSortDir, setUsersSortDir] = useState<SortDir>('asc');
  const [usersSelected, setUsersSelected] = useState<string[]>([]);
  const [usersPage, setUsersPage] = useState(1);

  const [playersSearch, setPlayersSearch] = useState('');
  const [playersSportFilter, setPlayersSportFilter] = useState('all');
  const [playersSort, setPlayersSort] = useState<'name' | 'attendance'>('name');
  const [playersSortDir, setPlayersSortDir] = useState<SortDir>('asc');
  const [playersSelected, setPlayersSelected] = useState<string[]>([]);
  const [playersPage, setPlayersPage] = useState(1);

  const [attendanceSportFilter, setAttendanceSportFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('all');

  const [reportsSportFilter, setReportsSportFilter] = useState('all');
  const [reportsDateFilter, setReportsDateFilter] = useState('all');

  const [archiveTypeFilter, setArchiveTypeFilter] = useState('all');

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState<AddUserForm>({ name: '', email: '', role: 'Coach' });

  const [genReportOpen, setGenReportOpen] = useState(false);
  const [genReportForm, setGenReportForm] = useState<GenReportForm>({ name: '', format: 'PDF' });

  const [viewDialog, setViewDialog] = useState<ViewDialogState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function setPage(p: Page) {
    setPageState(p);
    setProfileOpen(false);
    setNotifOpen(false);
    setSidebarOpen(false);
  }

  function closeMenus() {
    if (profileOpen || notifOpen) {
      setProfileOpen(false);
      setNotifOpen(false);
    }
  }

  const logout = () => showToast('Logged out (demo)');

  const [pageTitle, pageSubtitle] = PAGE_TITLES[page];

  // ---- USERS ----
  let filteredUsers = users.filter(
    (u) =>
      (usersRoleFilter === 'all' || u.role === usersRoleFilter) &&
      (u.name.toLowerCase().includes(usersSearch.toLowerCase()) || u.email.toLowerCase().includes(usersSearch.toLowerCase())),
  );
  filteredUsers = sortList(filteredUsers, usersSort, usersSortDir);
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const usersPageClamped = Math.min(usersPage, usersTotalPages);
  const usersPageSlice = filteredUsers.slice((usersPageClamped - 1) * PAGE_SIZE, usersPageClamped * PAGE_SIZE);
  const pagedUsers: UserRow[] = usersPageSlice.map((u) => ({
    ...u,
    selected: usersSelected.includes(u.id),
    statusTagClass: u.status === 'Active' ? 'tag tag-accent' : 'tag tag-neutral',
    onToggle: () => setUsersSelected((prev) => (prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id])),
    onView: () =>
      setViewDialog({
        title: u.name,
        rows: [
          { k: 'Email', v: u.email },
          { k: 'Role', v: u.role },
          { k: 'Status', v: u.status },
          { k: 'Last active', v: u.lastActive },
        ],
      }),
    onArchive: () =>
      setConfirmDialog({
        title: 'Archive user?',
        body: `Move ${u.name} to the archive. They will lose access immediately.`,
        confirmLabel: 'Archive',
        run: () => {
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
          setArchived((prev) => [{ id: 'arc' + Date.now(), name: u.name, type: 'User', archivedOn: 'Jul 14, 2026', archivedBy: 'Dana Whitfield' }, ...prev]);
          showToast(`${u.name} archived`);
        },
      }),
    onDelete: () =>
      setConfirmDialog({
        title: 'Delete user?',
        body: `Permanently delete ${u.name}. This cannot be undone.`,
        confirmLabel: 'Delete',
        run: () => {
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
          showToast(`${u.name} deleted`);
        },
      }),
  }));
  const allUsersSelected = usersPageSlice.length > 0 && usersPageSlice.every((u) => usersSelected.includes(u.id));
  const toggleAllUsers = () => {
    const ids = usersPageSlice.map((u) => u.id);
    const allSel = ids.every((id) => usersSelected.includes(id));
    setUsersSelected((prev) => (allSel ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };
  const archiveSelectedUsers = () => {
    const names = users.filter((u) => usersSelected.includes(u.id)).map((u) => u.name);
    setUsers((prev) => prev.filter((u) => !usersSelected.includes(u.id)));
    setArchived((prev) => [
      ...names.map((n) => ({ id: 'arc' + Date.now() + n, name: n, type: 'User' as const, archivedOn: 'Jul 14, 2026', archivedBy: 'Dana Whitfield' })),
      ...prev,
    ]);
    setUsersSelected([]);
    showToast(`${names.length} user(s) archived`);
  };
  const submitAddUser = () => {
    if (!addUserForm.name.trim()) return;
    const nu = { id: 'u' + Date.now(), name: addUserForm.name, email: addUserForm.email || '—', role: addUserForm.role, status: 'Active' as const, lastActive: 'Just now' };
    setUsers((prev) => [nu, ...prev]);
    setAddUserOpen(false);
    showToast(`${nu.name} added`);
  };

  // ---- PLAYERS ----
  let filteredPlayers = players.filter(
    (p) => (playersSportFilter === 'all' || p.sport === playersSportFilter) && p.name.toLowerCase().includes(playersSearch.toLowerCase()),
  );
  filteredPlayers = sortList(filteredPlayers, playersSort, playersSortDir);
  const playersTotalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const playersPageClamped = Math.min(playersPage, playersTotalPages);
  const playersPageSlice = filteredPlayers.slice((playersPageClamped - 1) * PAGE_SIZE, playersPageClamped * PAGE_SIZE);
  const pagedPlayers: PlayerRow[] = playersPageSlice.map((p) => ({
    ...p,
    selected: playersSelected.includes(p.id),
    statusTagClass: p.status === 'Active' ? 'tag tag-accent' : 'tag tag-neutral',
    attendanceTagClass: p.attendance >= 90 ? 'tag tag-neutral' : p.attendance >= 76 ? 'tag tag-outline' : 'tag tag-accent',
    onToggle: () => setPlayersSelected((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id])),
    onView: () =>
      setViewDialog({
        title: p.name,
        rows: [
          { k: 'Sport', v: p.sport },
          { k: 'Year', v: p.year },
          { k: 'Coach', v: p.coach },
          { k: 'Attendance', v: p.attendance + '%' },
          { k: 'Status', v: p.status },
        ],
      }),
    onArchive: () =>
      setConfirmDialog({
        title: 'Archive player?',
        body: `Move ${p.name} to the archive.`,
        confirmLabel: 'Archive',
        run: () => {
          setPlayers((prev) => prev.filter((x) => x.id !== p.id));
          setArchived((prev) => [{ id: 'arc' + Date.now(), name: p.name, type: 'Player', archivedOn: 'Jul 14, 2026', archivedBy: 'Dana Whitfield' }, ...prev]);
          showToast(`${p.name} archived`);
        },
      }),
    onDelete: () =>
      setConfirmDialog({
        title: 'Delete player?',
        body: `Permanently delete ${p.name}. This cannot be undone.`,
        confirmLabel: 'Delete',
        run: () => {
          setPlayers((prev) => prev.filter((x) => x.id !== p.id));
          showToast(`${p.name} deleted`);
        },
      }),
  }));
  const allPlayersSelected = playersPageSlice.length > 0 && playersPageSlice.every((p) => playersSelected.includes(p.id));
  const toggleAllPlayers = () => {
    const ids = playersPageSlice.map((p) => p.id);
    const allSel = ids.every((id) => playersSelected.includes(id));
    setPlayersSelected((prev) => (allSel ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };
  const archiveSelectedPlayers = () => {
    const names = players.filter((p) => playersSelected.includes(p.id)).map((p) => p.name);
    setPlayers((prev) => prev.filter((p) => !playersSelected.includes(p.id)));
    setArchived((prev) => [
      ...names.map((n) => ({ id: 'arc' + Date.now() + n, name: n, type: 'Player' as const, archivedOn: 'Jul 14, 2026', archivedBy: 'Dana Whitfield' })),
      ...prev,
    ]);
    setPlayersSelected([]);
    showToast(`${names.length} player(s) archived`);
  };

  // ---- SESSIONS ----
  const filteredSessions: SessionRow[] = sessions
    .filter((sn) => attendanceSportFilter === 'all' || sn.sport === attendanceSportFilter)
    .map((sn) => ({ ...sn, rateTagClass: sn.rate >= 90 ? 'tag tag-neutral' : sn.rate >= 75 ? 'tag tag-outline' : 'tag tag-accent' }));

  // ---- REPORTS ----
  const filteredReports: ReportRow[] = reports
    .filter((r) => reportsSportFilter === 'all' || r.sport === reportsSportFilter || r.sport === 'All sports')
    .map((r) => ({
      ...r,
      tagClass: r.status === 'Ready' ? 'tag tag-accent' : 'tag tag-outline',
      onExportPdf: () => showToast(`Exported "${r.name}" as PDF`),
      onExportCsv: () => showToast(`Exported "${r.name}" as CSV`),
    }));
  const recentReports = reports.slice(0, 5).map((r) => ({ ...r, tagClass: r.status === 'Ready' ? 'tag tag-accent' : 'tag tag-outline' }));
  const openGenerateReport = () => {
    setGenReportForm({ name: '', format: 'PDF' });
    setGenReportOpen(true);
  };
  const submitGenerateReport = () => {
    const name = genReportForm.name.trim() || 'Untitled report';
    setReports((prev) => [{ id: 'rp' + Date.now(), name, sport: 'All sports', range: 'Custom', generatedOn: 'Jul 14, 2026', status: 'Ready' }, ...prev]);
    setGenReportOpen(false);
    showToast(`"${name}" generated (${genReportForm.format})`);
  };

  // ---- ARCHIVE ----
  const filteredArchive: ArchiveRow[] = archived
    .filter((a) => archiveTypeFilter === 'all' || a.type === archiveTypeFilter)
    .map((a) => ({
      ...a,
      onRestore: () => {
        setArchived((prev) => prev.filter((x) => x.id !== a.id));
        showToast(`${a.name} restored`);
      },
      onDeleteForever: () =>
        setConfirmDialog({
          title: 'Delete permanently?',
          body: `This will permanently remove "${a.name}" from ACTIBASE. This cannot be undone.`,
          confirmLabel: 'Delete forever',
          run: () => {
            setArchived((prev) => prev.filter((x) => x.id !== a.id));
            showToast(`${a.name} permanently deleted`);
          },
        }),
    }));

  // ---- DASHBOARD ----
  const totalAttendanceRecords = sessions.reduce((sum, x) => sum + x.total, 0);
  const totalActivities = sessions.reduce((sum, x) => sum + x.activities, 0);
  const statCards: StatCard[] = [
    { label: 'Total Players', value: players.length, Icon: PlayersIcon, onView: () => setPage('players') },
    { label: 'Total Coaches', value: users.filter((u) => u.role === 'Coach').length, Icon: CoachesIcon, onView: () => setPage('users') },
    { label: 'Total Activities', value: totalActivities, Icon: ActivitiesIcon, onView: () => setPage('attendance') },
    { label: 'Total Attendance Records', value: totalAttendanceRecords, Icon: AttendanceIcon, onView: () => setPage('attendance') },
    { label: 'Total Training Sessions', value: sessions.length, Icon: SessionsIcon, onView: () => setPage('attendance') },
    { label: 'Active Users', value: users.filter((u) => u.status === 'Active').length, Icon: UsersIcon, onView: () => setPage('users') },
    { label: 'Archived Records', value: archived.length, Icon: ArchiveIcon, onView: () => setPage('archive') },
    { label: 'Recent Reports', value: reports.length, Icon: ReportsIcon, onView: () => setPage('reports') },
  ];
  const chartBars: ChartBar[] = CHART_DAYS.map((day, i) => {
    const x = i * 78 + 4;
    const h1 = CHART_ACTIVITIES[i] * 7;
    const h2 = CHART_RATES[i] * 1.5;
    return { day, x, x2: x + 28, y1: 180 - h1, h1, y2: 180 - h2, h2, lx: x + 27 };
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)', fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}>
      <Sidebar page={page} open={sidebarOpen} onNavigate={setPage} onLogout={logout} />
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflowY: 'auto' }}>
        <Topbar
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          notifOpen={notifOpen}
          profileOpen={profileOpen}
          onToggleMenu={() => setSidebarOpen((v) => !v)}
          onToggleNotif={(e) => {
            e.stopPropagation();
            setNotifOpen((v) => !v);
            setProfileOpen(false);
          }}
          onToggleProfile={(e) => {
            e.stopPropagation();
            setProfileOpen((v) => !v);
            setNotifOpen(false);
          }}
          onAccountSettings={() => setPage('settings')}
          onLogout={logout}
        />

        <main style={{ flex: 1, padding: '28px 32px 60px', minWidth: 0 }} onClick={closeMenus}>
          {page === 'dashboard' && (
            <Dashboard statCards={statCards} chartBars={chartBars} recentReports={recentReports} onGoReports={() => setPage('reports')} />
          )}

          {page === 'users' && (
            <UsersPage
              search={usersSearch}
              onSearchChange={(v) => {
                setUsersSearch(v);
                setUsersPage(1);
              }}
              roleFilter={usersRoleFilter}
              onRoleFilterChange={(v) => {
                setUsersRoleFilter(v);
                setUsersPage(1);
              }}
              hasSelected={usersSelected.length > 0}
              selectedCount={usersSelected.length}
              onArchiveSelected={archiveSelectedUsers}
              onOpenAddUser={() => {
                setAddUserForm({ name: '', email: '', role: 'Coach' });
                setAddUserOpen(true);
              }}
              allSelected={allUsersSelected}
              onToggleAll={toggleAllUsers}
              onSortByName={() => {
                setUsersSort('name');
                setUsersSortDir(usersSort === 'name' && usersSortDir === 'asc' ? 'desc' : 'asc');
              }}
              onSortByRole={() => {
                setUsersSort('role');
                setUsersSortDir(usersSort === 'role' && usersSortDir === 'asc' ? 'desc' : 'asc');
              }}
              onSortByLast={() => {
                setUsersSort('lastActive');
                setUsersSortDir(usersSort === 'lastActive' && usersSortDir === 'asc' ? 'desc' : 'asc');
              }}
              sortArrows={{
                name: arrow(usersSort, usersSortDir, 'name'),
                role: arrow(usersSort, usersSortDir, 'role'),
                lastActive: arrow(usersSort, usersSortDir, 'lastActive'),
              }}
              pagedUsers={pagedUsers}
              pageLabel={`Page ${usersPageClamped} of ${usersTotalPages} · ${filteredUsers.length} users`}
              onFirstPageDisabled={usersPageClamped <= 1}
              onLastPageDisabled={usersPageClamped >= usersTotalPages}
              onPrevPage={() => setUsersPage(Math.max(1, usersPageClamped - 1))}
              onNextPage={() => setUsersPage(Math.min(usersTotalPages, usersPageClamped + 1))}
            />
          )}

          {page === 'players' && (
            <PlayersPage
              search={playersSearch}
              onSearchChange={(v) => {
                setPlayersSearch(v);
                setPlayersPage(1);
              }}
              sportFilter={playersSportFilter}
              onSportFilterChange={(v) => {
                setPlayersSportFilter(v);
                setPlayersPage(1);
              }}
              sportOptions={SPORTS}
              hasSelected={playersSelected.length > 0}
              selectedCount={playersSelected.length}
              onArchiveSelected={archiveSelectedPlayers}
              allSelected={allPlayersSelected}
              onToggleAll={toggleAllPlayers}
              onSortByName={() => {
                setPlayersSort('name');
                setPlayersSortDir(playersSort === 'name' && playersSortDir === 'asc' ? 'desc' : 'asc');
              }}
              onSortByAttendance={() => {
                setPlayersSort('attendance');
                setPlayersSortDir(playersSort === 'attendance' && playersSortDir === 'asc' ? 'desc' : 'asc');
              }}
              sortArrows={{
                name: arrow(playersSort, playersSortDir, 'name'),
                attendance: arrow(playersSort, playersSortDir, 'attendance'),
              }}
              pagedPlayers={pagedPlayers}
              pageLabel={`Page ${playersPageClamped} of ${playersTotalPages} · ${filteredPlayers.length} players`}
              onFirstPageDisabled={playersPageClamped <= 1}
              onLastPageDisabled={playersPageClamped >= playersTotalPages}
              onPrevPage={() => setPlayersPage(Math.max(1, playersPageClamped - 1))}
              onNextPage={() => setPlayersPage(Math.min(playersTotalPages, playersPageClamped + 1))}
            />
          )}

          {page === 'attendance' && (
            <AttendancePage
              sportFilter={attendanceSportFilter}
              onSportFilterChange={setAttendanceSportFilter}
              sportOptions={SPORTS}
              dateAllChecked={attendanceDateFilter === 'all'}
              dateWeekChecked={attendanceDateFilter === 'week'}
              onDateAll={() => setAttendanceDateFilter('all')}
              onDateWeek={() => setAttendanceDateFilter('week')}
              filteredSessions={filteredSessions}
            />
          )}

          {page === 'reports' && (
            <ReportsPage
              sportFilter={reportsSportFilter}
              onSportFilterChange={setReportsSportFilter}
              sportOptions={SPORTS}
              dateFilter={reportsDateFilter}
              onDateFilterChange={setReportsDateFilter}
              onOpenGenerateReport={openGenerateReport}
              filteredReports={filteredReports}
            />
          )}

          {page === 'archive' && (
            <ArchivePage
              allChecked={archiveTypeFilter === 'all'}
              playerChecked={archiveTypeFilter === 'Player'}
              userChecked={archiveTypeFilter === 'User'}
              sessionChecked={archiveTypeFilter === 'Session'}
              onFilterAll={() => setArchiveTypeFilter('all')}
              onFilterPlayer={() => setArchiveTypeFilter('Player')}
              onFilterUser={() => setArchiveTypeFilter('User')}
              onFilterSession={() => setArchiveTypeFilter('Session')}
              filteredArchive={filteredArchive}
            />
          )}

          {page === 'settings' && <SettingsPage />}
        </main>
      </div>

      {addUserOpen && (
        <AddUserModal
          form={addUserForm}
          onClose={() => setAddUserOpen(false)}
          onNameChange={(v) => setAddUserForm((prev) => ({ ...prev, name: v }))}
          onEmailChange={(v) => setAddUserForm((prev) => ({ ...prev, email: v }))}
          onRoleChange={(v: UserRole) => setAddUserForm((prev) => ({ ...prev, role: v }))}
          onSubmit={submitAddUser}
        />
      )}

      {genReportOpen && (
        <GenerateReportModal
          form={genReportForm}
          onClose={() => setGenReportOpen(false)}
          onNameChange={(v) => setGenReportForm((prev) => ({ ...prev, name: v }))}
          onFormatChange={(v) => setGenReportForm((prev) => ({ ...prev, format: v }))}
          onSubmit={submitGenerateReport}
        />
      )}

      {viewDialog && <ViewDetailModal data={viewDialog} onClose={() => setViewDialog(null)} />}

      {confirmDialog && (
        <ConfirmDialog
          data={confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.run();
            setConfirmDialog(null);
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
