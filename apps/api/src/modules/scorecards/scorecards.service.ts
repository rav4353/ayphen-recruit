import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScorecardTemplateDto } from './dto/create-scorecard-template.dto';
import { UpdateScorecardTemplateDto } from './dto/update-scorecard-template.dto';

@Injectable()
export class ScorecardsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateScorecardTemplateDto, tenantId: string) {
        return (this.prisma as any).scorecardTemplate.create({
            data: {
                ...dto,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string) {
        return (this.prisma as any).scorecardTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const template = await (this.prisma as any).scorecardTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException('Scorecard template not found');
        }

        return template;
    }

    async update(id: string, dto: UpdateScorecardTemplateDto) {
        await this.findOne(id);
        return (this.prisma as any).scorecardTemplate.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return (this.prisma as any).scorecardTemplate.delete({
            where: { id },
        });
    }
}
