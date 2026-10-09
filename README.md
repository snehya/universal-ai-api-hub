# AI API Hub

AI API Hub is a lightweight, dynamic gateway that converts structured prompts, model choices, and output JSON schemas into secure, documented REST API endpoints.

## Features

- **Dynamic REST Endpoints**: Instant HTTP POST endpoints (`/api/connectors/[slug]`) powered by Gemini or OpenAI models.
- **API Key Security**: Master application API key protection for all generated endpoints.
- **Input Validation**: Automatic type and required parameter checking with clean standard error responses.
- **Structured JSON Outputs**: Guarantees JSON response structure adhering to configured output schemas.
- **Interactive Documentation**: Auto-generated interactive documentation (`/connectors/[id]/docs`) with cURL examples and copy buttons.
- **Usage Statistics & Monitoring**: Real-time request logging, token tracking, response time analytics, and success rate monitoring (`/connectors/[id]/stats`).

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```
Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Database Setup & Seed Demo Connectors
Run Prisma database migrations and seed default connectors (**Article Writer** using Gemini and **Content Rewriter** using OpenAI):
```bash
npx prisma db push
npm run seed
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Connectors Included

1. **Article Writer** (`/api/connectors/article-writer`)
   - **Provider**: Gemini (`gemini-1.5-flash`)
   - **Inputs**: `topic` (string, required), `tone` (string, optional)
   - **Output Schema**: `{ title, summary, content, tags }`

2. **Content Rewriter** (`/api/connectors/content-rewriter`)
   - **Provider**: OpenAI (`gpt-4o-mini`)
   - **Inputs**: `originalText` (string, required), `desiredTone` (string, required)
   - **Output Schema**: `{ rewrittenText, toneApplied }`

---

## Verification Test Suite

To run full end-to-end automated verification tests:
```bash
npx tsx src/lib/test-runner.ts
```

## Production Build

To build the project for production:
```bash
npm run build
```
