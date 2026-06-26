import { redirect } from 'next/navigation';
import { api, AppUser, UserRole } from './api';

export async function getCurrentSessionUser(): Promise<AppUser | null> {
  try {
    return await api.getCurrentUser();
  } catch {
    return null;
  }
}

export async function requireSessionUser(allowedRoles?: UserRole[]): Promise<AppUser> {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    redirect(getRoleHome(user.role));
  }

  return user;
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/bookings';
    case 'MECHANIC':
      return '/mechanic/tasks';
    default:
      return '/bookings';
  }
}
