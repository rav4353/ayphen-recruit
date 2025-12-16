
import { PrismaClient } from '@prisma/client';

async function testScorecard() {
    const prisma = new PrismaClient();
    try {
        console.log('Checking for scorecardTemplate property on PrismaClient...');
        if ((prisma as any).scorecardTemplate) {
            console.log('scorecardTemplate property EXISTS.');
        } else {
            console.error('scorecardTemplate property DOES NOT EXIST.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testScorecard();
