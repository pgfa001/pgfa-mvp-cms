import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/auth-context';
import { getClubs } from '../api/clubs';
import type { ClubCmsResponse } from '../api/clubs';
import {
  createChallenge,
  createChallengeDemoUploadUrl,
  getChallengeDemoVideoUrl,
  getChallenges,
  updateChallenge,
} from '../api/challenges';
import type {
  ChallengeCmsResponse,
  ChallengeScoringType,
} from '../api/challenges';

type ChallengeFormState = {
  id?: string;
  title: string;
  description: string;
  scoringType: ChallengeScoringType;
  difficulty: string;
  startAtLocal: string;
  endAtLocal: string;
  clubIds: string[];
  demoVideoObjectKey: string;
  demoVideoFileName: string;
};

const scoringTypes: ChallengeScoringType[] = [
  'HIGH_SCORE',
  'LOW_SCORE',
  'FASTEST_TIME',
  'LONGEST_TIME',
];

function createEmptyChallengeForm(allClubIds: string[]): ChallengeFormState {
  return {
    title: '',
    description: '',
    scoringType: 'HIGH_SCORE',
    difficulty: '1',
    startAtLocal: '',
    endAtLocal: '',
    clubIds: allClubIds,
    demoVideoObjectKey: '',
    demoVideoFileName: '',
  };
}

function formatDateTime(timestamp: number) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return '-';
  }
}

function toLocalDateTimeInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type ChallengeModalProps = {
  title: string;
  clubs: ClubCmsResponse[];
  form: ChallengeFormState;
  saving: boolean;
  uploadingVideo: boolean;
  onChange: (next: ChallengeFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onUploadDemoVideo: (file: File) => Promise<void>;
};

function ChallengeModal({
  title,
  clubs,
  form,
  saving,
  uploadingVideo,
  onChange,
  onClose,
  onSubmit,
  onUploadDemoVideo,
}: ChallengeModalProps) {
  const toggleClub = (clubId: string) => {
    const isSelected = form.clubIds.includes(clubId);

    onChange({
      ...form,
      clubIds: isSelected
        ? form.clubIds.filter((id) => id !== clubId)
        : [...form.clubIds, clubId],
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-card-large">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-form">
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                onChange({ ...form, title: event.target.value })
              }
              placeholder="Week 4 Shooting Challenge"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              placeholder="Describe the challenge and what athletes need to do."
              rows={5}
            />
          </label>

          <div className="three-column-grid">
            <label className="field">
              <span>Scoring type</span>
              <select
              value={form.scoringType}
              onChange={(event) =>
                  onChange({
                    ...form,
                    scoringType: event.target.value as ChallengeScoringType,
                  })
              }
              >
                {scoringTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Difficulty</span>
              <input
                type="number"
                min={1}
                max={10}
                value={form.difficulty}
                onChange={(event) =>
                  onChange({ ...form, difficulty: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>Demo video</span>
              <input
                type="file"
                accept="video/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await onUploadDemoVideo(file);
                }}
              />
            </label>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Start time</span>
              <input
                type="datetime-local"
                value={form.startAtLocal}
                onChange={(event) =>
                  onChange({ ...form, startAtLocal: event.target.value })
                }
              />
            </label>

            <label className="field">
              <span>End time</span>
              <input
                type="datetime-local"
                value={form.endAtLocal}
                onChange={(event) =>
                  onChange({ ...form, endAtLocal: event.target.value })
                }
              />
            </label>
          </div>

          <div className="field">
            <span>Clubs</span>
            <div className="checkbox-grid">
              {clubs.map((club) => {
                const checked = form.clubIds.includes(club.id);

                return (
                  <label key={club.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClub(club.id)}
                    />
                    <span>{club.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="challenge-demo-status">
            {uploadingVideo ? (
              <span>Uploading demo video...</span>
            ) : form.demoVideoObjectKey ? (
              <span>Demo video attached: {form.demoVideoFileName || 'Uploaded video'}</span>
            ) : (
              <span>No demo video attached</span>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-button" onClick={onSubmit} disabled={saving || uploadingVideo}>
            {saving ? 'Saving...' : 'Save Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const { auth } = useAuth();

  const [clubs, setClubs] = useState<ClubCmsResponse[]>([]);
  const [challenges, setChallenges] = useState<ChallengeCmsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'PAST'>('ALL');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [addForm, setAddForm] = useState<ChallengeFormState>(createEmptyChallengeForm([]));
  const [editForm, setEditForm] = useState<ChallengeFormState>(createEmptyChallengeForm([]));

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) return;

      try {
        setLoading(true);
        setPageError(null);

        const [clubsResponse, challengesResponse] = await Promise.all([
          getClubs(auth.token),
          getChallenges(auth.token),
        ]);

        setClubs(clubsResponse.clubs);
        setChallenges(challengesResponse.challenges);
        setAddForm(createEmptyChallengeForm(clubsResponse.clubs.map((club) => club.id)));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load challenges.';
        setPageError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth?.token]);

  const filteredChallenges = useMemo(() => {
    const now = Date.now();

    return challenges
      .filter((challenge) => {
        const matchesSearch = search.trim()
          ? challenge.title.toLowerCase().includes(search.trim().toLowerCase())
          : true;

        const matchesClub = clubFilter
          ? challenge.clubIds.includes(clubFilter)
          : true;

        let matchesStatus = true;
        if (statusFilter === 'ACTIVE') {
          matchesStatus = challenge.startTime <= now && challenge.endTime >= now;
        } else if (statusFilter === 'UPCOMING') {
          matchesStatus = challenge.startTime > now;
        } else if (statusFilter === 'PAST') {
          matchesStatus = challenge.endTime < now;
        }

        return matchesSearch && matchesClub && matchesStatus;
      })
      .sort((a, b) => b.startTime - a.startTime);
  }, [challenges, search, clubFilter, statusFilter]);

  const validateForm = (form: ChallengeFormState) => {
    if (!form.title.trim()) {
      throw new Error('Title is required.');
    }

    if (!form.description.trim()) {
      throw new Error('Description is required.');
    }

    if (form.clubIds.length === 0) {
      throw new Error('Select at least one club.');
    }

    const difficulty = Number(form.difficulty);
    if (Number.isNaN(difficulty)) {
      throw new Error('Difficulty must be a number.');
    }

    if (!form.startAtLocal || !form.endAtLocal) {
      throw new Error('Start and end times are required.');
    }

    const startTime = new Date(form.startAtLocal).getTime();
    const endTime = new Date(form.endAtLocal).getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      throw new Error('Start or end time is invalid.');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be before end time.');
    }

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      scoringType: form.scoringType,
      difficulty,
      startTime,
      endTime,
      clubIds: form.clubIds,
      demoVideoObjectKey: form.demoVideoObjectKey || null,
    };
  };

  const uploadDemoVideo = async (
    file: File,
    form: ChallengeFormState,
    setForm: (next: ChallengeFormState) => void
  ) => {
    if (!auth?.token) return;

    try {
      setUploadingVideo(true);

      const upload = await createChallengeDemoUploadUrl(auth.token, {
        fileName: file.name,
        contentType: file.type || 'video/mp4',
      });

      const putResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error(`Demo video upload failed (${putResponse.status})`);
      }

      setForm({
        ...form,
        demoVideoObjectKey: upload.objectKey,
        demoVideoFileName: file.name,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to upload demo video.';
      window.alert(message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const openAddModal = () => {
    setAddForm(createEmptyChallengeForm(clubs.map((club) => club.id)));
    setIsAddOpen(true);
  };

  const openEditModal = (challenge: ChallengeCmsResponse) => {
    setEditForm({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      scoringType: challenge.scoringType,
      difficulty: String(challenge.difficulty),
      startAtLocal: toLocalDateTimeInputValue(challenge.startTime),
      endAtLocal: toLocalDateTimeInputValue(challenge.endTime),
      clubIds: challenge.clubIds,
      demoVideoObjectKey: challenge.demoVideoObjectKey ?? '',
      demoVideoFileName: challenge.demoVideoObjectKey
        ? challenge.demoVideoObjectKey.split('/').pop() ?? ''
        : '',
    });

    setIsEditOpen(true);
  };

  const submitAdd = async () => {
    if (!auth?.token) return;

    try {
      const payload = validateForm(addForm);
      setSaving(true);

      const created = await createChallenge(auth.token, payload);
      setChallenges((current) => [created, ...current]);
      setIsAddOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create challenge.';
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

      const updated = await updateChallenge(auth.token, editForm.id, payload);

      setChallenges((current) =>
        current.map((challenge) =>
          challenge.id === updated.id ? updated : challenge
        )
      );

      setIsEditOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update challenge.';
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const previewDemoVideo = async (challengeId: string) => {
    if (!auth?.token) return;

    try {
      const response = await getChallengeDemoVideoUrl(auth.token, challengeId);
      window.open(response.videoUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to open demo video.';
      window.alert(message);
    }
  };

  const getClubNames = (clubIds: string[]) => {
    return clubs
      .filter((club) => clubIds.includes(club.id))
      .map((club) => club.name)
      .join(', ');
  };

  const getStatusLabel = (challenge: ChallengeCmsResponse) => {
    const now = Date.now();

    if (challenge.startTime <= now && challenge.endTime >= now) {
      return 'Active';
    }

    if (challenge.startTime > now) {
      return 'Upcoming';
    }

    return 'Past';
  };

  return (
    <SidebarLayout
      title="Challenges"
      subtitle="Create and manage challenges across one or many clubs."
    >
      <div className="toolbar-card">
        <div className="toolbar-left">
          <label className="field toolbar-field">
            <span>Search challenges</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by challenge title"
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

          <label className="field toolbar-field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'ALL' | 'ACTIVE' | 'UPCOMING' | 'PAST'
                )
              }
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PAST">Past</option>
            </select>
          </label>
        </div>

        <div className="toolbar-actions">
          <button className="primary-button" onClick={openAddModal}>
            Add Challenge
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-card">
          <h2>Loading challenges...</h2>
        </div>
      ) : pageError ? (
        <div className="page-card">
          <h2>Unable to load challenges</h2>
          <p>{pageError}</p>
        </div>
      ) : filteredChallenges.length ? (
        <div className="challenge-list">
          {filteredChallenges.map((challenge) => (
            <div className="challenge-row-card" key={challenge.id}>
              <div className="challenge-row-main">
                <div className="challenge-row-top">
                  <h2>{challenge.title}</h2>
                  <span className={`status-pill ${getStatusLabel(challenge).toLowerCase()}`}>
                    {getStatusLabel(challenge)}
                  </span>
                </div>

                <p className="challenge-row-description">{challenge.description}</p>

                <div className="challenge-meta-grid">
                  <div>
                    <strong>Clubs</strong>
                    <div>{getClubNames(challenge.clubIds)}</div>
                  </div>
                  <div>
                    <strong>Scoring</strong>
                    <div>{challenge.scoringType}</div>
                  </div>
                  <div>
                    <strong>Difficulty</strong>
                    <div>{challenge.difficulty}</div>
                  </div>
                  <div>
                    <strong>Starts</strong>
                    <div>{formatDateTime(challenge.startTime)}</div>
                  </div>
                  <div>
                    <strong>Ends</strong>
                    <div>{formatDateTime(challenge.endTime)}</div>
                  </div>
                  <div>
                    <strong>Demo Video</strong>
                    <div>{challenge.demoVideoObjectKey ? 'Attached' : 'None'}</div>
                  </div>
                </div>
              </div>

              <div className="challenge-row-actions">
                {challenge.demoVideoObjectKey ? (
                  <button
                    className="secondary-button"
                    onClick={() => previewDemoVideo(challenge.id)}
                  >
                    Preview Video
                  </button>
                ) : null}

                <button
                  className="secondary-button"
                  onClick={() => openEditModal(challenge)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="page-card">
          <h2>No challenges found</h2>
          <p>Try changing the filters or create a new challenge.</p>
        </div>
      )}

      {isAddOpen ? (
        <ChallengeModal
          title="Add Challenge"
          clubs={clubs}
          form={addForm}
          saving={saving}
          uploadingVideo={uploadingVideo}
          onChange={setAddForm}
          onClose={() => setIsAddOpen(false)}
          onSubmit={submitAdd}
          onUploadDemoVideo={(file) => uploadDemoVideo(file, addForm, setAddForm)}
        />
      ) : null}

      {isEditOpen ? (
        <ChallengeModal
          title="Edit Challenge"
          clubs={clubs}
          form={editForm}
          saving={saving}
          uploadingVideo={uploadingVideo}
          onChange={setEditForm}
          onClose={() => setIsEditOpen(false)}
          onSubmit={submitEdit}
          onUploadDemoVideo={(file) => uploadDemoVideo(file, editForm, setEditForm)}
        />
      ) : null}
    </SidebarLayout>
  );
}
