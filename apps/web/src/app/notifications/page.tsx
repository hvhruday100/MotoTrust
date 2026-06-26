import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { NotificationBell } from '../../components/notification-bell';
import { api } from '../../lib/api';
import { getRoleHome, requireSessionUser } from '../../lib/session';

async function markNotificationRead(formData: FormData) {
  'use server';

  const notificationId = String(formData.get('notificationId') ?? '');
  const actionUrl = String(formData.get('actionUrl') ?? '');

  await api.markNotificationAsRead(notificationId);

  if (actionUrl) {
    redirect(actionUrl);
  }

  redirect('/notifications');
}

async function markAllNotificationsRead() {
  'use server';

  await api.markAllNotificationsAsRead();
  redirect('/notifications');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function roleDescription(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Operational alerts, new bookings, and workload warnings appear here.';
    case 'MECHANIC':
      return 'Task assignment updates and approval signals appear here.';
    default:
      return 'Booking updates, approval prompts, and delivery milestones appear here.';
  }
}

export default async function NotificationsPage() {
  const user = await requireSessionUser();
  const notifications = await api.listNotifications();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <AppShell
      role={user.role}
      currentPath="/notifications"
      eyebrow="Notifications"
      title="Notification center"
      description={roleDescription(user.role)}
      headerExtras={<NotificationBell />}
      actions={
        <div className="actions">
          <Link href={getRoleHome(user.role)}>Back to workspace</Link>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsRead}>
              <button type="submit">Mark all read</button>
            </form>
          ) : null}
        </div>
      }
    >
      <section className="surface">
        <div className="metric-grid">
          <article className="metric-card">
            <strong>{notifications.length}</strong>
            <span>Total notifications</span>
          </article>
          <article className="metric-card">
            <strong>{unreadCount}</strong>
            <span>Unread items</span>
          </article>
        </div>
      </section>

      <section className="ops-list">
        {notifications.length ? (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`booking-row notification-row${notification.isRead ? '' : ' unread'}`}
            >
              <div className="booking-summary">
                <p className="mono">{notification.category}</p>
                <h2>{notification.title}</h2>
                <p>{notification.message}</p>
                <p>{formatDate(notification.createdAt)}</p>
              </div>
              <div className="actions">
                {notification.actionUrl ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <input type="hidden" name="actionUrl" value={notification.actionUrl} />
                    <button type="submit">{notification.isRead ? 'Open' : 'Open and mark read'}</button>
                  </form>
                ) : null}
                {!notification.isRead ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button type="submit">Mark read</button>
                  </form>
                ) : null}
                {notification.bookingId ? (
                  <Link href={`/bookings/progress?bookingId=${notification.bookingId}`}>
                    Booking timeline
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <article className="timeline-card">
            <h2>All quiet</h2>
            <p className="muted">New notifications will show up here as bookings move through service.</p>
          </article>
        )}
      </section>
    </AppShell>
  );
}
