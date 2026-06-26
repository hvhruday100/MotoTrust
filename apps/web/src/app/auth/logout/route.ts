import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('mototrust_token');
  response.cookies.delete('mototrust_role');
  return response;
}
