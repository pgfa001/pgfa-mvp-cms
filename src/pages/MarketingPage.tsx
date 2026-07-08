import logoImage from '../assets/pgfa-logo.jpg';
import appScreenshot from '../assets/pgfa-app-screenshot.png';

export default function MarketingPage() {
  return (
    <main className="public-page marketing-page">
      <section className="marketing-hero">
        <div className="marketing-hero-media">
          <img
            className="marketing-phone-shot"
            src={appScreenshot}
            alt="Proving Ground FA challenge screen"
          />
        </div>

        <div className="marketing-hero-copy">
          <img className="public-logo" src={logoImage} alt="Proving Ground FA" />
          <p className="eyebrow">Proving Ground FA</p>
          <h1>Train, compete, and prove it.</h1>
          <p>
            Proving Ground FA gives clubs a focused way to run skill challenges,
            review athlete submissions, and keep teams competing from anywhere.
          </p>
          <div className="public-link-row">
            <a className="public-primary-link" href="/support">
              Get Support
            </a>
            <a className="public-secondary-link" href="/terms-of-service">
              Terms of Service
            </a>
            <a className="public-secondary-link" href="/privacy-policy">
              Privacy Policy
            </a>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div>
          <h2>Built For Club Competition</h2>
          <p>
            Athletes submit challenge videos, coaches and admins review results,
            and teams can compare progress through verified leaderboards.
          </p>
        </div>
        <div className="marketing-feature-grid">
          <article>
            <h3>Skill Challenges</h3>
            <p>Launch club challenges with clear scoring and submission windows.</p>
          </article>
          <article>
            <h3>Verified Results</h3>
            <p>Review submissions before they count toward team rankings.</p>
          </article>
          <article>
            <h3>Club Focused</h3>
            <p>Keep athletes, teams, coaches, and admins organized by club.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
