import { AiService } from './ai.service';
import { GenerateJdDto } from './dto/generate-jd.dto';
import { CheckBiasDto } from './dto/check-bias.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generateJd(dto: GenerateJdDto): Promise<ApiResponse<any>>;
    parseResume(file: Express.Multer.File): Promise<ApiResponse<any>>;
    checkBias(dto: CheckBiasDto): Promise<ApiResponse<any>>;
}
