import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq"
import Redis from "ioredis"
import { config } from "dotenv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGroq } from "@langchain/groq"
import { SystemMessage, HumanMessage } from "@langchain/core/messages"

config();

const client = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0,
})

const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

const queue = new Queue("file-upload-queue", { connection })

const app = express();
app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
})

const upload = multer({ storage: storage })

app.get('/', (req, res) => {
    return res.json({ status: "All Good" })
})

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    await queue.add("file-ready", JSON.stringify({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
    }))
    return res.json({ message: "Uploaded" })
})

app.delete('/delete/:collection', async (req, res) => {
    const { collection } = req.params;
    const deleteRes = await fetch(`${process.env.QDRANT_URL}/collections/${collection}`, { method: 'DELETE' });
    if (deleteRes.ok) return res.json({ message: `Deleted ${collection}` });
    return res.status(500).json({ message: 'Failed to delete' });
})

app.get('/chat', async (req, res) => {
    const userQuery = req.query.message;
    const collectionName = req.query.collection || "pdf-docs";

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-001",
        apiKey: process.env.GOOGLE_API_KEY
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName,
        ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY }),
    });

    const retreiver = vectorStore.asRetriever({ k: 2 });
    const result = await retreiver.invoke(userQuery);

    const SYSTEM_PROMPT = `You are a helpful AI assistant who answers the user query based on the available context from PDF File. If the answer is not present in the context, say "I don't have the answer.". Context: ${JSON.stringify(result)}`

    const chatResult = await client.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(userQuery)
    ])

    return res.json({ message: chatResult.content, docs: result });
})

app.listen(8000)