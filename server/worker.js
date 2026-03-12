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
    console.log(`Job received: ${job.data}`)
    const data = JSON.parse(job.data);

    // Sanitize filename into a valid Qdrant collection name
    const collectionName = data.filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    console.log(`Processing: ${data.filename} → collection: ${collectionName}`)

    try {
        const loader = new PDFLoader(data.path);
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await splitter.splitDocuments(docs);
        console.log(`Loaded ${docs.length} pages, split into ${splitDocs.length} chunks`)

        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "gemini-embedding-001",
            apiKey: process.env.GOOGLE_API_KEY
        });

        // Delete old collection to avoid duplicate chunks on re-upload
        const deleteRes = await fetch(`${process.env.QDRANT_URL}/collections/${collectionName}`, { method: 'DELETE' });
        console.log(`Collection delete status: ${deleteRes.status}`)

        console.log(`Storing ${splitDocs.length} chunks into Qdrant...`)
        await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
            url: process.env.QDRANT_URL,
            collectionName,
            ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY }),
        });

        console.log(`✅ All ${splitDocs.length} chunks stored in collection: ${collectionName}`)
    } catch (err) {
        console.error('❌ Worker job failed:', err.message || err)
        throw err;
    }
},
    {
        concurrency: 100,
        connection,
    }
);
