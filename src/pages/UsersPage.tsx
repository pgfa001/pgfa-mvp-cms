import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { rememberAdminClub, useAuth } from '../context/auth-context';
import {
  createClubAdmin,
  getClubDetailsById,
  getClubs,
} from '../api/clubs';
import type {
  CreateClubAdminRequest,
} from '../api/clubs';
import { getTeams } from '../api/teams';
import type { TeamResponse } from '../api/teams';
import {
  createCmsUser,
  createSuperAdmin,
  deleteUser,
  grantManualPremium,
  resetUserPassword,
  revokeManualPremium,
  searchUsers,
  updateUserClub,
  updateUserTeams,
  updateUserUsername,
} from '../api/users';
import type {
  CmsCreatableUserRole,
  CreateCmsChildAthleteRequest,
  CreateCmsUserRequest,
  CreateSuperAdminRequest,
  ResetUserPasswordResponse,
  UserManagementResponse,
  UserSearchResult,
} from '../api/users';
import { ApiError } from '../api/client';
import type { UserRole } from '../types/api';

type AdminFormState = CreateClubAdminRequest & {
  clubId: string;
};

type ClubOption = {
  id: string;
  name: string;
};

type UserActionMode = 'username' | 'club' | 'teams' | 'delete';

type PremiumModalMode = 'grant' | 'revoke';

type SearchFormState = {
  query: string;
  clubId: string;
  role: '' | UserRole;
  limit: number;
};

type SuperAdminFormState = CreateSuperAdminRequest;

type ChildAthleteFormState = CreateCmsChildAthleteRequest;

type CmsUserFormState = {
  clubId: string;
  name: string;
  username: string;
  password: string;
  role: CmsCreatableUserRole;
  dob: string;
  email: string;
  phone: string;
  gender: string;
  position: string;
  teamIds: string[];
  childAccounts: ChildAthleteFormState[];
};

const userRoleOptions: UserRole[] = [
  'ATHLETE',
  'PARENT',
  'COACH',
  'ADMIN',
  'SUPERADMIN',
];

const searchLimitOptions = [10, 25, 50] as const;

const cmsCreatableRoles: CmsCreatableUserRole[] = [
  'ATHLETE',
  'COACH',
  'PARENT',
];

function emptyAdminForm(): AdminFormState {
  return {
    clubId: '',
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    dob: '',
    clubIds: [],
  };
}

function emptySearchForm(): SearchFormState {
  return {
    query: '',
    clubId: '',
    role: '',
    limit: 10,
  };
}

function emptySuperAdminForm(): SuperAdminFormState {
  return {
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    state: '',
    town: '',
    socialMediaHandle: '',
  };
}

function emptyChildAthleteForm(): ChildAthleteFormState {
  return {
    name: '',
    username: '',
    password: '',
    dob: '',
    gender: '',
    position: '',
    teamIds: [],
  };
}

function emptyCmsUserForm(): CmsUserFormState {
  return {
    clubId: '',
    name: '',
    username: '',
    password: '',
    role: 'ATHLETE',
    dob: '',
    email: '',
    phone: '',
    gender: '',
    position: '',
    teamIds: [],
    childAccounts: [emptyChildAthleteForm()],
  };
}

function formatTimestamp(timestamp?: number | null) {
  if (!timestamp) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function timestampToDateTimeInput(timestamp?: number | null) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function dateTimeInputToTimestamp(value: string) {
  if (!value) return undefined;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function validateAdminForm(form: AdminFormState): AdminFormState {
  if (!form.clubId) throw new Error('Select a club.');
  if (!form.name.trim()) throw new Error('Name is required.');
  if (!form.username.trim()) throw new Error('Username is required.');
  if (!form.password) throw new Error('Password is required.');
  if (!form.email.trim()) throw new Error('Email is required.');
  if (!form.phone.trim()) throw new Error('Phone is required.');
  if (!form.dob) throw new Error('Date of birth is required.');

  return {
    clubId: form.clubId,
    name: form.name.trim(),
    username: form.username.trim(),
    password: form.password,
    email: form.email.trim(),
    phone: form.phone.trim(),
    dob: form.dob,
    clubIds: form.clubIds?.filter((clubId) => clubId !== form.clubId) ?? [],
  };
}

function validateSuperAdminForm(form: SuperAdminFormState): SuperAdminFormState {
  if (!form.name.trim()) throw new Error('Name is required.');
  if (!form.username.trim()) throw new Error('Username is required.');
  if (!form.password) throw new Error('Password is required.');
  if (!form.email.trim()) throw new Error('Email is required.');
  if (!form.phone.trim()) throw new Error('Phone is required.');
  if (!form.dob.trim()) throw new Error('Date of birth is required.');
  if (!form.gender.trim()) throw new Error('Gender is required.');
  if (!form.state.trim()) throw new Error('State is required.');
  if (!form.town.trim()) throw new Error('Town is required.');

  return {
    name: form.name.trim(),
    username: form.username.trim(),
    password: form.password,
    email: form.email.trim(),
    phone: form.phone.trim(),
    dob: form.dob.trim(),
    gender: form.gender.trim(),
    state: form.state.trim(),
    town: form.town.trim(),
    socialMediaHandle: form.socialMediaHandle.trim(),
  };
}

function validateChildAthleteForm(
  form: ChildAthleteFormState,
  index: number
): ChildAthleteFormState {
  const label = `Child ${index + 1}`;

  if (!form.name.trim()) throw new Error(`${label} name is required.`);
  if (!form.username.trim()) throw new Error(`${label} username is required.`);
  if (!form.password) throw new Error(`${label} password is required.`);
  if (!form.dob.trim()) throw new Error(`${label} date of birth is required.`);
  if (!form.gender.trim()) throw new Error(`${label} gender is required.`);
  if (!form.position.trim()) throw new Error(`${label} position is required.`);
  if (form.teamIds.length !== 1) {
    throw new Error(`${label} must be assigned to exactly one team.`);
  }

  return {
    name: form.name.trim(),
    username: form.username.trim(),
    password: form.password,
    dob: form.dob.trim(),
    gender: form.gender.trim(),
    position: form.position.trim(),
    teamIds: form.teamIds,
  };
}

function validateCmsUserForm(form: CmsUserFormState): CreateCmsUserRequest {
  if (!form.clubId) throw new Error('Select a club.');
  if (!form.name.trim()) throw new Error('Name is required.');
  if (!form.username.trim()) throw new Error('Username is required.');
  if (!form.password) throw new Error('Password is required.');
  if (!form.dob.trim()) throw new Error('Date of birth is required.');

  const base = {
    clubId: form.clubId,
    name: form.name.trim(),
    username: form.username.trim(),
    password: form.password,
    role: form.role,
    dob: form.dob.trim(),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
  };

  if (form.role === 'ATHLETE') {
    if (!form.gender.trim()) throw new Error('Gender is required.');
    if (!form.position.trim()) throw new Error('Position is required.');
    if (form.teamIds.length !== 1) {
      throw new Error('Athletes must be assigned to exactly one team.');
    }

    return {
      ...base,
      role: 'ATHLETE',
      gender: form.gender.trim(),
      position: form.position.trim(),
      teamIds: form.teamIds,
    };
  }

  if (form.role === 'COACH') {
    if (!form.teamIds.length) {
      throw new Error('Select at least one team for the coach.');
    }

    return {
      ...base,
      role: 'COACH',
      teamIds: form.teamIds,
    };
  }

  if (!form.childAccounts.length) {
    throw new Error('Add at least one child athlete.');
  }

  return {
    ...base,
    role: 'PARENT',
    childAccounts: form.childAccounts.map(validateChildAthleteForm),
  };
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === 'string') return toStringArray(item);
        if (
          item &&
          typeof item === 'object' &&
          'id' in item &&
          typeof item.id === 'string'
        ) {
          return item.id.trim();
        }
        if (
          item &&
          typeof item === 'object' &&
          'teamId' in item &&
          typeof item.teamId === 'string'
        ) {
          return item.teamId.trim();
        }
        if (
          item &&
          typeof item === 'object' &&
          'team_id' in item &&
          typeof item.team_id === 'string'
        ) {
          return item.team_id.trim();
        }
        return [];
      })
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      return toStringArray(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  return trimmed.includes(',')
    ? trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    : [trimmed];
}

function normalizeUserSearchResult(user: UserSearchResult): UserSearchResult {
  const clubIds = [
    ...toStringArray(user.clubIds),
    ...toStringArray(user.clubId),
    ...toStringArray(user.club_id),
    ...toStringArray(user.club_ids),
    ...toStringArray(user.clubs),
  ];
  const teamIds = [
    ...toStringArray(user.teamIds),
    ...toStringArray(user.teamId),
    ...toStringArray(user.team_id),
    ...toStringArray(user.team_ids),
    ...toStringArray(user.teams),
  ];

  return {
    ...user,
    clubIds: Array.from(new Set(clubIds)),
    teamIds: Array.from(new Set(teamIds)),
  };
}

export default function UsersPage() {
  const { auth, logout } = useAuth();
  const isSuperAdmin = auth?.role === 'SUPERADMIN';
  const isAdmin = auth?.role === 'ADMIN';
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [form, setForm] = useState<AdminFormState>(emptyAdminForm());
  const [superAdminForm, setSuperAdminForm] = useState<SuperAdminFormState>(
    emptySuperAdminForm()
  );
  const [cmsUserForm, setCmsUserForm] = useState<CmsUserFormState>(
    emptyCmsUserForm()
  );
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [saving, setSaving] = useState(false);
  const [superAdminSaving, setSuperAdminSaving] = useState(false);
  const [cmsUserSaving, setCmsUserSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [superAdminError, setSuperAdminError] = useState<string | null>(null);
  const [superAdminSuccess, setSuperAdminSuccess] = useState<string | null>(null);
  const [cmsUserError, setCmsUserError] = useState<string | null>(null);
  const [cmsUserSuccess, setCmsUserSuccess] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState<SearchFormState>(
    emptySearchForm()
  );
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [canResetPasswords, setCanResetPasswords] = useState(true);
  const [resetTarget, setResetTarget] = useState<UserSearchResult | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetFieldError, setResetFieldError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] =
    useState<ResetUserPasswordResponse | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [premiumTarget, setPremiumTarget] = useState<UserSearchResult | null>(null);
  const [premiumMode, setPremiumMode] = useState<PremiumModalMode>('grant');
  const [premiumReason, setPremiumReason] = useState('');
  const [premiumExpiresAt, setPremiumExpiresAt] = useState('');
  const [premiumSaving, setPremiumSaving] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<UserActionMode | null>(null);
  const [actionTarget, setActionTarget] = useState<UserSearchResult | null>(null);
  const [usernameValue, setUsernameValue] = useState('');
  const [clubValue, setClubValue] = useState('');
  const [clubValues, setClubValues] = useState<string[]>([]);
  const [teamValues, setTeamValues] = useState<string[]>([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [managementMessage, setManagementMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUserManagementOptions = async () => {
      if (!auth?.token) return;

      try {
        setLoadingClubs(true);
        setLoadingTeams(isSuperAdmin);
        setPageError(null);

        if (isSuperAdmin) {
          const [clubsResponse, teamsResponse] = await Promise.all([
            getClubs(auth.token),
            getTeams(auth.token),
          ]);

          setClubs(
            clubsResponse.clubs.map((club) => ({ id: club.id, name: club.name }))
          );
          setTeams(teamsResponse.teams);

          if (clubsResponse.clubs.length === 1) {
            setForm((current) => ({
              ...current,
              clubId: clubsResponse.clubs[0].id,
            }));
          }
          return;
        }

        if (isAdmin && auth.clubId) {
          const club = await getClubDetailsById(auth.clubId);
          setClubs([{ id: club.id, name: club.name }]);
          setTeams([]);
          setSearchForm((current) => ({ ...current, clubId: club.id }));
          return;
        }

        setClubs([]);
        setTeams([]);
        setPageError('No assigned club was returned for this account.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load clubs.';
        setPageError(message);
      } finally {
        setLoadingClubs(false);
        setLoadingTeams(false);
      }
    };

    loadUserManagementOptions();
  }, [auth?.token, auth?.clubId, isAdmin, isSuperAdmin]);

  const submitAdmin = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth?.token) return;

    try {
      setSaving(true);
      setPageError(null);
      setSuccessMessage(null);

      const payload = validateAdminForm(form);
      const selectedClub = clubs.find((club) => club.id === payload.clubId);

      await createClubAdmin(auth.token, payload.clubId, {
        name: payload.name,
        username: payload.username,
        password: payload.password,
        email: payload.email,
        phone: payload.phone,
        dob: payload.dob,
        clubIds: payload.clubIds,
      });

      if (selectedClub) {
        rememberAdminClub(payload.username, selectedClub.id, selectedClub.name);
      }

      setForm({
        ...emptyAdminForm(),
        clubId: clubs.length === 1 ? clubs[0].id : '',
      });
      setSuccessMessage(
        `Created admin account for ${selectedClub?.name ?? 'selected club'}.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create admin user.';
      setPageError(message);
    } finally {
      setSaving(false);
    }
  };

  const submitSuperAdmin = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth?.token) return;

    try {
      setSuperAdminSaving(true);
      setSuperAdminError(null);
      setSuperAdminSuccess(null);

      const payload = validateSuperAdminForm(superAdminForm);
      const created = await createSuperAdmin(auth.token, payload);

      setSuperAdminForm(emptySuperAdminForm());
      setSuperAdminSuccess(`Created superadmin account for ${created.username}.`);

      if (!searchForm.role || searchForm.role === 'SUPERADMIN') {
        setSearchResults((current) => [
          normalizeUserSearchResult(created),
          ...current,
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create superadmin user.';
      setSuperAdminError(message);
    } finally {
      setSuperAdminSaving(false);
    }
  };

  const submitCmsUser = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth?.token) return;

    try {
      setCmsUserSaving(true);
      setCmsUserError(null);
      setCmsUserSuccess(null);

      const payload = validateCmsUserForm(cmsUserForm);
      const created = await createCmsUser(auth.token, payload);

      setCmsUserForm({
        ...emptyCmsUserForm(),
        clubId: clubs.length === 1 ? clubs[0].id : '',
      });
      setCmsUserSuccess(`Created ${created.role} account for ${created.username}.`);

      const normalizedCreated = normalizeUserSearchResult(created);
      const createdClubIds = normalizedCreated.clubIds.length
        ? normalizedCreated.clubIds
        : [payload.clubId];
      const matchesRole = !searchForm.role || searchForm.role === created.role;
      const matchesClub =
        !searchForm.clubId || createdClubIds.includes(searchForm.clubId);

      if (matchesRole && matchesClub) {
        setSearchResults((current) => [
          { ...normalizedCreated, clubIds: createdClubIds },
          ...current,
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create user.';
      setCmsUserError(message);
    } finally {
      setCmsUserSaving(false);
    }
  };

  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth?.token) return;

    try {
      setSearching(true);
      setSearchError(null);
      setManagementMessage(null);
      setHasSearched(true);

      const response = await searchUsers(auth.token, {
        query: searchForm.query,
        clubId: isAdmin ? auth.clubId ?? undefined : searchForm.clubId || undefined,
        role: searchForm.role || undefined,
        limit: searchForm.limit,
      });

      setSearchResults(response.users.map(normalizeUserSearchResult));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to search users.';
      setSearchError(message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getClubNames = (clubIds: string[]) => {
    const names = clubs
      .filter((club) => clubIds.includes(club.id))
      .map((club) => club.name);

    return names.length ? names.join(', ') : '-';
  };

  const getTeamClubName = (team: TeamResponse) => {
    return (
      team.clubName ||
      team.club?.name ||
      clubs.find((club) => club.id === team.clubId)?.name ||
      'Unknown Club'
    );
  };

  const getTeamNames = (teamIds?: string[]) => {
    if (!teamIds?.length) return '-';

    const names = teams
      .filter((team) => teamIds.includes(team.id))
      .map((team) => `${team.name} (${getTeamClubName(team)})`);
    const matchedTeamIds = new Set(
      teams.filter((team) => teamIds.includes(team.id)).map((team) => team.id)
    );
    const unmatchedTeamIds = teamIds.filter((teamId) => !matchedTeamIds.has(teamId));

    return [...names, ...unmatchedTeamIds.map((teamId) => `Unknown team ${teamId}`)]
      .join(', ') || '-';
  };

  const getTeamsForClub = (clubId: string) => {
    return teams.filter((team) => team.clubId === clubId);
  };

  const getTeamsForUserClubs = (user: UserSearchResult) => {
    if (user.clubIds.length) {
      return teams.filter(
        (team) =>
          user.clubIds.includes(team.clubId) || user.teamIds.includes(team.id)
      );
    }

    const assignedTeams = teams.filter((team) => user.teamIds?.includes(team.id));
    const inferredClubIds = new Set(assignedTeams.map((team) => team.clubId));

    return teams.filter((team) => inferredClubIds.has(team.clubId));
  };

  const getUnmatchedTeamIds = (user: UserSearchResult) => {
    const availableTeamIds = new Set(
      getTeamsForUserClubs(user).map((team) => team.id)
    );

    return user.teamIds.filter((teamId) => !availableTeamIds.has(teamId));
  };

  const getSubscriptionStatus = (user: UserSearchResult) => {
    if (user.role !== 'ATHLETE') return '-';
    const subscription = user.subscription;

    if (!subscription || !subscription.hasAccess) return 'No subscription';
    if (subscription.source === 'CLUB_PAID') return 'Active (Club Paid)';
    if (subscription.manualPremiumGranted) return 'Active (Manual Premium)';
    if (subscription.status === 'TRIALING') return 'Trialing';
    if (subscription.status === 'ACTIVE') return 'Active';

    return 'Active';
  };

  const getManualPremiumStatus = (user: UserSearchResult) => {
    if (user.role !== 'ATHLETE') return '-';
    if (!user.subscription?.manualPremiumGranted) return 'Not granted';

    const expiresAt = user.subscription.manualPremiumExpiresAt
      ? `, expires ${formatTimestamp(user.subscription.manualPremiumExpiresAt)}`
      : ', no expiration';
    const reason = user.subscription.manualPremiumReason
      ? ` - ${user.subscription.manualPremiumReason}`
      : '';

    return `Granted${expiresAt}${reason}`;
  };

  const updateCmsUserRole = (role: CmsCreatableUserRole) => {
    setCmsUserForm({
      ...cmsUserForm,
      role,
      gender: '',
      position: '',
      teamIds: [],
      childAccounts:
        role === 'PARENT' ? cmsUserForm.childAccounts : [emptyChildAthleteForm()],
    });
  };

  const updateCmsUserClub = (clubId: string) => {
    setCmsUserForm({
      ...cmsUserForm,
      clubId,
      teamIds: [],
      childAccounts: cmsUserForm.childAccounts.map((child) => ({
        ...child,
        teamIds: [],
      })),
    });
  };

  const toggleCmsUserTeam = (teamId: string) => {
    setCmsUserForm({
      ...cmsUserForm,
      teamIds: cmsUserForm.teamIds.includes(teamId)
        ? cmsUserForm.teamIds.filter((id) => id !== teamId)
        : [...cmsUserForm.teamIds, teamId],
    });
  };

  const updateChildAthlete = (
    index: number,
    next: Partial<ChildAthleteFormState>
  ) => {
    setCmsUserForm({
      ...cmsUserForm,
      childAccounts: cmsUserForm.childAccounts.map((child, childIndex) =>
        childIndex === index ? { ...child, ...next } : child
      ),
    });
  };

  const addChildAthlete = () => {
    setCmsUserForm({
      ...cmsUserForm,
      childAccounts: [...cmsUserForm.childAccounts, emptyChildAthleteForm()],
    });
  };

  const removeChildAthlete = (index: number) => {
    setCmsUserForm({
      ...cmsUserForm,
      childAccounts: cmsUserForm.childAccounts.filter(
        (_child, childIndex) => childIndex !== index
      ),
    });
  };

  const applyManagementResponse = (response: UserManagementResponse) => {
    setSearchResults((current) =>
      current.map((user) =>
        user.id === response.userId
          ? {
              ...user,
              username: response.username,
              clubIds: response.clubIds,
              teamIds: response.teamIds,
            }
          : user
      )
    );
    setManagementMessage(response.message);
  };

  const openUserAction = (mode: UserActionMode, user: UserSearchResult) => {
    const normalizedUser = normalizeUserSearchResult(user);

    setActionMode(mode);
    setActionTarget(normalizedUser);
    setActionError(null);
    setUsernameValue(normalizedUser.username);
    setClubValue(normalizedUser.clubIds[0] ?? '');
    setClubValues([...normalizedUser.clubIds]);
    setTeamValues([...normalizedUser.teamIds]);
  };

  const closeUserAction = () => {
    setActionMode(null);
    setActionTarget(null);
    setActionError(null);
    setUsernameValue('');
    setClubValue('');
    setClubValues([]);
    setTeamValues([]);
  };

  const toggleClubValue = (clubId: string) => {
    setClubValues((current) =>
      current.includes(clubId)
        ? current.filter((id) => id !== clubId)
        : [...current, clubId]
    );
  };

  const toggleTeamValue = (teamId: string) => {
    setTeamValues((current) =>
      current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId]
    );
  };

  const handleUserActionError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      return;
    }

    const message =
      error instanceof Error ? error.message : 'Unable to update user.';
    setActionError(message);
  };

  const submitUsernameUpdate = async () => {
    if (!auth?.token || !actionTarget) return;

    if (!usernameValue.trim()) {
      setActionError('Username is required.');
      return;
    }

    try {
      setActionSaving(true);
      setActionError(null);

      const response = await updateUserUsername(
        auth.token,
        actionTarget.id,
        usernameValue.trim()
      );
      applyManagementResponse(response);
      closeUserAction();
    } catch (error) {
      handleUserActionError(error);
    } finally {
      setActionSaving(false);
    }
  };

  const submitClubUpdate = async () => {
    if (!auth?.token || !actionTarget) return;

    if (actionTarget.role === 'SUPERADMIN') {
      setActionError('Superadmins cannot be assigned to clubs.');
      return;
    }

    if (actionTarget.role === 'ADMIN') {
      if (!clubValues.length) {
        setActionError('Select at least one club.');
        return;
      }
    } else if (!clubValue) {
      setActionError('Select a club.');
      return;
    }

    try {
      setActionSaving(true);
      setActionError(null);

      const response = await updateUserClub(
        auth.token,
        actionTarget.id,
        actionTarget.role === 'ADMIN' ? clubValues : clubValue
      );
      applyManagementResponse(response);
      closeUserAction();
    } catch (error) {
      handleUserActionError(error);
    } finally {
      setActionSaving(false);
    }
  };

  const submitTeamsUpdate = async () => {
    if (!auth?.token || !actionTarget) return;

    if (actionTarget.role === 'ATHLETE' && teamValues.length !== 1) {
      setActionError('Athletes must have exactly one team.');
      return;
    }

    const selectedTeams = teams.filter((team) => teamValues.includes(team.id));
    const selectedClubIds = new Set(selectedTeams.map((team) => team.clubId));
    const availableTeamIds = new Set(
      getTeamsForUserClubs(actionTarget).map((team) => team.id)
    );

    if (selectedClubIds.size > 1) {
      setActionError('Selected teams must belong to the same club.');
      return;
    }

    if (teamValues.some((teamId) => !availableTeamIds.has(teamId))) {
      setActionError("Selected teams must belong to the user's current club.");
      return;
    }

    try {
      setActionSaving(true);
      setActionError(null);

      const response = await updateUserTeams(
        auth.token,
        actionTarget.id,
        teamValues
      );
      applyManagementResponse(response);
      closeUserAction();
    } catch (error) {
      handleUserActionError(error);
    } finally {
      setActionSaving(false);
    }
  };

  const submitDeleteUser = async () => {
    if (!auth?.token || !actionTarget) return;

    try {
      setActionSaving(true);
      setActionError(null);

      const response = await deleteUser(auth.token, actionTarget.id);
      setSearchResults((current) =>
        current.filter((user) => user.id !== actionTarget.id)
      );
      setManagementMessage(response.message);
      closeUserAction();
    } catch (error) {
      handleUserActionError(error);
    } finally {
      setActionSaving(false);
    }
  };

  const submitUserAction = async () => {
    if (actionMode === 'username') {
      await submitUsernameUpdate();
    } else if (actionMode === 'club') {
      await submitClubUpdate();
    } else if (actionMode === 'teams') {
      await submitTeamsUpdate();
    } else if (actionMode === 'delete') {
      await submitDeleteUser();
    }
  };

  const getActionTitle = () => {
    if (actionMode === 'username') return 'Change Username';
    if (actionMode === 'club') return 'Change Club';
    if (actionMode === 'teams') return 'Change Teams';
    if (actionMode === 'delete') return 'Delete User';
    return 'Manage User';
  };

  const getActionSubmitLabel = () => {
    if (actionSaving) return 'Saving...';
    if (actionMode === 'delete') return 'Delete User';
    return 'Save Changes';
  };

  const openPremiumModal = (user: UserSearchResult) => {
    setPremiumTarget(user);
    setPremiumMode(user.subscription?.manualPremiumGranted ? 'revoke' : 'grant');
    setPremiumReason(user.subscription?.manualPremiumReason ?? '');
    setPremiumExpiresAt(
      timestampToDateTimeInput(user.subscription?.manualPremiumExpiresAt)
    );
    setPremiumError(null);
  };

  const closePremiumModal = () => {
    setPremiumTarget(null);
    setPremiumMode('grant');
    setPremiumReason('');
    setPremiumExpiresAt('');
    setPremiumError(null);
  };

  const updatePremiumInSearchResults = (
    userId: string,
    next: {
      granted: boolean;
      expiresAt?: number | null;
      reason?: string | null;
    }
  ) => {
    setSearchResults((current) =>
      current.map((user) => {
        if (user.id !== userId) return user;

        const existingSubscription = user.subscription ?? {
          status: 'ACTIVE',
          hasAccess: next.granted,
          source: 'MANUAL_PREMIUM',
          manualPremiumGranted: next.granted,
        };

        return {
          ...user,
          subscription: {
            ...existingSubscription,
            hasAccess: next.granted ? true : existingSubscription.hasAccess,
            manualPremiumGranted: next.granted,
            manualPremiumGrantedAt: next.granted
              ? Date.now()
              : existingSubscription.manualPremiumGrantedAt ?? null,
            manualPremiumExpiresAt: next.granted
              ? next.expiresAt ?? null
              : null,
            manualPremiumReason: next.granted ? next.reason ?? null : null,
          },
        };
      })
    );
  };

  const submitPremiumUpdate = async () => {
    if (!auth?.token || !premiumTarget) return;

    if (premiumTarget.role !== 'ATHLETE') {
      setPremiumError('Manual premium access can only be managed for athletes.');
      return;
    }

    try {
      setPremiumSaving(true);
      setPremiumError(null);

      if (premiumMode === 'grant') {
        const expiresAt = dateTimeInputToTimestamp(premiumExpiresAt);
        const reason = premiumReason.trim();

        await grantManualPremium(auth.token, premiumTarget.id, {
          ...(expiresAt ? { expiresAt } : {}),
          ...(reason ? { reason } : {}),
        });
        updatePremiumInSearchResults(premiumTarget.id, {
          granted: true,
          expiresAt: expiresAt ?? null,
          reason: reason || null,
        });
        setManagementMessage(
          `Manual premium access granted for ${premiumTarget.username}.`
        );
      } else {
        await revokeManualPremium(auth.token, premiumTarget.id);
        updatePremiumInSearchResults(premiumTarget.id, {
          granted: false,
          expiresAt: null,
          reason: null,
        });
        setManagementMessage(
          `Manual premium access revoked for ${premiumTarget.username}.`
        );
      }

      closePremiumModal();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update premium access.';
      setPremiumError(message);
    } finally {
      setPremiumSaving(false);
    }
  };

  const openResetPassword = (user: UserSearchResult) => {
    setResetTarget(user);
    setResetPassword('');
    setResetError(null);
    setResetFieldError(null);
  };

  const closeResetModal = () => {
    setResetTarget(null);
    setResetPassword('');
    setResetError(null);
    setResetFieldError(null);
  };

  const closeResetSuccess = () => {
    setResetSuccess(null);
    setCopiedPassword(false);
  };

  const submitResetPassword = async () => {
    if (!auth?.token || !resetTarget) return;

    try {
      setResetSaving(true);
      setResetError(null);
      setResetFieldError(null);

      const password = resetPassword.trim();
      const response = await resetUserPassword(auth.token, resetTarget.id, {
        ...(password ? { password } : {}),
      });

      closeResetModal();
      setResetSuccess(response);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          logout();
          return;
        }

        if (
          error.status === 400 &&
          error.message === 'Only super admins can reset user passwords'
        ) {
          setCanResetPasswords(false);
          setResetError(error.message);
          return;
        }

        if (
          error.status === 400 &&
          error.message === 'Password must be at least 8 characters'
        ) {
          setResetFieldError(error.message);
          return;
        }

        setResetError(error.message);
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Unable to reset password.';
      setResetError(message);
    } finally {
      setResetSaving(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!resetSuccess) return;

    await navigator.clipboard.writeText(resetSuccess.temporaryPassword);
    setCopiedPassword(true);
  };

  return (
    <SidebarLayout
      title="Users"
      subtitle={
        isSuperAdmin
          ? 'Search users and create club admin accounts.'
          : 'Search users within your club.'
      }
    >
      <div className="users-page-stack">
        <div className="page-card">
          <h2>Search Users</h2>
          <p className="subtext">
            Search by name, username, email, or phone.
          </p>

          <form className="modal-form user-search-form" onSubmit={submitSearch}>
            <div className="two-column-grid">
              <label className="field">
                <span>Search</span>
                <input
                  value={searchForm.query}
                  disabled={searching}
                  placeholder="Name, username, email, or phone"
                  onChange={(event) =>
                    setSearchForm({ ...searchForm, query: event.target.value })
                  }
                />
              </label>

              {isSuperAdmin ? (
                <label className="field">
                  <span>Club</span>
                  <select
                    value={searchForm.clubId}
                    disabled={loadingClubs || searching}
                    onChange={(event) =>
                      setSearchForm({ ...searchForm, clubId: event.target.value })
                    }
                  >
                    <option value="">All clubs</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="field">
                  <span>Club</span>
                  <input
                    value={clubs[0]?.name ?? auth?.clubName ?? 'Your Club'}
                    disabled
                    readOnly
                  />
                </label>
              )}
            </div>

            <div className="two-column-grid">
              <label className="field">
                <span>Role</span>
                <select
                  value={searchForm.role}
                  disabled={searching}
                  onChange={(event) =>
                    setSearchForm({
                      ...searchForm,
                      role: event.target.value as '' | UserRole,
                    })
                  }
                >
                  <option value="">All roles</option>
                  {userRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Limit</span>
                <select
                  value={searchForm.limit}
                  disabled={searching}
                  onChange={(event) =>
                    setSearchForm({
                      ...searchForm,
                      limit: Number(event.target.value),
                    })
                  }
                >
                  {searchLimitOptions.map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {searchError ? (
              <div className="error-banner">{searchError}</div>
            ) : null}
            {pageError && !isSuperAdmin ? (
              <div className="error-banner">{pageError}</div>
            ) : null}
            {managementMessage ? (
              <div className="success-banner">{managementMessage}</div>
            ) : null}

            <div>
              <button
                className="primary-button"
                type="submit"
                disabled={searching || (isAdmin && !auth?.clubId)}
              >
                {searching ? 'Searching...' : 'Search Users'}
              </button>
            </div>
          </form>

          {hasSearched ? (
            searchResults.length ? (
              <div className="user-search-results">
                {searchResults.map((user) => (
                  <div className="user-result-card" key={user.id}>
                    <div className="user-result-main">
                      <div className="user-result-top">
                        <div>
                          <h3>{user.name}</h3>
                          <p>{user.username}</p>
                        </div>
                        <div className="user-result-actions">
                          <span className="status-pill past">{user.role}</span>
                          {isSuperAdmin ? (
                            <>
                              <button
                                className="secondary-button"
                                onClick={() => openUserAction('username', user)}
                              >
                                Username
                              </button>
                              {user.role !== 'SUPERADMIN' ? (
                                <button
                                  className="secondary-button"
                                  onClick={() => openUserAction('club', user)}
                                >
                                  Club
                                </button>
                              ) : null}
                              {user.role === 'ATHLETE' || user.role === 'COACH' ? (
                                <button
                                  className="secondary-button"
                                  onClick={() => openUserAction('teams', user)}
                                  disabled={loadingTeams}
                                >
                                  Teams
                                </button>
                              ) : null}
                              {user.role === 'ATHLETE' ? (
                                <button
                                  className={
                                    user.subscription?.manualPremiumGranted
                                      ? 'secondary-button warning-button'
                                      : 'secondary-button'
                                  }
                                  onClick={() => openPremiumModal(user)}
                                >
                                  {user.subscription?.manualPremiumGranted
                                    ? 'Revoke Premium'
                                    : 'Grant Premium'}
                                </button>
                              ) : null}
                              {canResetPasswords ? (
                                <button
                                  className="secondary-button"
                                  onClick={() => openResetPassword(user)}
                                >
                                  Reset Password
                                </button>
                              ) : null}
                              <button
                                className="secondary-button danger-button"
                                onClick={() => openUserAction('delete', user)}
                                disabled={user.id === auth?.userId}
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="challenge-meta-grid">
                        <div>
                          <strong>Email</strong>
                          <div>{user.email || '-'}</div>
                        </div>
                        <div>
                          <strong>Phone</strong>
                          <div>{user.phone || '-'}</div>
                        </div>
                        <div>
                          <strong>Position</strong>
                          <div>{user.position || '-'}</div>
                        </div>
                        <div>
                          <strong>Clubs</strong>
                          <div>{getClubNames(user.clubIds)}</div>
                        </div>
                        <div>
                          <strong>Teams</strong>
                          <div>{getTeamNames(user.teamIds)}</div>
                        </div>
                        {user.role === 'ATHLETE' ? (
                          <>
                            <div>
                              <strong>Subscription</strong>
                              <div>{getSubscriptionStatus(user)}</div>
                            </div>
                            <div>
                              <strong>Manual Premium</strong>
                              <div>{getManualPremiumStatus(user)}</div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-inline user-search-empty">
                No users matched the current filters.
              </div>
            )
          ) : null}
        </div>

        {isSuperAdmin ? (
          <div className="page-card">
            <h2>Create User</h2>
            <p className="subtext">
              Create coach, athlete, or parent accounts.
            </p>

            <form
              className="modal-form user-create-form"
              onSubmit={submitCmsUser}
            >
              <div className="two-column-grid">
                <label className="field">
                  <span>Club</span>
                  <select
                    value={cmsUserForm.clubId}
                    disabled={loadingClubs || cmsUserSaving}
                    onChange={(event) => updateCmsUserClub(event.target.value)}
                  >
                    <option value="">
                      {loadingClubs ? 'Loading clubs...' : 'Select club'}
                    </option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Role</span>
                  <select
                    value={cmsUserForm.role}
                    disabled={cmsUserSaving}
                    onChange={(event) =>
                      updateCmsUserRole(
                        event.target.value as CmsCreatableUserRole
                      )
                    }
                  >
                    {cmsCreatableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Name</span>
                <input
                  value={cmsUserForm.name}
                  disabled={cmsUserSaving}
                  onChange={(event) =>
                    setCmsUserForm({
                      ...cmsUserForm,
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <div className="two-column-grid">
                <label className="field">
                  <span>Username</span>
                  <input
                    value={cmsUserForm.username}
                    disabled={cmsUserSaving}
                    autoComplete="off"
                    onChange={(event) =>
                      setCmsUserForm({
                        ...cmsUserForm,
                        username: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={cmsUserForm.password}
                    disabled={cmsUserSaving}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setCmsUserForm({
                        ...cmsUserForm,
                        password: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="two-column-grid">
                <label className="field">
                  <span>Date of birth</span>
                  <input
                    value={cmsUserForm.dob}
                    disabled={cmsUserSaving}
                    placeholder="01/01/1990"
                    onChange={(event) =>
                      setCmsUserForm({
                        ...cmsUserForm,
                        dob: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={cmsUserForm.email}
                    disabled={cmsUserSaving}
                    onChange={(event) =>
                      setCmsUserForm({
                        ...cmsUserForm,
                        email: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={cmsUserForm.phone}
                  disabled={cmsUserSaving}
                  onChange={(event) =>
                    setCmsUserForm({
                      ...cmsUserForm,
                      phone: event.target.value,
                    })
                  }
                />
              </label>

              {cmsUserForm.role === 'ATHLETE' ? (
                <div className="form-section">
                  <h3>Athlete Details</h3>

                  <div className="two-column-grid">
                    <label className="field">
                      <span>Gender</span>
                      <input
                        value={cmsUserForm.gender}
                        disabled={cmsUserSaving}
                        onChange={(event) =>
                          setCmsUserForm({
                            ...cmsUserForm,
                            gender: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Position</span>
                      <input
                        value={cmsUserForm.position}
                        disabled={cmsUserSaving}
                        onChange={(event) =>
                          setCmsUserForm({
                            ...cmsUserForm,
                            position: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="field">
                    <span>Team</span>
                    <div className="checkbox-grid user-team-grid">
                      {getTeamsForClub(cmsUserForm.clubId).map((team) => (
                        <label key={team.id} className="checkbox-card">
                          <input
                            type="radio"
                            name="cms-user-athlete-team"
                            checked={cmsUserForm.teamIds.includes(team.id)}
                            disabled={cmsUserSaving}
                            onChange={() =>
                              setCmsUserForm({
                                ...cmsUserForm,
                                teamIds: [team.id],
                              })
                            }
                          />
                          <span>{team.name}</span>
                        </label>
                      ))}
                    </div>
                    {!getTeamsForClub(cmsUserForm.clubId).length ? (
                      <div className="empty-state-inline">
                        {cmsUserForm.clubId
                          ? 'No teams found for this club.'
                          : 'Select a club to choose teams.'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {cmsUserForm.role === 'COACH' ? (
                <div className="form-section">
                  <h3>Coach Teams</h3>

                  <div className="field">
                    <span>Teams</span>
                    <div className="checkbox-grid user-team-grid">
                      {getTeamsForClub(cmsUserForm.clubId).map((team) => {
                        const checked = cmsUserForm.teamIds.includes(team.id);

                        return (
                          <label key={team.id} className="checkbox-card">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={cmsUserSaving}
                              onChange={() => toggleCmsUserTeam(team.id)}
                            />
                            <span>{team.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    {!getTeamsForClub(cmsUserForm.clubId).length ? (
                      <div className="empty-state-inline">
                        {cmsUserForm.clubId
                          ? 'No teams found for this club.'
                          : 'Select a club to choose teams.'}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {cmsUserForm.role === 'PARENT' ? (
                <div className="form-section">
                  <div className="user-section-header">
                    <h3>Child Athletes</h3>
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={cmsUserSaving}
                      onClick={addChildAthlete}
                    >
                      Add Child
                    </button>
                  </div>

                  {cmsUserForm.childAccounts.map((child, index) => (
                    <div
                      className="form-section child-athlete-section"
                      key={`child-athlete-${index}`}
                    >
                      <div className="user-section-header">
                        <h3>Child {index + 1}</h3>
                        {cmsUserForm.childAccounts.length > 1 ? (
                          <button
                            className="secondary-button danger-button"
                            type="button"
                            disabled={cmsUserSaving}
                            onClick={() => removeChildAthlete(index)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <label className="field">
                        <span>Name</span>
                        <input
                          value={child.name}
                          disabled={cmsUserSaving}
                          onChange={(event) =>
                            updateChildAthlete(index, {
                              name: event.target.value,
                            })
                          }
                        />
                      </label>

                      <div className="two-column-grid">
                        <label className="field">
                          <span>Username</span>
                          <input
                            value={child.username}
                            disabled={cmsUserSaving}
                            autoComplete="off"
                            onChange={(event) =>
                              updateChildAthlete(index, {
                                username: event.target.value,
                              })
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Password</span>
                          <input
                            type="password"
                            value={child.password}
                            disabled={cmsUserSaving}
                            autoComplete="new-password"
                            onChange={(event) =>
                              updateChildAthlete(index, {
                                password: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>

                      <div className="two-column-grid">
                        <label className="field">
                          <span>Date of birth</span>
                          <input
                            value={child.dob}
                            disabled={cmsUserSaving}
                            placeholder="01/01/2013"
                            onChange={(event) =>
                              updateChildAthlete(index, {
                                dob: event.target.value,
                              })
                            }
                          />
                        </label>

                        <label className="field">
                          <span>Gender</span>
                          <input
                            value={child.gender}
                            disabled={cmsUserSaving}
                            onChange={(event) =>
                              updateChildAthlete(index, {
                                gender: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>

                      <label className="field">
                        <span>Position</span>
                        <input
                          value={child.position}
                          disabled={cmsUserSaving}
                          onChange={(event) =>
                            updateChildAthlete(index, {
                              position: event.target.value,
                            })
                          }
                        />
                      </label>

                      <div className="field">
                        <span>Team</span>
                        <div className="checkbox-grid user-team-grid">
                          {getTeamsForClub(cmsUserForm.clubId).map((team) => (
                            <label key={team.id} className="checkbox-card">
                              <input
                                type="radio"
                                name={`cms-child-athlete-team-${index}`}
                                checked={child.teamIds.includes(team.id)}
                                disabled={cmsUserSaving}
                                onChange={() =>
                                  updateChildAthlete(index, {
                                    teamIds: [team.id],
                                  })
                                }
                              />
                              <span>{team.name}</span>
                            </label>
                          ))}
                        </div>
                        {!getTeamsForClub(cmsUserForm.clubId).length ? (
                          <div className="empty-state-inline">
                            {cmsUserForm.clubId
                              ? 'No teams found for this club.'
                              : 'Select a club to choose teams.'}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {cmsUserError ? (
                <div className="error-banner">{cmsUserError}</div>
              ) : null}
              {cmsUserSuccess ? (
                <div className="success-banner">{cmsUserSuccess}</div>
              ) : null}

              <div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={cmsUserSaving || loadingClubs || loadingTeams}
                >
                  {cmsUserSaving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {isSuperAdmin ? (
          <div className="page-card">
            <h2>Create Superadmin</h2>
            <p className="subtext">
              Create a SUPERADMIN account with full CMS access.
            </p>

            <form
              className="modal-form user-create-form"
              onSubmit={submitSuperAdmin}
            >
              <label className="field">
                <span>Name</span>
                <input
                  value={superAdminForm.name}
                  disabled={superAdminSaving}
                  onChange={(event) =>
                    setSuperAdminForm({
                      ...superAdminForm,
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <div className="two-column-grid">
                <label className="field">
                  <span>Username</span>
                  <input
                    value={superAdminForm.username}
                    disabled={superAdminSaving}
                    autoComplete="off"
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        username: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={superAdminForm.password}
                    disabled={superAdminSaving}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        password: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="two-column-grid">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={superAdminForm.email}
                    disabled={superAdminSaving}
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        email: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={superAdminForm.phone}
                    disabled={superAdminSaving}
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        phone: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="two-column-grid">
                <label className="field">
                  <span>Date of birth</span>
                  <input
                    value={superAdminForm.dob}
                    disabled={superAdminSaving}
                    placeholder="01/01/1990"
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        dob: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Gender</span>
                  <input
                    value={superAdminForm.gender}
                    disabled={superAdminSaving}
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        gender: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="two-column-grid">
                <label className="field">
                  <span>State</span>
                  <input
                    value={superAdminForm.state}
                    disabled={superAdminSaving}
                    placeholder="AZ"
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        state: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="field">
                  <span>Town</span>
                  <input
                    value={superAdminForm.town}
                    disabled={superAdminSaving}
                    placeholder="Phoenix"
                    onChange={(event) =>
                      setSuperAdminForm({
                        ...superAdminForm,
                        town: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Social media handle</span>
                <input
                  value={superAdminForm.socialMediaHandle}
                  disabled={superAdminSaving}
                  placeholder="@jane"
                  onChange={(event) =>
                    setSuperAdminForm({
                      ...superAdminForm,
                      socialMediaHandle: event.target.value,
                    })
                  }
                />
              </label>

              {superAdminError ? (
                <div className="error-banner">{superAdminError}</div>
              ) : null}
              {superAdminSuccess ? (
                <div className="success-banner">{superAdminSuccess}</div>
              ) : null}

              <div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={superAdminSaving}
                >
                  {superAdminSaving ? 'Creating...' : 'Create Superadmin'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {isSuperAdmin ? (
          <div className="page-card">
        <h2>Create Club Admin</h2>
        <p className="subtext">
          Create an ADMIN account and assign it to one club.
        </p>

        <form className="modal-form user-create-form" onSubmit={submitAdmin}>
          <label className="field">
            <span>Club</span>
            <select
              value={form.clubId}
              disabled={loadingClubs || saving}
              onChange={(event) =>
                setForm({
                  ...form,
                  clubId: event.target.value,
                  clubIds: form.clubIds?.filter(
                    (clubId) => clubId !== event.target.value
                  ),
                })
              }
            >
              <option value="">
                {loadingClubs ? 'Loading clubs...' : 'Select club'}
              </option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>Additional clubs</span>
            <div className="checkbox-grid user-team-grid">
              {clubs
                .filter((club) => club.id !== form.clubId)
                .map((club) => {
                  const checked = form.clubIds?.includes(club.id) ?? false;

                  return (
                    <label key={club.id} className="checkbox-card">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving}
                        onChange={() =>
                          setForm({
                            ...form,
                            clubIds: checked
                              ? form.clubIds?.filter((id) => id !== club.id)
                              : [...(form.clubIds ?? []), club.id],
                          })
                        }
                      />
                      <span>{club.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              disabled={saving}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>

          <div className="two-column-grid">
            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                disabled={saving}
                autoComplete="off"
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                disabled={saving}
                autoComplete="new-password"
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </label>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                disabled={saving}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Phone</span>
              <input
                type="tel"
                value={form.phone}
                disabled={saving}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </label>
          </div>

          <label className="field">
            <span>Date of birth</span>
            <input
              type="date"
              value={form.dob}
              disabled={saving}
              onChange={(event) =>
                setForm({ ...form, dob: event.target.value })
              }
            />
          </label>

          {pageError ? <div className="error-banner">{pageError}</div> : null}
          {successMessage ? (
            <div className="success-banner">{successMessage}</div>
          ) : null}

          <div>
            <button
              className="primary-button"
              type="submit"
              disabled={saving || loadingClubs}
            >
              {saving ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
          </div>
        ) : null}
      </div>

      {actionTarget && actionMode ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{getActionTitle()}</h2>
              <button className="icon-button" onClick={closeUserAction}>
                ✕
              </button>
            </div>

            <div className="modal-form">
              <p className="subtext">
                Managing <strong>{actionTarget.username}</strong>
              </p>

              {actionMode === 'username' ? (
                <label className="field">
                  <span>Username</span>
                  <input
                    value={usernameValue}
                    disabled={actionSaving}
                    onChange={(event) => setUsernameValue(event.target.value)}
                  />
                </label>
              ) : null}

              {actionMode === 'club' ? (
                actionTarget.role === 'ADMIN' ? (
                  <div className="field">
                    <span>Clubs</span>
                    <div className="checkbox-grid user-team-grid">
                      {clubs.map((club) => {
                        const checked = clubValues.includes(club.id);

                        return (
                          <label key={club.id} className="checkbox-card">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={actionSaving}
                              onChange={() => toggleClubValue(club.id)}
                            />
                            <span>{club.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <label className="field">
                    <span>Club</span>
                    <select
                      value={clubValue}
                      disabled={actionSaving}
                      onChange={(event) => setClubValue(event.target.value)}
                    >
                      <option value="">Select club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              ) : null}

              {actionMode === 'teams' ? (
                actionTarget.role === 'ATHLETE' || actionTarget.role === 'COACH' ? (
                  <div className="field">
                    <span>Teams</span>
                    <div className="checkbox-grid user-team-grid">
                      {getTeamsForUserClubs(actionTarget).map((team) => {
                        const checked = teamValues.includes(team.id);

                        return (
                          <label key={team.id} className="checkbox-card">
                            <input
                              type={
                                actionTarget.role === 'ATHLETE'
                                  ? 'radio'
                                  : 'checkbox'
                              }
                              name="managed-user-team"
                              checked={checked}
                              disabled={actionSaving}
                              onChange={() => {
                                if (actionTarget.role === 'ATHLETE') {
                                  setTeamValues([team.id]);
                                } else {
                                  toggleTeamValue(team.id);
                                }
                              }}
                            />
                            <span>
                              {team.name} ({getTeamClubName(team)})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {!getTeamsForUserClubs(actionTarget).length ? (
                      <div className="empty-state-inline">
                        No teams found for the user&apos;s current club.
                      </div>
                    ) : null}
                    {getUnmatchedTeamIds(actionTarget).length ? (
                      <div className="error-banner">
                        Current team IDs were returned but do not match any
                        loaded teams: {getUnmatchedTeamIds(actionTarget).join(', ')}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="error-banner">
                    Team updates are only available for athletes and coaches.
                  </div>
                )
              ) : null}

              {actionMode === 'delete' ? (
                <div className="error-banner">
                  Delete {actionTarget.username}? This removes the user and
                  related memberships, consents, subscriptions, upload intents,
                  submissions, and parent-child links when allowed by the
                  backend.
                </div>
              ) : null}

              {actionError ? (
                <div className="error-banner">{actionError}</div>
              ) : null}
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closeUserAction}
                disabled={actionSaving}
              >
                Cancel
              </button>
              <button
                className={
                  actionMode === 'delete'
                    ? 'primary-button danger-primary-button'
                    : 'primary-button'
                }
                onClick={submitUserAction}
                disabled={
                  actionSaving ||
                  (actionMode === 'teams' &&
                    actionTarget.role !== 'SUPERADMIN' &&
                    !getTeamsForUserClubs(actionTarget).length)
                }
              >
                {getActionSubmitLabel()}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {premiumTarget ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>
                {premiumMode === 'grant'
                  ? 'Grant Premium Access'
                  : 'Revoke Premium Access'}
              </h2>
              <button className="icon-button" onClick={closePremiumModal}>
                ✕
              </button>
            </div>

            <div className="modal-form">
              <p className="subtext">
                Managing <strong>{premiumTarget.username}</strong>
              </p>

              {premiumMode === 'grant' ? (
                <>
                  <label className="field">
                    <span>Expiration</span>
                    <input
                      type="datetime-local"
                      value={premiumExpiresAt}
                      disabled={premiumSaving}
                      onChange={(event) =>
                        setPremiumExpiresAt(event.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Reason</span>
                    <input
                      value={premiumReason}
                      disabled={premiumSaving}
                      placeholder="Scholarship"
                      onChange={(event) => setPremiumReason(event.target.value)}
                    />
                  </label>

                  <p className="subtext">
                    Leave expiration blank to grant access indefinitely.
                  </p>
                </>
              ) : (
                <div className="error-banner">
                  Revoke manual premium access for {premiumTarget.username}?
                  This only removes the manual grant.
                </div>
              )}

              {premiumError ? (
                <div className="error-banner">{premiumError}</div>
              ) : null}
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closePremiumModal}
                disabled={premiumSaving}
              >
                Cancel
              </button>
              <button
                className={
                  premiumMode === 'revoke'
                    ? 'primary-button danger-primary-button'
                    : 'primary-button'
                }
                onClick={submitPremiumUpdate}
                disabled={premiumSaving}
              >
                {premiumSaving
                  ? 'Saving...'
                  : premiumMode === 'grant'
                    ? 'Grant Premium'
                    : 'Revoke Premium'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetTarget ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="icon-button" onClick={closeResetModal}>
                ✕
              </button>
            </div>

            <div className="modal-form">
              <p className="subtext">
                Reset password for <strong>{resetTarget.username}</strong>?
              </p>

              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={resetPassword}
                  disabled={resetSaving}
                  placeholder="Leave blank to auto-generate"
                  autoComplete="new-password"
                  onChange={(event) => {
                    setResetPassword(event.target.value);
                    setResetFieldError(null);
                  }}
                />
              </label>

              {resetFieldError ? (
                <div className="error-banner">{resetFieldError}</div>
              ) : null}
              {resetError ? <div className="error-banner">{resetError}</div> : null}
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closeResetModal}
                disabled={resetSaving}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={submitResetPassword}
                disabled={resetSaving}
              >
                {resetSaving ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetSuccess ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Password Reset</h2>
              <button className="icon-button" onClick={closeResetSuccess}>
                ✕
              </button>
            </div>

            <div className="modal-form">
              <div className="submission-detail-block">
                <strong>Username</strong>
                <div>{resetSuccess.username}</div>
              </div>

              <div className="submission-detail-block">
                <strong>Temporary password</strong>
                <div className="temporary-password-row">
                  <code>{resetSuccess.temporaryPassword}</code>
                  <button
                    className="secondary-button"
                    onClick={copyTemporaryPassword}
                  >
                    {copiedPassword ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="success-banner">{resetSuccess.message}</div>
              <p className="subtext">
                This password will only be shown once.
              </p>
            </div>

            <div className="modal-actions">
              <button className="primary-button" onClick={closeResetSuccess}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SidebarLayout>
  );
}
