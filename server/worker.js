import { Worker } from "bullmq";
import Redis from "ioredis";
import { QdrantVectorStore } from "@langchain/qdrant";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

config();

const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker('file-upload-queue', async (job) => {
    const data = JSON.parse(job.data);
    const collectionName = data.filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    try {
        const loader = new PDFLoader(data.path);
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await splitter.splitDocuments(docs);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "gemini-embedding-001",
            apiKey: process.env.GOOGLE_API_KEY
        });

        await fetch(`${process.env.QDRANT_URL}/collections/${collectionName}`, {
            method: 'DELETE',
            headers: {
                ...(process.env.QDRANT_API_KEY && { 'api-key': process.env.QDRANT_API_KEY })
            }
        });

        await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
            url: process.env.QDRANT_URL,
            collectionName,
            ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY }),
        });

    } catch (err) {
        console.error('Worker job failed:', err.message || err)
        throw err;
    }
},
    {
        concurrency: 100,
        connection,
    }
);
