import SidebarLayout from '../components/SidebarLayout';

export default function SubmissionsPage() {
  return (
    <SidebarLayout
      title="Submissions"
      subtitle="Review and verify athlete submissions."
    >
      <div className="page-card">
        <h2>Submissions</h2>
        <p>This page will show challenge submissions and verification tools.</p>
      </div>
    </SidebarLayout>
  );
}