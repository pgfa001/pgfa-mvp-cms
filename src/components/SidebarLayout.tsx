import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/auth-context';
import type { UserRole } from '../types/api';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  to: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', roles: ['ADMIN', 'SUPERADMIN', 'COACH'] },
  { label: 'Clubs', to: '/clubs', roles: ['SUPERADMIN'] },
  { label: 'Teams', to: '/teams', roles: ['SUPERADMIN', 'ADMIN'] },
  { label: 'Users', to: '/users', roles: ['SUPERADMIN'] },
  { label: 'Challenges', to: '/challenges', roles: ['SUPERADMIN'] },
  { label: 'Submissions', to: '/submissions', roles: ['SUPERADMIN', 'ADMIN', 'COACH'] },
];

export default function SidebarLayout({ title, subtitle, children }: Props) {
  const { auth, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) =>
    auth?.role ? item.roles.includes(auth.role) : false
  );

  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <div>
          <div className="sidebar-brand">
            <p className="eyebrow">Proving Ground</p>
            <h2>CMS</h2>
          </div>

          <nav className="sidebar-nav">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link active' : 'sidebar-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-name">{auth?.username}</div>
            <div className="sidebar-user-role">{auth?.role}</div>
          </div>

          <button className="secondary-button full-width" onClick={logout}>
            Log Out
          </button>
        </div>
      </aside>

      <main className="cms-main">
        <header className="cms-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p className="subtext">{subtitle}</p> : null}
          </div>
        </header>

        <section className="cms-content">{children}</section>
      </main>
    </div>
  );
}
