import { NextResponse } from 'next/server';
import { getOrInitializeAppApiKey } from '@/lib/keys';

export async function GET() {
  try {
    const apiKey = await getOrInitializeAppApiKey();
    return NextResponse.json({
      success: true,
      apiKey,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { type: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
