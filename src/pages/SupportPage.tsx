import logoImage from '../assets/pgfa-logo.jpg';

export default function SupportPage() {
  return (
    <main className="public-page public-support-page">
      <section className="public-content public-support-content">
        <img className="public-logo" src={logoImage} alt="Proving Ground FA" />
        <p className="eyebrow">Support</p>
        <h1>Proving Ground FA Support</h1>
        <p>
          For account help, club access, subscriptions, submissions, or app
          questions, contact the Proving Ground FA team.
        </p>
        <a className="public-primary-link" href="mailto:info@provinggroundfa.com">
          info@provinggroundfa.com
        </a>
      </section>
    </main>
  );
}
