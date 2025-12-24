import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from "@nestjs/common";
import { OffersService } from "./offers.service";
import { CreateOfferDto, UpdateOfferDto } from "./dto/offer.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Offers")
@Controller("offers")
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: "Create a new offer" })
  create(@Request() req: any, @Body() createOfferDto: CreateOfferDto) {
    return this.offersService.create(req.user.tenantId, createOfferDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: "Get all offers" })
  findAll(@Request() req: any) {
    return this.offersService.findAll(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id")
  @ApiOperation({ summary: "Get an offer by ID" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.offersService.findOne(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  @ApiOperation({ summary: "Update an offer" })
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    return this.offersService.update(req.user.tenantId, id, updateOfferDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/submit")
  @ApiOperation({ summary: "Submit an offer for approval" })
  submit(@Request() req: any, @Param("id") id: string) {
    return this.offersService.submit(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/approve")
  @ApiOperation({ summary: "Approve an offer" })
  approve(@Request() req: any, @Param("id") id: string) {
    return this.offersService.approve(req.user.tenantId, id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/reject")
  @ApiOperation({ summary: "Reject an offer" })
  reject(
    @Request() req: any,
    @Param("id") id: string,
    @Body("reason") reason: string,
  ) {
    return this.offersService.reject(
      req.user.tenantId,
      id,
      req.user.id,
      reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/send")
  @ApiOperation({ summary: "Send an offer to candidate" })
  send(@Request() req: any, @Param("id") id: string) {
    return this.offersService.send(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  @ApiOperation({ summary: "Delete a draft offer" })
  delete(@Request() req: any, @Param("id") id: string) {
    return this.offersService.delete(req.user.tenantId, id);
  }

  @Public()
  @Get("public/:token")
  @ApiOperation({ summary: "Get public offer details" })
  getPublicOffer(@Param("token") token: string) {
    return this.offersService.getPublicOffer(token);
  }

  @Public()
  @Post("public/:token/accept")
  @ApiOperation({ summary: "Accept an offer" })
  acceptOffer(
    @Param("token") token: string,
    @Body("signature") signature: string,
  ) {
    return this.offersService.acceptOffer(token, signature);
  }

  @Public()
  @Post("public/:token/decline")
  @ApiOperation({ summary: "Decline an offer" })
  declineOffer(@Param("token") token: string, @Body("reason") reason: string) {
    return this.offersService.declineOffer(token, reason);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/counter-offer")
  @ApiOperation({ summary: "Submit a counter-offer (candidate negotiation)" })
  submitCounterOffer(
    @Request() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      requestedSalary?: number;
      requestedBonus?: number;
      requestedEquity?: string;
      requestedStartDate?: string;
      notes?: string;
    },
  ) {
    return this.offersService.submitCounterOffer(id, req.user.tenantId, {
      ...body,
      requestedStartDate: body.requestedStartDate
        ? new Date(body.requestedStartDate)
        : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/respond-counter")
  @ApiOperation({ summary: "Respond to a counter-offer" })
  respondToCounterOffer(
    @Request() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      action: "ACCEPT" | "REJECT" | "COUNTER";
      revisedSalary?: number;
      revisedBonus?: number;
      revisedEquity?: string;
      revisedStartDate?: string;
      notes?: string;
    },
  ) {
    return this.offersService.respondToCounterOffer(
      id,
      req.user.tenantId,
      req.user.sub,
      {
        ...body,
        revisedStartDate: body.revisedStartDate
          ? new Date(body.revisedStartDate)
          : undefined,
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/negotiation-history")
  @ApiOperation({ summary: "Get negotiation history for an offer" })
  getNegotiationHistory(@Request() req: any, @Param("id") id: string) {
    return this.offersService.getNegotiationHistory(id, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":id/comparison")
  @ApiOperation({ summary: "Get offer comparison (original vs current terms)" })
  getOfferComparison(@Request() req: any, @Param("id") id: string) {
    return this.offersService.getOfferComparison(id, req.user.tenantId);
  }
}
