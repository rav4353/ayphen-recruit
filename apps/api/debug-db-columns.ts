
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumns() {
    try {
        // Determine the table name. Based on schema.prisma it is "scorecard_templates" (@@map("scorecard_templates"))?
        // Let's check the schema again.
        // In step 157: model ScorecardTemplate { ... @@map("scorecard_templates")? NO, I didn't see the @@map in the snippet.
        // Let's check if there is a @@map.

        // Actually, I can just query the information_schema
        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ScorecardTemplate' OR table_name = 'scorecard_templates' OR table_name = 'ScorecardTemplates';
    `;
        console.log('Columns in DB:', result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkColumns();
