import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const existing = await prisma.connector.findFirst({
      where: { OR: [{ id: slug }, { slug: slug }] },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { type: 'NOT_FOUND', message: 'Connector not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.connector.update({
      where: { id: existing.id },
      data: {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : !existing.enabled,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { type: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
