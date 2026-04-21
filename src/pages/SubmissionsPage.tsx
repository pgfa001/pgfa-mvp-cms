import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { getChallenges } from '../api/challenges';
import type { ChallengeCmsResponse } from '../api/challenges';
import {
  getChallengeReviewSubmissions,
  getSubmissionDetails,
  verifySubmission,
} from '../api/submissions';
import type {
  ChallengeReviewSubmissionItemResponse,
  ChallengeSubmissionDetailsResponse,
  SubmissionValidationStatus,
} from '../api/submissions';

function formatDate(timestamp?: number | null) {
  if (!timestamp) return '-';

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return '-';
  }
}

type VerifyModalProps = {
  submission: ChallengeSubmissionDetailsResponse | null;
  verifying: boolean;
  onClose: () => void;
  onVerify: (status: SubmissionValidationStatus) => void;
};

function VerifyModal({
  submission,
  verifying,
  onClose,
  onVerify,
}: VerifyModalProps) {
  if (!submission) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-card-large">
        <div className="modal-header">
          <h2>Review Submission</h2>
          <button className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="submission-detail-layout">
          <div className="submission-video-panel">
            <video
              key={submission.videoUrl}
              controls
              className="submission-video"
              src={submission.videoUrl}
            />
          </div>

          <div className="submission-info-panel">
            <div className="submission-detail-block">
              <strong>Challenge</strong>
              <div>{submission.challengeTitle}</div>
            </div>

            <div className="submission-detail-block">
              <strong>Athlete</strong>
              <div>{submission.athleteName}</div>
            </div>

            <div className="submission-detail-block">
              <strong>Team</strong>
              <div>{submission.teamName}</div>
            </div>

            <div className="submission-detail-block">
              <strong>Score</strong>
              <div>{submission.score}</div>
            </div>

            <div className="submission-detail-block">
              <strong>Status</strong>
              <div>{submission.validationStatus}</div>
            </div>

            <div className="submission-detail-block">
              <strong>Submitted</strong>
              <div>{formatDate(submission.createdAt)}</div>
            </div>

            {submission.validatedAt ? (
              <div className="submission-detail-block">
                <strong>Last reviewed</strong>
                <div>{formatDate(submission.validatedAt)}</div>
              </div>
            ) : null}

            <div className="submission-review-actions">
              <button
                className="secondary-button"
                disabled={verifying}
                onClick={() => onVerify('INVALID')}
              >
                {verifying ? 'Saving...' : 'Mark Invalid'}
              </button>

              <button
                className="primary-button"
                disabled={verifying}
                onClick={() => onVerify('VALIDATED')}
              >
                {verifying ? 'Saving...' : 'Verify Submission'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionsPage() {
  const { auth } = useAuth();

  const [challenges, setChallenges] = useState<ChallengeCmsResponse[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');

  const [submissions, setSubmissions] = useState<
    ChallengeReviewSubmissionItemResponse[]
  >([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | SubmissionValidationStatus
  >('ALL');

  const [selectedSubmission, setSelectedSubmission] =
    useState<ChallengeSubmissionDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadChallenges = async () => {
      if (!auth?.token) return;

      try {
        setLoadingChallenges(true);
        setPageError(null);

        const response = await getChallenges(auth.token);
        setChallenges(response.challenges);

        if (response.challenges.length > 0) {
          setSelectedChallengeId(response.challenges[0].id);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load challenges.';
        setPageError(message);
      } finally {
        setLoadingChallenges(false);
      }
    };

    loadChallenges();
  }, [auth?.token]);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!auth?.token || !selectedChallengeId) {
        setSubmissions([]);
        return;
      }

      try {
        setLoadingSubmissions(true);
        setPageError(null);

        const response = await getChallengeReviewSubmissions(
          auth.token,
          selectedChallengeId,
          teamFilter || undefined
        );

        setSubmissions(response.submissions);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load submissions.';
        setPageError(message);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, [auth?.token, selectedChallengeId, teamFilter]);

  const uniqueTeams = useMemo(() => {
    const seen = new Map<string, string>();

    submissions.forEach((submission) => {
      seen.set(submission.teamId, submission.teamName);
    });

    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((submission) => {
        const query = search.trim().toLowerCase();

        const matchesSearch = query
          ? submission.athleteName.toLowerCase().includes(query) ||
            submission.teamName.toLowerCase().includes(query)
          : true;

        const matchesStatus =
          statusFilter === 'ALL'
            ? true
            : submission.validationStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [submissions, search, statusFilter]);

  const openSubmission = async (submissionId: string) => {
    if (!auth?.token) return;

    try {
      setDetailsLoading(true);
      const details = await getSubmissionDetails(auth.token, submissionId);
      setSelectedSubmission(details);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load submission.';
      window.alert(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVerify = async (status: SubmissionValidationStatus) => {
    if (!auth?.token || !selectedSubmission) return;

    try {
      setVerifying(true);

      await verifySubmission(auth.token, selectedSubmission.submissionId, {
        validationStatus: status,
      });

      setSelectedSubmission((current) =>
        current
          ? {
              ...current,
              validationStatus: status,
              validatedAt: Date.now(),
            }
          : current
      );

      setSubmissions((current) =>
        current.map((submission) =>
          submission.submissionId === selectedSubmission.submissionId
            ? { ...submission, validationStatus: status }
            : submission
        )
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to verify submission.';
      window.alert(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SidebarLayout
      title="Submissions"
      subtitle="Select a challenge to review athlete submissions and verify them."
    >
      <div className="toolbar-card">
        <div className="toolbar-left">
          <label className="field toolbar-field">
            <span>Challenge</span>
            <select
              value={selectedChallengeId}
              onChange={(event) => {
                setSelectedChallengeId(event.target.value);
                setTeamFilter('');
              }}
            >
              <option value="">Select challenge</option>
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field toolbar-field">
            <span>Team</span>
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="">All teams</option>
              {uniqueTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field toolbar-field">
            <span>Search athlete or team</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Athlete or team"
            />
          </label>

          <label className="field toolbar-field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'ALL' | SubmissionValidationStatus
                )
              }
            >
              <option value="ALL">All</option>
              <option value="NOT_VALIDATED">Pending Review</option>
              <option value="VALIDATED">Validated</option>
              <option value="INVALID">Invalid</option>
            </select>
          </label>
        </div>
      </div>

      {loadingChallenges ? (
        <div className="page-card">
          <h2>Loading challenges...</h2>
        </div>
      ) : pageError ? (
        <div className="page-card">
          <h2>Unable to load submissions</h2>
          <p>{pageError}</p>
        </div>
      ) : !selectedChallengeId ? (
        <div className="page-card">
          <h2>Select a challenge</h2>
          <p>Choose a challenge above to view submissions.</p>
        </div>
      ) : loadingSubmissions ? (
        <div className="page-card">
          <h2>Loading submissions...</h2>
        </div>
      ) : filteredSubmissions.length ? (
        <div className="submission-list">
          {filteredSubmissions.map((submission) => (
            <div className="submission-row-card" key={submission.submissionId}>
              <div className="submission-row-main">
                <div className="submission-row-top">
                  <h2>{submission.athleteName}</h2>
                  <span
                    className={`status-pill ${submission.validationStatus.toLowerCase()}`}
                  >
                    {submission.validationStatus}
                  </span>
                </div>

                <p className="submission-row-subtitle">{submission.teamName}</p>

                <div className="submission-meta-grid">
                  <div>
                    <strong>Score</strong>
                    <div>{submission.score}</div>
                  </div>
                  <div>
                    <strong>Submitted</strong>
                    <div>{formatDate(submission.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="submission-row-actions">
                <button
                  className="secondary-button"
                  onClick={() => openSubmission(submission.submissionId)}
                  disabled={detailsLoading}
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="page-card">
          <h2>No submissions found</h2>
          <p>Try changing your filters or choose another challenge.</p>
        </div>
      )}

      <VerifyModal
        submission={selectedSubmission}
        verifying={verifying}
        onClose={() => setSelectedSubmission(null)}
        onVerify={handleVerify}
      />
    </SidebarLayout>
  );
}