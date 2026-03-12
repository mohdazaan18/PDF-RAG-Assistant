# Chat PDF 📄🤖

An AI-powered application that lets you upload PDF documents and chat with them using natural language. Built with a Next.js frontend, an Express.js backend, and a RAG (Retrieval-Augmented Generation) pipeline powered by LangChain.

## Features

- 📤 **PDF Upload** — Upload any PDF and have it processed automatically in the background
- 🔍 **Semantic Search** — Uses Google Gemini embeddings to find the most relevant document chunks
- 💬 **AI Chat** — Ask questions about your PDF and get accurate, context-aware answers via Llama 3.3 70B (Groq)
- 🔐 **Authentication** — User auth handled by Clerk (sign-up / sign-in flow)
- ⚡ **Async Processing** — PDF ingestion is queued via BullMQ and processed by a background worker
- 🗄️ **Vector Storage** — Document embeddings stored in Qdrant for fast similarity search

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express.js (ESM) |
| **AI / LLM** | LangChain, Groq (Llama 3.3 70B), Google Gemini Embeddings |
| **Queue** | BullMQ + Valkey (Redis-compatible) |
| **Vector DB** | Qdrant |
| **Auth** | Clerk |

## Project Structure

```
Chat-PDF/
├── client/          # Next.js frontend
├── server/          # Express.js backend + BullMQ worker
│   ├── index.js     # API server (upload, chat, delete endpoints)
│   └── worker.js    # Background PDF processing worker
└── docker-compose.yml  # Valkey (Redis) + Qdrant services
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Groq API Key
- Google AI API Key
- Clerk account (publishable key + secret key)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **Valkey** (Redis-compatible) on port `6379`
- **Qdrant** vector database on port `6333`

### 2. Backend Setup

```bash
cd server
cp .env.sample .env   # fill in your API keys
npm install
npm run dev           # starts API server on port 8000
npm run dev:worker    # starts BullMQ worker (separate terminal)
```

**Server `.env`:**
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=http://localhost:6333
```

### 3. Frontend Setup

```bash
cd client
cp .env.sample .env   # fill in your Clerk keys
npm install
npm run dev           # starts Next.js on port 3000
```

**Client `.env`:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/upload/pdf` | Upload a PDF file |
| `GET` | `/chat?message=&collection=` | Ask a question about a PDF |
| `DELETE` | `/delete/:collection` | Delete a PDF collection from Qdrant |

## How It Works

1. **Upload** — User uploads a PDF via the frontend; the server saves the file and adds a job to the BullMQ queue.
2. **Processing** — The background worker picks up the job, loads the PDF, splits it into chunks, generates embeddings via Google Gemini, and stores them in Qdrant.
3. **Chat** — When the user asks a question, the server retrieves the top relevant chunks from Qdrant and sends them along with the query to Llama 3.3 70B on Groq, which returns a grounded answer.

## License

MIT
