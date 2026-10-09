import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrInitializeAppApiKey } from '@/lib/keys';
import { validateConnectorInput } from '@/lib/validations/inputValidator';
import { getProviderAdapter } from '@/lib/providers';
import { ConnectorFormSchema } from '@/lib/validations/connector';
import { generateUniqueSlug } from '@/lib/slug';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const connector = await prisma.connector.findFirst({
      where: {
        OR: [{ id: slug }, { slug: slug }],
      },
      include: {
        inputs: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!connector) {
      return NextResponse.json(
        { success: false, error: { type: 'NOT_FOUND', message: 'Connector not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: connector,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { type: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const { slug } = await params;

  // 1. Authenticate API Key
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedKey = await getOrInitializeAppApiKey();

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'UNAUTHORIZED',
          message: 'Invalid or missing API key. Please pass x-api-key header.',
        },
      },
      { status: 401 }
    );
  }

  // 2. Locate Connector
  const connector = await prisma.connector.findFirst({
    where: {
      OR: [{ id: slug }, { slug: slug }],
    },
    include: {
      inputs: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!connector) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: `Connector with ID or slug "${slug}" was not found.`,
        },
      },
      { status: 404 }
    );
  }

  // 3. Check Enabled Status
  if (!connector.enabled) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'CONNECTOR_DISABLED',
          message: `Connector "${connector.name}" is currently disabled. Enable it in the dashboard to make requests.`,
        },
      },
      { status: 403 }
    );
  }

  // 4. Parse & Validate Payload
  let rawBody: Record<string, any> = {};
  try {
    rawBody = await req.json();
  } catch {
    rawBody = {};
  }

  const validation = validateConnectorInput(rawBody, connector.inputs);

  if (!validation.valid) {
    await prisma.requestLog.create({
      data: {
        connectorId: connector.id,
        success: false,
        responseTimeMs: Date.now() - startTime,
        provider: connector.provider,
        model: connector.model,
        errorType: 'VALIDATION_ERROR',
        errorMessage: validation.error,
        requestPayload: JSON.stringify(rawBody),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'INVALID_INPUT',
          message: validation.error,
        },
      },
      { status: 400 }
    );
  }

  // 5. Execute AI Request
  const adapter = getProviderAdapter(connector.provider);

  const aiResult = await adapter.execute({
    model: connector.model,
    systemPrompt: connector.systemPrompt,
    userInput: validation.validatedInput,
    outputSchema: connector.outputSchema,
    files: validation.files,
  });

  const responseTimeMs = Date.now() - startTime;

  // 6. Log Request
  await prisma.requestLog.create({
    data: {
      connectorId: connector.id,
      success: aiResult.success,
      responseTimeMs,
      provider: connector.provider,
      model: connector.model,
      inputTokens: aiResult.inputTokens || null,
      outputTokens: aiResult.outputTokens || null,
      totalTokens: aiResult.totalTokens || null,
      estimatedCost: aiResult.estimatedCost || null,
      errorType: aiResult.error?.type || null,
      errorMessage: aiResult.error?.message || null,
      requestPayload: JSON.stringify(validation.validatedInput),
      responsePayload: aiResult.data ? JSON.stringify(aiResult.data) : aiResult.rawText || null,
    },
  });

  // 7. Format Output Response
  if (!aiResult.success) {
    let statusCode = 500;
    if (aiResult.error?.type === 'MISSING_API_KEY') statusCode = 500;
    if (aiResult.error?.type === 'MALFORMED_OUTPUT') statusCode = 502;
    if (aiResult.error?.type === 'UNKNOWN_PROVIDER') statusCode = 400;

    return NextResponse.json(
      {
        success: false,
        error: aiResult.error,
        metrics: {
          responseTimeMs,
          totalTokens: aiResult.totalTokens,
        },
      },
      { status: statusCode }
    );
  }

  return NextResponse.json({
    success: true,
    data: aiResult.data,
    metrics: {
      responseTimeMs,
      inputTokens: aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      totalTokens: aiResult.totalTokens,
      estimatedCost: aiResult.estimatedCost,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const parseResult = ConnectorFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid connector payload',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { name, description, provider, model, systemPrompt, outputSchema, enabled, inputs } = parseResult.data;

    const existing = await prisma.connector.findFirst({
      where: { OR: [{ id: slug }, { slug: slug }] },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { type: 'NOT_FOUND', message: 'Connector not found' } },
        { status: 404 }
      );
    }

    const newSlug = name !== existing.name ? await generateUniqueSlug(name, existing.id) : existing.slug;

    await prisma.inputParameter.deleteMany({
      where: { connectorId: existing.id },
    });

    const updated = await prisma.connector.update({
      where: { id: existing.id },
      data: {
        name,
        slug: newSlug,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const existing = await prisma.connector.findFirst({
      where: { OR: [{ id: slug }, { slug: slug }] },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { type: 'NOT_FOUND', message: 'Connector not found' } },
        { status: 404 }
      );
    }

    await prisma.connector.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Connector deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { type: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
