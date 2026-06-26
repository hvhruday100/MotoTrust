import { NextRequest, NextResponse } from 'next/server';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  const token = request.cookies.get('mototrust_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const response = await fetch(`${apiBaseUrl}/api/service-tasks/${params.taskId}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: await request.text(),
    cache: 'no-store'
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json'
    }
  });
}
