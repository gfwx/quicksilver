import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const model = searchParams.get('model');

    if (!query || !model) {
      return NextResponse.json(
        { error: 'Missing query or model parameter' },
        { status: 400 }
      );
    }

    // Forward the request to your Express server
    const response = await fetch(`${SERVER_URL}/api/query?query=${encodeURIComponent(query)}&model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to query server' },
        { status: response.status }
      );
    }

    // Check if the response is a streaming response
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      // Forward the streaming response
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control',
        },
      });
    }

    // For non-streaming responses, return JSON
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}
