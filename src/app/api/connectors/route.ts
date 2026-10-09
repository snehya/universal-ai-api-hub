import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConnectorFormSchema } from '@/lib/validations/connector';
import { generateUniqueSlug } from '@/lib/slug';

export async function GET() {
  try {
    const connectors = await prisma.connector.findMany({
      include: {
        inputs: {
          orderBy: { order: 'asc' },
        },
        logs: {
          select: {
            success: true,
            timestamp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = connectors.map((connector) => {
      const totalRequests = connector.logs.length;
      const successfulRequests = connector.logs.filter((l) => l.success).length;
      const failedRequests = totalRequests - successfulRequests;

      const sortedTimestamps = connector.logs
        .map((l) => new Date(l.timestamp).getTime())
        .sort((a, b) => a - b);

      const firstUsed = sortedTimestamps.length > 0 ? new Date(sortedTimestamps[0]).toISOString() : null;
      const lastUsed =
        sortedTimestamps.length > 0 ? new Date(sortedTimestamps[sortedTimestamps.length - 1]).toISOString() : null;

      const { logs, ...rest } = connector;

      return {
        ...rest,
        totalRequests,
        successfulRequests,
        failedRequests,
        firstUsed,
        lastUsed,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'SERVER_ERROR',
          message: err.message || 'Failed to fetch connectors',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parseResult = ConnectorFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid connector configuration',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { name, description, provider, model, systemPrompt, outputSchema, enabled, inputs } = parseResult.data;

    const slug = await generateUniqueSlug(name);

    const connector = await prisma.connector.create({
      data: {
        name,
        slug,
        description,
        provider,
        model,
        systemPrompt,
        outputSchema,
        enabled: enabled ?? true,
        inputs: {
          create: inputs.map((input, idx) => ({
            name: input.name,
            type: input.type,
            required: input.required ?? false,
            description: input.description || null,
            defaultValue: input.defaultValue || null,
            validation: input.validation || null,
            order: idx,
          })),
        },
      },
      include: {
        inputs: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: connector,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'SERVER_ERROR',
          message: err.message || 'Failed to create connector',
        },
      },
      { status: 500 }
    );
  }
}
