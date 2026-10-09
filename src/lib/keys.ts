import { prisma } from './prisma';
import crypto from 'crypto';

export async function getOrInitializeAppApiKey(): Promise<string> {
  const existing = await prisma.appApiKey.findFirst({
    where: { enabled: true },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return existing.key;
  }

  const defaultKey = process.env.APP_API_KEY || `sk_hub_${crypto.randomBytes(16).toString('hex')}`;

  const created = await prisma.appApiKey.create({
    data: {
      name: 'Master App API Key',
      key: defaultKey,
      enabled: true,
    },
  });

  return created.key;
}
