import Link from 'next/link';
import type { ReactNode } from 'react';
import type { UserRole } from '../lib/api';

type AppShellProps = {
  role?: UserRole;
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  headerExtras?: ReactNode;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
};

const publicNav: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Log in' }
];

const roleNav: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { href: '/bookings', label: 'Bookings' },
    { href: '/motorcycles', label: 'Motorcycles' },
    { href: '/register', label: 'Profile' }
  ],
  MECHANIC: [{ href: '/mechanic/tasks', label: 'Task Board' }],
  ADMIN: [
    { href: '/admin/bookings', label: 'Dashboard' },
    { href: '/admin/inspections', label: 'Inspections' },
    { href: '/admin/service-execution', label: 'Service Board' }
  ]
};

function isActivePath(currentPath: string, href: string) {
  if (href === '/') {
    return currentPath === '/';
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function getWorkspaceLabel(role?: UserRole) {
  switch (role) {
    case 'ADMIN':
      return 'Admin Workspace';
    case 'MECHANIC':
      return 'Mechanic Workspace';
    case 'CUSTOMER':
      return 'Customer Workspace';
    default:
      return 'Transparent motorcycle servicing';
  }
}

export function AppShell({
  role,
  currentPath,
  eyebrow,
  title,
  description,
  actions,
  headerExtras,
  children
}: AppShellProps) {
  const navigation = role ? roleNav[role] : publicNav;
  const showSidebar = role === 'ADMIN' || role === 'MECHANIC';

  return (
    <div className={`workspace-shell${showSidebar ? ' with-sidebar' : ''}`}>
      <header className="app-header">
        <div className="brand-cluster">
          <Link href={role ? (navigation[0]?.href ?? '/') : '/'} className="brand-link">
            MotoTrust
          </Link>
          <p>{getWorkspaceLabel(role)}</p>
        </div>

        <nav className="header-nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActivePath(currentPath, item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          {headerExtras}
          {role ? <Link href="/auth/logout">Log out</Link> : null}
        </nav>
      </header>

      <div className="workspace-main">
        {showSidebar ? (
          <aside className="workspace-sidebar">
            <div className="sidebar-card">
              <p className="sidebar-label">{getWorkspaceLabel(role)}</p>
              <nav className="sidebar-nav" aria-label="Workspace">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActivePath(currentPath, item.href) ? 'active' : ''}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}

        <div className="workspace-content">
          <section className="page-hero">
            <div className="hero-copy">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="lede">{description}</p>
            </div>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </section>

          {children}
        </div>
      </div>
    </div>
  );
}
