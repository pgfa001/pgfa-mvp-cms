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
import { searchUsers } from '../api/users';
import type { UserSearchResult } from '../api/users';
import type { UserRole } from '../types/api';

type AdminFormState = CreateClubAdminRequest & {
  clubId: string;
};

type ClubOption = {
  id: string;
  name: string;
};

type SearchFormState = {
  query: string;
  clubId: string;
  role: '' | UserRole;
  limit: number;
};

const userRoleOptions: UserRole[] = [
  'ATHLETE',
  'PARENT',
  'COACH',
  'ADMIN',
  'SUPERADMIN',
];

const searchLimitOptions = [10, 25, 50] as const;

function emptyAdminForm(): AdminFormState {
  return {
    clubId: '',
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    dob: '',
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
  };
}

export default function UsersPage() {
  const { auth } = useAuth();
  const isSuperAdmin = auth?.role === 'SUPERADMIN';
  const isAdmin = auth?.role === 'ADMIN';
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [form, setForm] = useState<AdminFormState>(emptyAdminForm());
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState<SearchFormState>(
    emptySearchForm()
  );
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadClubs = async () => {
      if (!auth?.token) return;

      try {
        setLoadingClubs(true);
        setPageError(null);

        if (isSuperAdmin) {
          const response = await getClubs(auth.token);
          setClubs(response.clubs.map((club) => ({ id: club.id, name: club.name })));

          if (response.clubs.length === 1) {
            setForm((current) => ({ ...current, clubId: response.clubs[0].id }));
          }
          return;
        }

        if (isAdmin && auth.clubId) {
          const club = await getClubDetailsById(auth.clubId);
          setClubs([{ id: club.id, name: club.name }]);
          setSearchForm((current) => ({ ...current, clubId: club.id }));
          return;
        }

        setClubs([]);
        setPageError('No assigned club was returned for this account.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load clubs.';
        setPageError(message);
      } finally {
        setLoadingClubs(false);
      }
    };

    loadClubs();
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

  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();

    if (!auth?.token) return;

    try {
      setSearching(true);
      setSearchError(null);
      setHasSearched(true);

      const response = await searchUsers(auth.token, {
        query: searchForm.query,
        clubId: isAdmin ? auth.clubId ?? undefined : searchForm.clubId || undefined,
        role: searchForm.role || undefined,
        limit: searchForm.limit,
      });

      setSearchResults(response.users);
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
                        <span className="status-pill past">{user.role}</span>
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
                setForm({ ...form, clubId: event.target.value })
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
    </SidebarLayout>
  );
}
