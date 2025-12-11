import { OfferTemplatesService } from './offer-templates.service';
import { CreateOfferTemplateDto, UpdateOfferTemplateDto } from './dto/offer-template.dto';
export declare class OfferTemplatesController {
    private readonly offerTemplatesService;
    constructor(offerTemplatesService: OfferTemplatesService);
    create(req: any, createOfferTemplateDto: CreateOfferTemplateDto): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
    findAll(req: any): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }[]>;
    findOne(req: any, id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    } | null>;
    update(req: any, id: string, updateOfferTemplateDto: UpdateOfferTemplateDto): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
    remove(req: any, id: string): Promise<{
        name: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        createdAt: Date;
        content: string;
    }>;
}
