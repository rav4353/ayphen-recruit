import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await axios.post(
            `${AI_SERVICE_URL}/embeddings`,
            { text: text.substring(0, 8000) },
            { timeout: 10000 }
        );
        return response.data.embedding;
    } catch (error: any) {
        console.error('Failed to get embedding:', error.message);
        throw error;
    }
}

function buildCandidateText(candidate: any): string {
    const parts: string[] = [];
    if (candidate.currentTitle) parts.push(`Current role: ${candidate.currentTitle}`);
    if (candidate.currentCompany) parts.push(`at ${candidate.currentCompany}`);
    if (candidate.location) parts.push(`Location: ${candidate.location}`);
    if (candidate.skills?.length) parts.push(`Skills: ${candidate.skills.join(', ')}`);
    if (candidate.summary) parts.push(candidate.summary);
    if (candidate.resumeText) parts.push(candidate.resumeText.substring(0, 2000));
    return parts.join(' ');
}

async function main() {
    console.log('Starting embedding backfill...');

    // Use raw query to find candidates where embedding is null
    // Unsupported fields cannot be used in normal Prisma filters
    const candidates: any[] = await prisma.$queryRaw`
        SELECT id, "firstName", "lastName", "currentTitle", "currentCompany", location, skills, summary, "resumeText", "tenantId"
        FROM candidates
        WHERE embedding IS NULL
    `;

    console.log(`Found ${candidates.length} candidates without embeddings.`);

    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        console.log(`[${i + 1}/${candidates.length}] Processing ${candidate.firstName} ${candidate.lastName} (${candidate.id})...`);

        try {
            const text = buildCandidateText(candidate);
            const embedding = await getEmbedding(text);
            const embeddingArray = `[${embedding.join(',')}]`;

            await prisma.$executeRawUnsafe(
                `UPDATE candidates SET embedding = $1::vector WHERE id = $2`,
                embeddingArray,
                candidate.id
            );

            console.log(`Successfully updated embedding for ${candidate.id}`);
        } catch (error: any) {
            console.error(`Failed to process candidate ${candidate.id}:`, error.message);
        }
    }

    console.log('Backfill completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
