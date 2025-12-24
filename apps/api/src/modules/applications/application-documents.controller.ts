import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/auth.service";
import { ApplicationDocumentsService } from "./application-documents.service";
import { StorageService } from "../storage/storage.service";
import {
  CreateApplicationDocumentDto,
  ReviewDocumentDto,
  UpdateApplicationDocumentDto,
} from "./dto/application-document.dto";

@ApiTags("applications")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard)
@Controller("applications/:applicationId/documents")
export class ApplicationDocumentsController {
  constructor(
    private readonly documentsService: ApplicationDocumentsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Request a document from candidate (before offer)" })
  async requestDocument(
    @Param("applicationId") applicationId: string,
    @Body() dto: CreateApplicationDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.requestDocument(
      applicationId,
      dto,
      user.tenantId,
    );
  }

  @Get()
  @ApiOperation({ summary: "Get all document requests for an application" })
  async getDocuments(
    @Param("applicationId") applicationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.getDocuments(applicationId, user.tenantId);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get document statistics" })
  async getDocumentStats(@Param("applicationId") applicationId: string) {
    return this.documentsService.getDocumentStats(applicationId);
  }

  @Post(":documentId/upload")
  @ApiOperation({ summary: "Upload document file" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @Param("documentId") documentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error("No file provided");
    }

    // Upload to storage
    const uploadResult = await this.storageService.uploadFile(file);

    // Update document record with the URL
    return this.documentsService.uploadDocument(documentId, uploadResult.url);
  }

  @Post(":documentId/review")
  @ApiOperation({ summary: "Review (approve/reject) a document" })
  async reviewDocument(
    @Param("documentId") documentId: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.reviewDocument(
      documentId,
      dto,
      user.sub,
      user.tenantId,
    );
  }

  @Patch(":documentId")
  @ApiOperation({ summary: "Update document request details" })
  async updateDocument(
    @Param("documentId") documentId: string,
    @Body() dto: UpdateApplicationDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.updateDocument(documentId, dto, user.tenantId);
  }

  @Delete(":documentId")
  @ApiOperation({ summary: "Delete document request" })
  async deleteDocument(
    @Param("documentId") documentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentsService.deleteDocument(documentId, user.tenantId);
  }
}
