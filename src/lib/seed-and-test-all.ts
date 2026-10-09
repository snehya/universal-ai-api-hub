import { prisma } from './prisma';

export async function seedConnectors() {
  const defaultKey = process.env.APP_API_KEY || 'sk_hub_dev_key_12345';
  await prisma.appApiKey.upsert({
    where: { key: defaultKey },
    update: {},
    create: {
      name: 'Master App API Key',
      key: defaultKey,
      enabled: true,
    },
  });

  const existingArticle = await prisma.connector.findUnique({ where: { slug: 'article-writer' } });

  if (!existingArticle) {
    await prisma.connector.create({
      data: {
        name: 'Article Writer',
        slug: 'article-writer',
        description: 'Generates SEO-optimized articles with title, sections, and summary',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are an expert tech article writer. Structure your response into clear Markdown sections.',
        outputSchema: JSON.stringify(
          {
            title: 'string',
            summary: 'string',
            content: 'string',
            tags: ['string'],
          },
          null,
          2
        ),
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

  const existingSummarizer = await prisma.connector.findUnique({ where: { slug: 'code-summarizer' } });

  if (!existingSummarizer) {
    await prisma.connector.create({
      data: {
        name: 'Code Summarizer',
        slug: 'code-summarizer',
        description: 'Analyzes source code snippets and extracts functions, purpose, and key logic',
        provider: 'openai',
        model: 'gpt-4o-mini',
        systemPrompt: 'You are a code analysis expert. Analyze code snippets provided in input.',
        outputSchema: JSON.stringify(
          {
            language: 'string',
            purpose: 'string',
            keyFunctions: ['string'],
            complexityRating: 'string',
          },
          null,
          2
        ),
        enabled: true,
        inputs: {
          create: [
            { name: 'codeSnippet', type: 'Text', required: true, description: 'Source code snippet to analyze', order: 0 },
          ],
        },
      },
    });
  }

  console.log('Seed completed successfully!');
}
