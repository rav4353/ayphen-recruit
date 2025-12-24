import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateApplicationDocumentDto,
  ReviewDocumentDto,
  UpdateApplicationDocumentDto,
} from "./dto/application-document.dto";

@Injectable()
export class ApplicationDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Request a document from candidate
  async requestDocument(
    applicationId: string,
    dto: CreateApplicationDocumentDto,
    tenantId: string,
  ) {
    // Verify application exists and belongs to tenant
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { tenantId },
      },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    return this.prisma.applicationDocument.create({
      data: {
        applicationId,
        title: dto.title,
        description: dto.description,
        isRequired: dto.isRequired ?? true,
        status: "REQUESTED",
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });
  }

  // Get all document requests for an application
  async getDocuments(applicationId: string, tenantId: string) {
    // Verify application belongs to tenant
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { tenantId },
      },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    return this.prisma.applicationDocument.findMany({
      where: { applicationId },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // Upload document (by candidate)
  async uploadDocument(documentId: string, documentUrl: string) {
    const document = await this.prisma.applicationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document request not found");
    }

    return this.prisma.applicationDocument.update({
      where: { id: documentId },
      data: {
        documentUrl,
        status: "PENDING_REVIEW",
        uploadedAt: new Date(),
      },
    });
  }

  // Review document (approve/reject)
  async reviewDocument(
    documentId: string,
    dto: ReviewDocumentDto,
    reviewerId: string,
    tenantId: string,
  ) {
    const document = await this.prisma.applicationDocument.findFirst({
      where: {
        id: documentId,
        application: {
          job: { tenantId },
        },
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return this.prisma.applicationDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        rejectionReason: dto.status === "REJECTED" ? dto.rejectionReason : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Update document request
  async updateDocument(
    documentId: string,
    dto: UpdateApplicationDocumentDto,
    tenantId: string,
  ) {
    const document = await this.prisma.applicationDocument.findFirst({
      where: {
        id: documentId,
        application: {
          job: { tenantId },
        },
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return this.prisma.applicationDocument.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        description: dto.description,
        isRequired: dto.isRequired,
        status: dto.status,
      },
    });
  }

  // Delete document request
  async deleteDocument(documentId: string, tenantId: string) {
    const document = await this.prisma.applicationDocument.findFirst({
      where: {
        id: documentId,
        application: {
          job: { tenantId },
        },
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    await this.prisma.applicationDocument.delete({
      where: { id: documentId },
    });

    return { message: "Document request deleted" };
  }

  // Check if all required documents are approved
  async areAllDocumentsApproved(applicationId: string): Promise<boolean> {
    const requiredDocs = await this.prisma.applicationDocument.findMany({
      where: {
        applicationId,
        isRequired: true,
      },
    });

    if (requiredDocs.length === 0) {
      return true; // No documents required
    }

    return requiredDocs.every((doc) => doc.status === "APPROVED");
  }

  // Get document statistics for an application
  async getDocumentStats(applicationId: string) {
    const documents = await this.prisma.applicationDocument.findMany({
      where: { applicationId },
    });

    return {
      total: documents.length,
      required: documents.filter((d) => d.isRequired).length,
      uploaded: documents.filter((d) =>
        ["UPLOADED", "PENDING_REVIEW", "APPROVED", "REJECTED"].includes(
          d.status,
        ),
      ).length,
      pendingReview: documents.filter((d) => d.status === "PENDING_REVIEW")
        .length,
      approved: documents.filter((d) => d.status === "APPROVED").length,
      rejected: documents.filter((d) => d.status === "REJECTED").length,
      allRequiredApproved: documents
        .filter((d) => d.isRequired)
        .every((d) => d.status === "APPROVED"),
    };
  }
}
