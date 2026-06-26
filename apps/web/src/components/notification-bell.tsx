import Link from 'next/link';
import { api } from '../lib/api';

export async function NotificationBell() {
  const unreadCount = (await api.getUnreadNotificationCount().catch(() => ({ unreadCount: 0 }))).unreadCount;

  return (
    <Link href="/notifications" className="notification-bell" aria-label="Open notifications">
      <span className="notification-bell-icon">Notifications</span>
      {unreadCount > 0 ? <span className="notification-bell-badge">{unreadCount}</span> : null}
    </Link>
  );
}
