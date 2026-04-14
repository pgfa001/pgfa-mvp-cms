import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { auth } = useAuth();

  return (
    <SidebarLayout
      title="Dashboard"
      subtitle="Overview of your club operations and current challenge activity."
    >
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>Welcome back</h2>
          <p>
            Signed in as <strong>{auth?.username}</strong> ({auth?.role})
          </p>
        </section>

        <section className="dashboard-card">
          <h2>Clubs</h2>
          <p>Manage club branding, access codes, and subscription settings.</p>
        </section>

        <section className="dashboard-card">
          <h2>Teams</h2>
          <p>Create and organize teams within clubs.</p>
        </section>

        <section className="dashboard-card">
          <h2>Challenges</h2>
          <p>Create weekly challenges and manage challenge metadata.</p>
        </section>

        <section className="dashboard-card">
          <h2>Submissions</h2>
          <p>Review videos, verify attempts, and monitor participation.</p>
        </section>
      </div>
    </SidebarLayout>
  );
}