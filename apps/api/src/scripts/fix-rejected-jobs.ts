import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixRejectedJobs() {
  console.log("Starting fix for rejected jobs...");

  try {
    // Find all job approvals with REJECTED status
    const rejectedApprovals = await prisma.jobApproval.findMany({
      where: {
        status: "REJECTED",
      },
      include: {
        job: true,
      },
    });

    console.log(`Found ${rejectedApprovals.length} rejected approvals`);

    // Group by job ID to get unique jobs
    const rejectedJobIds = [...new Set(rejectedApprovals.map((a) => a.jobId))];
    console.log(`Found ${rejectedJobIds.length} unique jobs with rejections`);

    // Update each job's status to REJECTED if it's not already
    let updatedCount = 0;
    for (const jobId of rejectedJobIds) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (job && job.status !== "REJECTED") {
        console.log(
          `Updating job ${jobId} (${job.title}) from ${job.status} to REJECTED`,
        );
        await prisma.job.update({
          where: { id: jobId },
          data: { status: "REJECTED" },
        });
        updatedCount++;
      }
    }

    console.log(`✅ Fixed ${updatedCount} jobs`);
    console.log("Script completed successfully!");
  } catch (error) {
    console.error("Error fixing rejected jobs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRejectedJobs().catch((error) => {
  console.error(error);
  process.exit(1);
});
