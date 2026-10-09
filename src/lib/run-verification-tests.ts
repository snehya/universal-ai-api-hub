import { prisma } from './prisma';
import { getOrInitializeAppApiKey } from './keys';
import { seedConnectors } from './seed-and-test-all';

async function runTests() {
  console.log('=== STARTING AI API HUB VERIFICATION TESTS ===\n');

  // 1. Seed Database
  console.log('1. Seeding database with initial connectors and API Key...');
  await seedConnectors();
  const apiKey = await getOrInitializeAppApiKey();
  console.log(`Master API Key retrieved: ${apiKey.substring(0, 10)}...`);

  // Ensure Content Rewriter connector exists for test
  let rewriter = await prisma.connector.findUnique({ where: { slug: 'content-rewriter' } });
  if (!rewriter) {
    rewriter = await prisma.connector.create({
      data: {
        name: 'Content Rewriter',
        slug: 'content-rewriter',
        description: 'Rewrites provided text into a specified style or tone',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are a professional editor. Rewrite the text into the requested tone.',
        outputSchema: JSON.stringify({ rewrittenText: 'string', toneApplied: 'string' }, null, 2),
        enabled: true,
        inputs: {
          create: [
            { name: 'originalText', type: 'Text', required: true, description: 'Text to rewrite', order: 0 },
            { name: 'desiredTone', type: 'Text', required: true, description: 'Target tone', order: 1 },
          ],
        },
      },
    });
  }

  console.log('\n2. Testing Connectors with API Handler logic...');

  // Test 1: Security Verification (Invalid API key)
  console.log('\n--- Test A: Security Verification (Invalid API Key) ---');
  const secResponse = await fetchTestAPI('article-writer', 'INVALID_KEY', { topic: 'AI API Gateway' });
  console.log('Response Status:', secResponse.status);
  console.log('Response Body:', secResponse.body);
  const secPassed = secResponse.status === 401 && secResponse.body.error?.type === 'UNAUTHORIZED';
  console.log('Security Test Result:', secPassed ? 'PASSED ✅' : 'FAILED ❌');

  // Test 2: Missing Field Validation Test
  console.log('\n--- Test B: Missing Field Test ---');
  const missingResponse = await fetchTestAPI('article-writer', apiKey, {});
  console.log('Response Status:', missingResponse.status);
  console.log('Response Body:', missingResponse.body);
  const missingPassed = missingResponse.status === 400 && missingResponse.body.error?.type === 'INVALID_INPUT';
  console.log('Missing Field Test Result:', missingPassed ? 'PASSED ✅' : 'FAILED ❌');

  // Test 3: Invalid Input Type Test
  console.log('\n--- Test C: Invalid Input Type Test ---');
  const invalidResponse = await fetchTestAPI('article-writer', apiKey, { topic: 12345 });
  console.log('Response Status:', invalidResponse.status);
  console.log('Response Body:', invalidResponse.body);
  const invalidPassed = invalidResponse.status === 400 && invalidResponse.body.error?.type === 'INVALID_INPUT';
  console.log('Invalid Input Test Result:', invalidPassed ? 'PASSED ✅' : 'FAILED ❌');

  // Test 4: Real API Call - Article Writer
  console.log('\n--- Test D: Article Writer Real API Test ---');
  const articleResponse = await fetchTestAPI('article-writer', apiKey, {
    topic: 'Next.js 15 Server Components Best Practices',
    tone: 'professional',
  });
  console.log('Response Status:', articleResponse.status);
  console.log('Response Body:', JSON.stringify(articleResponse.body, null, 2));

  // Test 5: Real API Call - Content Rewriter
  console.log('\n--- Test E: Content Rewriter Real API Test ---');
  const rewriterResponse = await fetchTestAPI('content-rewriter', apiKey, {
    originalText: 'AI API Hub allows developers to transform prompts into production REST endpoints.',
    desiredTone: 'enthusiastic sales pitch',
  });
  console.log('Response Status:', rewriterResponse.status);
  console.log('Response Body:', JSON.stringify(rewriterResponse.body, null, 2));

  // Test 6: Verify RequestLogs recorded in SQLite database
  console.log('\n--- Test F: RequestLog Verification in SQLite DB ---');
  const logs = await prisma.requestLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
  });
  console.log(`Found ${logs.length} request log entries in database.`);
  logs.forEach((log, index) => {
    console.log(`[${index + 1}] ID: ${log.id} | Success: ${log.success} | Provider: ${log.provider} | ResponseTime: ${log.responseTimeMs}ms | Error: ${log.errorMessage || 'None'}`);
  });

  console.log('\n=== VERIFICATION TESTS COMPLETED ===');
}

async function fetchTestAPI(slug: string, key: string, payload: any) {
  // Call internal POST endpoint route directly via handler or HTTP fetch
  const host = process.env.TEST_HOST || 'http://localhost:3000';
  try {
    const res = await fetch(`${host}/api/connectors/${slug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return { status: res.status, body };
  } catch (err: any) {
    return { status: 500, body: { error: err.message } };
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
