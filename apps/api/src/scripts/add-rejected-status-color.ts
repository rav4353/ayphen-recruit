import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_REJECTED_COLOR = { bg: "#FEE2E2", text: "#991B1B" };

async function addRejectedToStatusColors() {
  console.log(
    "Starting migration to add REJECTED status to status_colors settings...",
  );

  try {
    // Find all status_colors settings
    const statusColorSettings = await prisma.setting.findMany({
      where: {
        key: "status_colors",
      },
    });

    console.log(`Found ${statusColorSettings.length} status_colors settings`);

    let updatedCount = 0;
    for (const setting of statusColorSettings) {
      const colors = setting.value as any;

      // Check if job colors exist and REJECTED is missing
      if (colors && colors.job && !colors.job.REJECTED) {
        console.log(`Adding REJECTED to tenant ${setting.tenantId}`);

        const updatedColors = {
          ...colors,
          job: {
            ...colors.job,
            REJECTED: DEFAULT_REJECTED_COLOR,
          },
        };

        await prisma.setting.update({
          where: {
            tenantId_key: {
              tenantId: setting.tenantId,
              key: "status_colors",
            },
          },
          data: {
            value: updatedColors,
          },
        });

        updatedCount++;
      } else if (colors?.job?.REJECTED) {
        console.log(`Tenant ${setting.tenantId} already has REJECTED status`);
      }
    }

    console.log(`✅ Updated ${updatedCount} settings`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error adding REJECTED to status colors:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addRejectedToStatusColors().catch((error) => {
  console.error(error);
  process.exit(1);
});
