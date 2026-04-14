import SidebarLayout from '../components/SidebarLayout';

export default function ClubsPage() {
  return (
    <SidebarLayout
      title="Clubs"
      subtitle="Create and manage clubs."
    >
      <div className="page-card">
        <h2>Clubs</h2>
        <p>This page will show the list of clubs and editing tools.</p>
      </div>
    </SidebarLayout>
  );
}