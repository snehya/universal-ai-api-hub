import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo connectors...');

  // 1. Article Writer -> Gemini
  let articleWriter = await prisma.connector.findUnique({ where: { slug: 'article-writer' } });
  if (!articleWriter) {
    articleWriter = await prisma.connector.create({
      data: {
        name: 'Article Writer',
        slug: 'article-writer',
        description: 'Generates structured tech articles with summary, content, and tags',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        systemPrompt: 'You are an expert technical blog writer. Generate structured articles according to the requested topic and tone. Return output in strictly valid JSON format matching the output schema.',
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
            { name: 'topic', type: 'Text', required: true, description: 'The main subject or title of the article', order: 0 },
            { name: 'tone', type: 'Text', required: false, defaultValue: 'informative', description: 'Desired tone (e.g. informative, technical, casual)', order: 1 },
          ],
        },
      },
    });
  } else {
    await prisma.connector.update({
      where: { id: articleWriter.id },
      data: {
        provider: 'gemini',
        model: 'gemini-3.8-flash',
      },
    });
  }

  // 2. Content Rewriter -> OpenAI
  let contentRewriter = await prisma.connector.findUnique({ where: { slug: 'content-rewriter' } });
  if (!contentRewriter) {
    contentRewriter = await prisma.connector.create({
      data: {
        name: 'Content Rewriter',
        slug: 'content-rewriter',
        description: 'Rewrites raw content into a target tone and format',
        provider: 'openai',
        model: 'gpt-4o-mini',
        systemPrompt: 'You are a professional editor and copywriter. Rewrite the provided text according to the desired tone. Return output in strictly valid JSON format matching the output schema.',
        outputSchema: JSON.stringify(
          {
            rewrittenText: 'string',
            toneApplied: 'string',
          },
          null,
          2
        ),
        enabled: true,
        inputs: {
          create: [
            { name: 'originalText', type: 'Text', required: true, description: 'Original content to rewrite', order: 0 },
            { name: 'desiredTone', type: 'Text', required: true, description: 'Target tone (e.g. professional, humorous, persuasive)', order: 1 },
          ],
        },
      },
    });
  } else {
    await prisma.connector.update({
      where: { id: contentRewriter.id },
      data: {
        provider: 'openai',
        model: 'gpt-4o-mini',
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
