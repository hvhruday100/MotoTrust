import { NextRequest, NextResponse } from 'next/server';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const { idToken } = (await request.json()) as { idToken?: string };

  if (!idToken) {
    return NextResponse.json({ message: 'Firebase ID token is required.' }, { status: 400 });
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json({ message: errorBody || 'Unable to create MotoTrust session.' }, { status: response.status });
  }

  const user = await response.json();
  const secure = process.env.NODE_ENV === 'production';
  const nextResponse = NextResponse.json(user);

  nextResponse.cookies.set('mototrust_token', idToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60
  });
  nextResponse.cookies.set('mototrust_role', user.role, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60
  });

  return nextResponse;
}
