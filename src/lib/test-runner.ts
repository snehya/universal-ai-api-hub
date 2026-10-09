import { prisma } from './prisma';
import { POST as connectorPostHandler } from '../app/api/connectors/[slug]/route';
import { GET as connectorStatsHandler } from '../app/api/connectors/[slug]/stats/route';
import { NextRequest } from 'next/server';
import { getOrInitializeAppApiKey } from './keys';


async function runAllVerificationTests() {
  console.log('====================================================');
  console.log('       AI API HUB FULL VERIFICATION SUITE           ');
  console.log('====================================================\n');

  const apiKey = await getOrInitializeAppApiKey();
  console.log(`[AUTH] Master App API Key: ${apiKey}\n`);

  // Ensure connectors exist
  let articleConn = await prisma.connector.findUnique({ where: { slug: 'article-writer' } });
  if (!articleConn) {
    articleConn = await prisma.connector.create({
      data: {
        name: 'Article Writer',
        slug: 'article-writer',
        description: 'Generates structured articles with summary and tags',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are a professional tech writer. Output valid JSON matching outputSchema.',
        outputSchema: JSON.stringify({ title: 'string', summary: 'string', content: 'string', tags: ['string'] }, null, 2),
        enabled: true,
        inputs: {
          create: [
            { name: 'topic', type: 'Text', required: true, description: 'Topic of the article', order: 0 },
            { name: 'tone', type: 'Text', required: false, defaultValue: 'informative', description: 'Tone of voice', order: 1 },
          ],
        },
      },
    });
  }

  let rewriterConn = await prisma.connector.findUnique({ where: { slug: 'content-rewriter' } });
  if (!rewriterConn) {
    rewriterConn = await prisma.connector.create({
      data: {
        name: 'Content Rewriter',
        slug: 'content-rewriter',
        description: 'Rewrites content into requested tone',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are a professional editor. Rewrite text into requested tone. Output JSON with rewrittenText and toneApplied.',
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

  // 1. Security Verification (Invalid Key)
  console.log('--- TEST 1: Security Verification (Invalid API Key) ---');
  const reqSec = new NextRequest('http://localhost:3000/api/connectors/article-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'INVALID_BAD_KEY' },
    body: JSON.stringify({ topic: 'AI API Gateway' }),
  });
  const resSec = await connectorPostHandler(reqSec, { params: Promise.resolve({ slug: 'article-writer' }) });
  const dataSec = await resSec.json();
  console.log('HTTP Status:', resSec.status);
  console.log('Result:', JSON.stringify(dataSec, null, 2));
  console.log('Security Test Passed:', resSec.status === 401 && dataSec.error?.type === 'UNAUTHORIZED' ? 'YES ✅' : 'NO ❌');

  // 2. Missing-field Test Result
  console.log('\n--- TEST 2: Missing Required Field Test ---');
  const reqMissing = new NextRequest('http://localhost:3000/api/connectors/article-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ tone: 'informal' }), // missing required 'topic'
  });
  const resMissing = await connectorPostHandler(reqMissing, { params: Promise.resolve({ slug: 'article-writer' }) });
  const dataMissing = await resMissing.json();
  console.log('HTTP Status:', resMissing.status);
  console.log('Result:', JSON.stringify(dataMissing, null, 2));
  console.log('Missing Field Test Passed:', resMissing.status === 400 && dataMissing.error?.type === 'INVALID_INPUT' ? 'YES ✅' : 'NO ❌');

  // 3. Invalid-input Test Result
  console.log('\n--- TEST 3: Invalid Input Data Type Test ---');
  const reqInvalid = new NextRequest('http://localhost:3000/api/connectors/article-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ topic: 998877 }), // invalid type for string
  });
  const resInvalid = await connectorPostHandler(reqInvalid, { params: Promise.resolve({ slug: 'article-writer' }) });
  const dataInvalid = await resInvalid.json();
  console.log('HTTP Status:', resInvalid.status);
  console.log('Result:', JSON.stringify(dataInvalid, null, 2));
  console.log('Invalid Input Test Passed:', resInvalid.status === 400 && dataInvalid.error?.type === 'INVALID_INPUT' ? 'YES ✅' : 'NO ❌');

  // 4. Real API Call: Article Writer
  console.log('\n--- TEST 4: Article Writer Real API Test ---');
  const reqArticle = new NextRequest('http://localhost:3000/api/connectors/article-writer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ topic: 'Building High-Performance AI API Gateways with Next.js 15', tone: 'technical and authoritative' }),
  });
  const resArticle = await connectorPostHandler(reqArticle, { params: Promise.resolve({ slug: 'article-writer' }) });
  const dataArticle = await resArticle.json();
  console.log('HTTP Status:', resArticle.status);
  console.log('Result Body:', JSON.stringify(dataArticle, null, 2));

  // 5. Real API Call: Content Rewriter
  console.log('\n--- TEST 5: Content Rewriter Real API Test ---');
  const reqRewriter = new NextRequest('http://localhost:3000/api/connectors/content-rewriter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ originalText: 'AI API Hub dynamically wraps prompts and JSON schemas into secure REST API endpoints.', desiredTone: 'enthusiastic product launch announcement' }),
  });
  const resRewriter = await connectorPostHandler(reqRewriter, { params: Promise.resolve({ slug: 'content-rewriter' }) });
  const dataRewriter = await resRewriter.json();
  console.log('HTTP Status:', resRewriter.status);
  // 7. Statistics API Verification Test
  console.log('\n--- TEST 7: Statistics API Endpoint Verification ---');
  const reqStats = new NextRequest(`http://localhost:3000/api/connectors/${articleConn.id}/stats`);
  const resStats = await connectorStatsHandler(reqStats, { params: Promise.resolve({ slug: articleConn.id }) });
  const dataStats = await resStats.json();
  console.log('HTTP Status:', resStats.status);
  console.log('Statistics Output Summary:');
  console.log('Total Requests:', dataStats.data?.stats?.totalRequests);
  console.log('Successful Requests:', dataStats.data?.stats?.successfulRequests);
  console.log('Failed Requests:', dataStats.data?.stats?.failedRequests);
  console.log('Success Rate:', dataStats.data?.stats?.successRate, '%');
  console.log('Avg Response Time:', dataStats.data?.stats?.avgResponseTimeMs, 'ms');
  console.log('Tokens (Input / Output / Total):', `${dataStats.data?.stats?.totalInputTokens} / ${dataStats.data?.stats?.totalOutputTokens} / ${dataStats.data?.stats?.totalTokens}`);
  console.log('Cost:', dataStats.data?.stats?.estimatedCost);
  console.log('First Used:', dataStats.data?.stats?.firstUsed);
  console.log('Last Used:', dataStats.data?.stats?.lastUsed);
  console.log('Recent Request Logs Count:', dataStats.data?.recentRequests?.length);

  const statsTestPassed = resStats.status === 200 && dataStats.success === true && dataStats.data?.stats?.totalRequests > 0;
  console.log('Statistics API Test Passed:', statsTestPassed ? 'YES ✅' : 'NO ❌');

  // 8. Secret Exposure Verification
  console.log('\n--- TEST 8: Security & Secret Exposure Verification ---');
  const serializedStatsStr = JSON.stringify(dataStats);
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const dbUrl = process.env.DATABASE_URL || '';

  const containsGeminiSecret = geminiKey && geminiKey.length > 5 ? serializedStatsStr.includes(geminiKey) : false;
  const containsOpenAISecret = openaiKey && openaiKey.length > 5 ? serializedStatsStr.includes(openaiKey) : false;
  const containsDbCreds = dbUrl && dbUrl.length > 5 ? serializedStatsStr.includes(dbUrl) : false;

  const secretTestPassed = !containsGeminiSecret && !containsOpenAISecret && !containsDbCreds;
  console.log('No Secrets Exposed in Statistics Payload:', secretTestPassed ? 'YES ✅' : 'NO ❌');

  console.log('\n====================================================');
  console.log('           ALL VERIFICATION TESTS COMPLETED          ');
  console.log('====================================================');
}

runAllVerificationTests().catch(console.error).finally(() => prisma.$disconnect());

