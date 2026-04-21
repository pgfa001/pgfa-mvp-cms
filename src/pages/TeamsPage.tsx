import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import {
  createTeam,
  getTeams,
  updateTeam,
} from '../api/teams';
import type { TeamResponse } from '../api/teams';
import type { GetClubsResponse } from '../api/clubs';
import { getClubs } from '../api/clubs';

type TeamFormState = {
  id?: string;
  name: string;
  clubId: string;
  lowerAgeRange: string;
  upperAgeRange: string;
};

function createEmptyForm(clubId = ''): TeamFormState {
  return {
    name: '',
    clubId,
    lowerAgeRange: '',
    upperAgeRange: '',
  };
}

type TeamModalProps = {
  title: string;
  clubs: ClubSummaryResponse[];
  form: TeamFormState;
  saving: boolean;
  onChange: (next: TeamFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function TeamModal({
  title,
  clubs,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: TeamModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-form">
          <label className="field">
            <span>Club</span>
            <select
              value={form.clubId}
              onChange={(event) =>
                onChange({ ...form, clubId: event.target.value })
              }
            >
              <option value="">Select club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Team name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              placeholder="Enter team name"
            />
          </label>

          <div className="two-column-grid">
            <label className="field">
              <span>Lower age range</span>
              <input
                type="number"
                value={form.lowerAgeRange}
                onChange={(event) =>
                  onChange({ ...form, lowerAgeRange: event.target.value })
                }
                placeholder="10"
              />
            </label>

            <label className="field">
              <span>Upper age range</span>
              <input
                type="number"
                value={form.upperAgeRange}
                onChange={(event) =>
                  onChange({ ...form, upperAgeRange: event.target.value })
                }
                placeholder="12"
              />
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const { auth } = useAuth();

  const [clubs, setClubs] = useState<ClubSummaryResponse[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [expandedClubIds, setExpandedClubIds] = useState<string[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addForm, setAddForm] = useState<TeamFormState>(createEmptyForm());
  const [editForm, setEditForm] = useState<TeamFormState>(createEmptyForm());

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) return;

      try {
        setLoading(true);
        setPageError(null);

        const [clubsResponse, teamsResponse] = await Promise.all([
          getClubs(auth.token),
          getTeams(auth.token),
        ]);

        setClubs(clubsResponse.clubs);
        setTeams(teamsResponse.teams);
        setExpandedClubIds(clubsResponse.clubs.map((club) => club.id));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load teams page.';
        setPageError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth?.token]);

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesClub = clubFilter ? team.clubId === clubFilter : true;
      const matchesSearch = search.trim()
        ? team.name.toLowerCase().includes(search.trim().toLowerCase())
        : true;

      return matchesClub && matchesSearch;
    });
  }, [teams, search, clubFilter]);

  const teamsByClub = useMemo(() => {
    return clubs
      .map((club) => ({
        club,
        teams: filteredTeams
          .filter((team) => team.clubId === club.id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(({ club, teams }) => {
        if (clubFilter) {
          return club.id === clubFilter;
        }
        return teams.length > 0 || !search.trim();
      });
  }, [clubs, filteredTeams, clubFilter, search]);

  const toggleClub = (clubId: string) => {
    setExpandedClubIds((current) =>
      current.includes(clubId)
        ? current.filter((id) => id !== clubId)
        : [...current, clubId]
    );
  };

  const openAddModal = () => {
    setAddForm(createEmptyForm(clubFilter));
    setIsAddOpen(true);
  };

  const openEditModal = (team: TeamResponse) => {
    setEditForm({
      id: team.id,
      name: team.name,
      clubId: team.clubId,
      lowerAgeRange: String(team.lowerAgeRange),
      upperAgeRange: String(team.upperAgeRange),
    });
    setIsEditOpen(true);
  };

  const validateForm = (form: TeamFormState) => {
    if (
      !form.name.trim() ||
      !form.clubId ||
      !form.lowerAgeRange.trim() ||
      !form.upperAgeRange.trim()
    ) {
      throw new Error('Please complete all team fields.');
    }

    const lowerAgeRange = Number(form.lowerAgeRange);
    const upperAgeRange = Number(form.upperAgeRange);

    if (Number.isNaN(lowerAgeRange) || Number.isNaN(upperAgeRange)) {
      throw new Error('Age ranges must be valid numbers.');
    }

    if (lowerAgeRange > upperAgeRange) {
      throw new Error('Lower age range cannot be greater than upper age range.');
    }

    return {
      name: form.name.trim(),
      clubId: form.clubId,
      lowerAgeRange,
      upperAgeRange,
    };
  };

  const submitAdd = async () => {
    if (!auth?.token) return;

    try {
      const payload = validateForm(addForm);
      setSaving(true);

      const created = await createTeam(auth.token, payload);
      setTeams((current) => [...current, created]);

      if (!expandedClubIds.includes(created.clubId)) {
        setExpandedClubIds((current) => [...current, created.clubId]);
      }

      setIsAddOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create team.';
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!auth?.token || !editForm.id) return;

    try {
      const payload = validateForm(editForm);
      setSaving(true);

      const updated = await updateTeam(auth.token, editForm.id, payload);

      setTeams((current) =>
        current.map((team) => (team.id === updated.id ? updated : team))
      );

      if (!expandedClubIds.includes(updated.clubId)) {
        setExpandedClubIds((current) => [...current, updated.clubId]);
      }

      setIsEditOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update team.';
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout
      title="Teams"
      subtitle="Browse teams by club, then add or edit team details."
    >
      <div className="toolbar-card">
        <div className="toolbar-left">
          <label className="field toolbar-field">
            <span>Search teams</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by team name"
            />
          </label>

          <label className="field toolbar-field">
            <span>Filter by club</span>
            <select
              value={clubFilter}
              onChange={(event) => setClubFilter(event.target.value)}
            >
              <option value="">All clubs</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="toolbar-actions">
          <button className="primary-button" onClick={openAddModal}>
            Add Team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-card">
          <h2>Loading teams...</h2>
        </div>
      ) : pageError ? (
        <div className="page-card">
          <h2>Unable to load teams</h2>
          <p>{pageError}</p>
        </div>
      ) : (
        <div className="club-sections">
          {teamsByClub.map(({ club, teams: clubTeams }) => {
            const isExpanded = expandedClubIds.includes(club.id);

            return (
              <section className="club-section-card" key={club.id}>
                <button
                  className="club-section-header"
                  onClick={() => toggleClub(club.id)}
                >
                  <div>
                    <h2>{club.name}</h2>
                    <p>
                      {clubTeams.length} team{clubTeams.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <span className="club-section-toggle">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded ? (
                  clubTeams.length ? (
                    <div className="team-list">
                      {clubTeams.map((team) => (
                        <div className="team-row" key={team.id}>
                          <div className="team-row-main">
                            <h3>{team.name}</h3>
                            <p>
                              Age range: {team.lowerAgeRange}–{team.upperAgeRange}
                            </p>
                          </div>

                          <div className="team-row-actions">
                            <button
                              className="secondary-button"
                              onClick={() => openEditModal(team)}
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-inline">
                      No teams match the current filters.
                    </div>
                  )
                ) : null}
              </section>
            );
          })}

          {!teamsByClub.length ? (
            <div className="page-card">
              <h2>No teams found</h2>
              <p>Try changing your filters or add a new team.</p>
            </div>
          ) : null}
        </div>
      )}

      {isAddOpen ? (
        <TeamModal
          title="Add Team"
          clubs={clubs}
          form={addForm}
          saving={saving}
          onChange={setAddForm}
          onClose={() => setIsAddOpen(false)}
          onSubmit={submitAdd}
        />
      ) : null}

      {isEditOpen ? (
        <TeamModal
          title="Edit Team"
          clubs={clubs}
          form={editForm}
          saving={saving}
          onChange={setEditForm}
          onClose={() => setIsEditOpen(false)}
          onSubmit={submitEdit}
        />
      ) : null}
    </SidebarLayout>
  );
}