import SidebarLayout from '../components/SidebarLayout';

export default function UsersPage() {
  return (
    <SidebarLayout
      title="Users"
      subtitle="View and manage registered users."
    >
      <div className="page-card">
        <h2>Users</h2>
        <p>This page will show athletes, parents, coaches, and admins.</p>
      </div>
    </SidebarLayout>
  );
}