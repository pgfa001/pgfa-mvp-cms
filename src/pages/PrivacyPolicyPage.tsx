import logoImage from '../assets/pgfa-logo.jpg';

export default function PrivacyPolicyPage() {
  return (
    <main className="public-page public-policy-page">
      <article className="public-policy-document">
        <img className="public-logo" src={logoImage} alt="Proving Ground FA" />
        <p className="eyebrow">Privacy Policy</p>
        <h1>Proving Ground FA Privacy Policy</h1>
        <p>
          <strong>Effective Date:</strong> July 8, 2026
        </p>
        <p>
          Proving Ground Futbol Academy, LLC, doing business as Proving Ground
          FA, respects your privacy. This Privacy Policy explains how we collect,
          use, disclose, and protect information when you use the Proving Ground
          FA app, CMS, websites, and related services.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect account information such as name, username, password,
          email address, phone number, date of birth, gender, location,
          position, club, team, and role. We may also collect parent-child
          account relationships where a parent manages a child athlete account.
        </p>
        <p>
          We collect app activity and challenge information, including teams,
          challenge attempts, scores, rankings, validation status, uploaded
          videos or photos, and related submission metadata.
        </p>
        <p>
          We may collect technical information such as device type, app version,
          log data, identifiers, and general usage information needed to operate,
          secure, and improve the service.
        </p>

        <h2>How We Use Information</h2>
        <ul>
          <li>To create and manage user, parent, athlete, coach, and club accounts.</li>
          <li>To run challenges, leaderboards, submissions, and review workflows.</li>
          <li>To provide support, account notices, and service communications.</li>
          <li>To maintain security, prevent misuse, and troubleshoot issues.</li>
          <li>To improve the app, club tools, and overall user experience.</li>
        </ul>

        <h2>Challenge Submissions and Media</h2>
        <p>
          The app may allow athletes or parents to upload videos, photos, or
          other content for challenge participation and review. Uploaded content
          may be visible to authorized users such as club admins, coaches, or
          reviewers, and may be used as described in our terms and media release.
        </p>

        <h2>Children and Parent Accounts</h2>
        <p>
          Proving Ground FA may be used by youth athletes with parent or guardian
          involvement. Parents or guardians can contact us to request help with a
          child account, review available account information, or request account
          deletion where applicable.
        </p>

        <h2>How We Share Information</h2>
        <p>
          We do not sell personal information. We may share information with
          clubs, coaches, admins, and parents as needed to operate the service.
          We may also use trusted service providers for hosting, storage,
          payments, analytics, email, security, and other operational needs.
        </p>
        <p>
          We may disclose information if required by law, to protect rights and
          safety, to investigate misuse, or in connection with a business
          transfer such as a merger, acquisition, or sale of assets.
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain information for as long as needed to provide the service,
          maintain records, resolve disputes, enforce agreements, and satisfy
          legal or operational requirements. Some content may remain in backups
          or records for a limited period after deletion.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable administrative, technical, and organizational
          measures to protect information. No method of transmission or storage
          is completely secure, so we cannot guarantee absolute security.
        </p>

        <h2>Your Choices</h2>
        <p>
          You may contact us to request account support, correction, deletion,
          or help with privacy questions. Some requests may be limited by club
          administration needs, legal requirements, safety, fraud prevention, or
          backup retention.
        </p>
        <p>
          You can also visit our{' '}
          <a href="/delete-data">Data Deletion Request page</a> for deletion
          instructions.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will update the effective date and may provide
          additional notice through the app or other appropriate channels.
        </p>

        <h2>Contact Us</h2>
        <p>
          For privacy questions or support, contact us at{' '}
          <a href="mailto:info@provinggroundfa.com">info@provinggroundfa.com</a>.
        </p>
      </article>
    </main>
  );
}
