import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: id } = await params;

    // Find connector by ID or slug
    let connector = await prisma.connector.findUnique({
      where: { id },
      include: { inputs: { orderBy: { order: 'asc' } } },
    });

    if (!connector) {
      connector = await prisma.connector.findUnique({
        where: { slug: id },
        include: { inputs: { orderBy: { order: 'asc' } } },
      });
    }

    if (!connector) {
      return NextResponse.json(
        { success: false, error: { type: 'NOT_FOUND', message: 'Connector not found' } },
        { status: 404 }
      );
    }

    // Fetch all logs for this connector
    const logs = await prisma.requestLog.findMany({
      where: { connectorId: connector.id },
      orderBy: { timestamp: 'desc' },
      take: 100, // recent 100 requests for table
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const totalResponseTime = logs.reduce((sum, l) => sum + l.responseTimeMs, 0);
    const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0;

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalEstimatedCost = 0;
    let hasCostData = false;

    logs.forEach((l) => {
      if (l.inputTokens) totalInputTokens += l.inputTokens;
      if (l.outputTokens) totalOutputTokens += l.outputTokens;
      if (l.totalTokens) totalTokens += l.totalTokens;
      if (l.estimatedCost !== null && l.estimatedCost !== undefined) {
        totalEstimatedCost += l.estimatedCost;
        hasCostData = true;
      }
    });

    const firstUsed = logs.length > 0 ? logs[logs.length - 1].timestamp : null;
    const lastUsed = logs.length > 0 ? logs[0].timestamp : null;

    // Map logs for safe client representation (strip full payloads to avoid accidental secret leak)
    const recentRequests = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      success: l.success,
      responseTimeMs: l.responseTimeMs,
      provider: l.provider,
      model: l.model,
      inputTokens: l.inputTokens ?? null,
      outputTokens: l.outputTokens ?? null,
      totalTokens: l.totalTokens ?? null,
      errorType: l.errorType ?? null,
      errorMessage: l.errorMessage ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        connector: {
          id: connector.id,
          name: connector.name,
          slug: connector.slug,
          provider: connector.provider,
          model: connector.model,
          enabled: connector.enabled,
        },
        stats: {
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate: Number(successRate.toFixed(1)),
          avgResponseTimeMs: avgResponseTime,
          firstUsed: firstUsed ? firstUsed.toISOString() : null,
          lastUsed: lastUsed ? lastUsed.toISOString() : null,
          totalInputTokens,
          totalOutputTokens,
          totalTokens,
          estimatedCost: hasCostData ? `$${totalEstimatedCost.toFixed(5)}` : 'Unavailable',
        },
        recentRequests,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { type: 'SERVER_ERROR', message: err.message || 'Error fetching statistics' } },
      { status: 500 }
    );
  }
}
