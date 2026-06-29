import { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { rememberAdminClub, useAuth } from '../context/auth-context';
import {
  createClub,
  createClubAdmin,
  createClubLogoUploadUrl,
  deleteClub,
  getClubs,
  updateClub,
} from '../api/clubs';
import type {
  ClubCmsResponse,
} from '../api/clubs';
import type { SubscriptionType } from '../types/api';

type ClubFormState = {
  id?: string;
  name: string;
  logoObjectKey: string;
  logoFileName: string;
  accessCode: string;
  primaryColor: string;
  accentColor: string;
  subscriptionType: SubscriptionType;
};

type ClubAdminFormState = {
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  dob: string;
  clubIds: string[];
};

const subscriptionOptions: SubscriptionType[] = ['CLUB_PAID', 'ATHLETE_PAID'];

function emptyForm(): ClubFormState {
  return {
    name: '',
    logoObjectKey: '',
    logoFileName: '',
    accessCode: '',
    primaryColor: '#111111',
    accentColor: '#2563eb',
    subscriptionType: 'CLUB_PAID',
  };
}

function emptyAdminForm(): ClubAdminFormState {
  return {
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    dob: '',
    clubIds: [],
  };
}

function getClubLogoUrlValue(club: ClubCmsResponse) {
  return (club.logoUrl ?? '').trim();
}

function getClubLogoObjectKey(club: ClubCmsResponse) {
  return (club.logoObjectKey ?? '').trim();
}

function ClubModal({
  title,
  form,
  adminForm,
  availableAdminClubs = [],
  saving,
  uploading,
  requireAdmin,
  onChange,
  onAdminChange,
  onClose,
  onSubmit,
  onUploadLogo,
}: {
  title: string;
  form: ClubFormState;
  adminForm?: ClubAdminFormState;
  availableAdminClubs?: ClubCmsResponse[];
  saving: boolean;
  uploading: boolean;
  requireAdmin?: boolean;
  onChange: (next: ClubFormState) => void;
  onAdminChange?: (next: ClubAdminFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onUploadLogo: (file: File) => Promise<void>;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-form">
          <label className="field">
            <span>Club name</span>
            <input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Access code</span>
            <input
              value={form.accessCode}
              onChange={(e) => onChange({ ...form, accessCode: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Subscription type</span>
            <select
              value={form.subscriptionType}
              onChange={(e) =>
                onChange({
                  ...form,
                  subscriptionType: e.target.value as SubscriptionType,
                })
              }
            >
              {subscriptionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>

          <div className="two-column-grid">
            <label className="field">
              <span>Primary color</span>
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => onChange({ ...form, primaryColor: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Accent color</span>
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => onChange({ ...form, accentColor: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Club logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onUploadLogo(file);
              }}
            />
          </label>

          <div className="challenge-demo-status">
            {uploading ? 'Uploading logo...' : form.logoObjectKey ? `Logo attached: ${form.logoFileName}` : 'No logo attached'}
          </div>

          {requireAdmin && adminForm && onAdminChange ? (
            <div className="form-section">
              <div>
                <h3>Club Admin</h3>
                <p className="subtext">Create the ADMIN account assigned to this club.</p>
              </div>

              <label className="field">
                <span>Name</span>
                <input
                  value={adminForm.name}
                  onChange={(e) =>
                    onAdminChange({ ...adminForm, name: e.target.value })
                  }
                />
              </label>

              <div className="two-column-grid">
                <label className="field">
                  <span>Username</span>
                  <input
                    value={adminForm.username}
                    onChange={(e) =>
                      onAdminChange({ ...adminForm, username: e.target.value })
                    }
                    autoComplete="off"
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) =>
                      onAdminChange({ ...adminForm, password: e.target.value })
                    }
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="two-column-grid">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      onAdminChange({ ...adminForm, email: e.target.value })
                    }
                  />
                </label>

                <label className="field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={adminForm.phone}
                    onChange={(e) =>
                      onAdminChange({ ...adminForm, phone: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={adminForm.dob}
                  onChange={(e) =>
                    onAdminChange({ ...adminForm, dob: e.target.value })
                  }
                />
              </label>

              {availableAdminClubs.length ? (
                <div className="field">
                  <span>Additional clubs</span>
                  <div className="checkbox-grid user-team-grid">
                    {availableAdminClubs.map((club) => {
                      const checked = adminForm.clubIds.includes(club.id);

                      return (
                        <label key={club.id} className="checkbox-card">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              onAdminChange({
                                ...adminForm,
                                clubIds: checked
                                  ? adminForm.clubIds.filter((id) => id !== club.id)
                                  : [...adminForm.clubIds, club.id],
                              })
                            }
                          />
                          <span>{club.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" onClick={onSubmit} disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save Club'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const { auth } = useAuth();
  const [clubs, setClubs] = useState<ClubCmsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [addForm, setAddForm] = useState<ClubFormState>(emptyForm());
  const [addAdminForm, setAddAdminForm] =
    useState<ClubAdminFormState>(emptyAdminForm());
  const [editForm, setEditForm] = useState<ClubFormState>(emptyForm());

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) return;
      try {
        setLoading(true);
        setPageError(null);
        const response = await getClubs(auth.token);
        setClubs(response.clubs);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : 'Unable to load clubs.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth?.token]);

  const filtered = clubs.filter((club) =>
    club.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const validateForm = (form: ClubFormState) => {
    if (!form.name.trim()) throw new Error('Club name is required.');
    if (!form.accessCode.trim()) throw new Error('Access code is required.');

    return {
      name: form.name.trim(),
      logoObjectKey: form.logoObjectKey || null,
      accessCode: form.accessCode.trim(),
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      subscriptionType: form.subscriptionType,
    };
  };

  const validateAdminForm = (form: ClubAdminFormState) => {
    if (!form.name.trim()) throw new Error('Club admin name is required.');
    if (!form.username.trim()) throw new Error('Club admin username is required.');
    if (!form.password) throw new Error('Club admin password is required.');
    if (!form.email.trim()) throw new Error('Club admin email is required.');
    if (!form.phone.trim()) throw new Error('Club admin phone is required.');
    if (!form.dob) throw new Error('Club admin date of birth is required.');

    return {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim(),
      phone: form.phone.trim(),
      dob: form.dob,
      clubIds: form.clubIds,
    };
  };

  const uploadLogo = async (
    file: File,
    form: ClubFormState,
    setForm: (next: ClubFormState) => void
  ) => {
    if (!auth?.token) return;

    try {
      setUploadingLogo(true);
      const upload = await createClubLogoUploadUrl(auth.token, file.name, file.type || 'image/png');

      const putResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/png',
        },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error(`Logo upload failed (${putResponse.status})`);
      }

      setForm({
        ...form,
        logoObjectKey: upload.objectKey,
        logoFileName: file.name,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const submitAdd = async () => {
    if (!auth?.token) return;
    try {
      setSaving(true);
      const payload = validateForm(addForm);
      const adminPayload = validateAdminForm(addAdminForm);
      const created = await createClub(auth.token, payload);
      setClubs((current) => [created, ...current]);

      try {
        await createClubAdmin(auth.token, created.id, adminPayload);
        rememberAdminClub(adminPayload.username, created.id, created.name);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to create club admin.';
        throw new Error(`Club was created, but the admin user was not: ${message}`);
      }

      setIsAddOpen(false);
      setAddForm(emptyForm());
      setAddAdminForm(emptyAdminForm());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to create club.');
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!auth?.token || !editForm.id) return;
    try {
      setSaving(true);
      const payload = validateForm(editForm);
      const updated = await updateClub(auth.token, editForm.id, payload);
      setClubs((current) => current.map((club) => (club.id === updated.id ? updated : club)));
      setIsEditOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to update club.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (club: ClubCmsResponse) => {
    const logoObjectKey = getClubLogoObjectKey(club);

    setEditForm({
      id: club.id,
      name: club.name,
      logoObjectKey,
      logoFileName: logoObjectKey.split('/').pop() ?? '',
      accessCode: club.accessCode,
      primaryColor: club.primaryColor,
      accentColor: club.accentColor,
      subscriptionType: club.subscriptionType,
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (clubId: string) => {
    if (!auth?.token) return;
    const confirmed = window.confirm('Delete this club?');
    if (!confirmed) return;

    try {
      await deleteClub(auth.token, clubId);
      setClubs((current) => current.filter((club) => club.id !== clubId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete club.');
    }
  };

  return (
    <SidebarLayout
      title="Clubs"
      subtitle="Create, edit, and brand clubs for the app."
    >
      <div className="toolbar-card">
        <div className="toolbar-left">
          <label className="field toolbar-field">
            <span>Search clubs</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by club name"
            />
          </label>
        </div>

        <div className="toolbar-actions">
          <button className="primary-button" onClick={() => setIsAddOpen(true)}>
            Add Club
          </button>
        </div>
      </div>

      {loading ? (
        <div className="page-card"><h2>Loading clubs...</h2></div>
      ) : pageError ? (
        <div className="page-card"><h2>Unable to load clubs</h2><p>{pageError}</p></div>
      ) : filtered.length ? (
        <div className="challenge-list">
          {filtered.map((club) => {
            const logoUrl = getClubLogoUrlValue(club);
            const hasLogo = logoUrl.length > 0;

            return (
              <div className="challenge-row-card" key={club.id}>
                <div className="challenge-row-main">
                  <div className="challenge-row-top">
                    <h2>{club.name}</h2>
                    <span className="status-pill active">{club.subscriptionType}</span>
                  </div>

                  <div className="challenge-meta-grid">
                    <div>
                      <strong>Access Code</strong>
                      <div>{club.accessCode}</div>
                    </div>
                    <div>
                      <strong>Primary Color</strong>
                      <div>{club.primaryColor}</div>
                    </div>
                    <div>
                      <strong>Accent Color</strong>
                      <div>{club.accentColor}</div>
                    </div>
                    <div>
                      <strong>Logo</strong>
                      <div>
                        {hasLogo ? (
                          <a href={logoUrl} target="_blank" rel="noreferrer">
                            View logo
                          </a>
                        ) : (
                          'None'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="challenge-row-actions">
                  <button className="secondary-button" onClick={() => openEdit(club)}>
                    Edit
                  </button>
                  <button className="secondary-button" onClick={() => handleDelete(club.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="page-card">
          <h2>No clubs found</h2>
          <p>Create your first club to get started.</p>
        </div>
      )}

      {isAddOpen ? (
        <ClubModal
          title="Add Club"
          form={addForm}
          adminForm={addAdminForm}
          availableAdminClubs={clubs}
          saving={saving}
          uploading={uploadingLogo}
          requireAdmin
          onChange={setAddForm}
          onAdminChange={setAddAdminForm}
          onClose={() => setIsAddOpen(false)}
          onSubmit={submitAdd}
          onUploadLogo={(file) => uploadLogo(file, addForm, setAddForm)}
        />
      ) : null}

      {isEditOpen ? (
        <ClubModal
          title="Edit Club"
          form={editForm}
          saving={saving}
          uploading={uploadingLogo}
          onChange={setEditForm}
          onClose={() => setIsEditOpen(false)}
          onSubmit={submitEdit}
          onUploadLogo={(file) => uploadLogo(file, editForm, setEditForm)}
        />
      ) : null}
    </SidebarLayout>
  );
}
