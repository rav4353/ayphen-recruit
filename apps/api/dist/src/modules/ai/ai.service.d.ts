import { ConfigService } from '@nestjs/config';
import { GenerateJdDto } from './dto/generate-jd.dto';
export declare class AiService {
    private readonly configService;
    private readonly aiServiceUrl;
    constructor(configService: ConfigService);
    generateJd(dto: GenerateJdDto): Promise<any>;
    checkBias(text: string): Promise<any>;
    parseResume(file: Express.Multer.File): Promise<any>;
    matchCandidate(resumeText: string, jobDescription: string): Promise<any>;
}
