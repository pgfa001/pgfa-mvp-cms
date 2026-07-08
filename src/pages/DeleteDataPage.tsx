import logoImage from '../assets/pgfa-logo.jpg';

export default function DeleteDataPage() {
  return (
    <main className="public-page public-policy-page">
      <article className="public-policy-document">
        <img className="public-logo" src={logoImage} alt="Proving Ground FA" />
        <p className="eyebrow">Data Deletion</p>
        <h1>Request Account or Data Deletion</h1>
        <p>
          Proving Ground FA users may request deletion of their account and
          associated personal data by contacting our support team.
        </p>

        <h2>How to Request Deletion</h2>
        <p>
          Email us at{' '}
          <a href="mailto:info@provinggroundfa.com?subject=Data%20Deletion%20Request">
            info@provinggroundfa.com
          </a>{' '}
          with the subject line <strong>Data Deletion Request</strong>.
        </p>
        <p>Please include:</p>
        <ul>
          <li>Your full name.</li>
          <li>Your Proving Ground FA username.</li>
          <li>The email address or phone number associated with your account.</li>
          <li>Your club or team name, if applicable.</li>
          <li>
            Whether you are requesting deletion for yourself or for a child
            account you manage.
          </li>
        </ul>

        <h2>What We Delete</h2>
        <p>
          After verifying the request, we will delete or de-identify personal
          account information where required and remove data that is no longer
          needed to provide the service.
        </p>
        <p>
          Some records may be retained where necessary for legal, security,
          fraud-prevention, payment, dispute-resolution, club administration, or
          backup purposes.
        </p>

        <h2>Challenge Submissions</h2>
        <p>
          If your account includes uploaded videos, photos, challenge attempts,
          scores, or leaderboard data, we will review those records as part of
          the deletion request. Some submission records may be retained or
          de-identified if needed for integrity, safety, legal, or operational
          reasons.
        </p>

        <h2>Response Time</h2>
        <p>
          We will respond to deletion requests as soon as reasonably possible.
          We may ask for additional information to verify your identity or
          authority to request deletion for a child account.
        </p>

        <div className="public-link-row">
          <a
            className="public-primary-link"
            href="mailto:info@provinggroundfa.com?subject=Data%20Deletion%20Request"
          >
            Request Deletion
          </a>
          <a className="public-secondary-link" href="/privacy-policy">
            Privacy Policy
          </a>
        </div>
      </article>
    </main>
  );
}
