import { NextRequest, NextResponse } from 'next/server';

function redirectForRole(role: string | undefined): string {
  if (role === 'ADMIN') {
    return '/admin/bookings';
  }

  if (role === 'MECHANIC') {
    return '/mechanic/tasks';
  }

  return '/bookings';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('mototrust_token')?.value;
  const role = request.cookies.get('mototrust_role')?.value;

  const isAuthPage = pathname === '/login';
  const requiresAuth =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mechanic') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/motorcycles') ||
    pathname === '/register';

  if (!token && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(redirectForRole(role), request.url));
  }

  if (token && pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(redirectForRole(role), request.url));
  }

  if (token && pathname.startsWith('/mechanic') && role !== 'MECHANIC') {
    return NextResponse.redirect(new URL(redirectForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/mechanic/:path*', '/bookings/:path*', '/motorcycles', '/register', '/login']
};
