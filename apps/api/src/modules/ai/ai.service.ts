import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { GenerateJdDto } from "./dto/generate-jd.dto";

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.aiServiceUrl = this.configService.get<string>(
      "AI_SERVICE_URL",
      "http://127.0.0.1:8000",
    );
  }

  async generateJd(dto: GenerateJdDto) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/generate-jd`,
        dto,
      );
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new HttpException(
        "Failed to generate job description",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkBias(text: string) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/check-bias`, {
        text,
      });
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new HttpException(
        "Failed to check bias",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async parseResume(file: Express.Multer.File) {
    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer as any], { type: file.mimetype });
      formData.append("file", blob, file.originalname);

      const response = await axios.post(
        `${this.aiServiceUrl}/parse-resume`,
        formData,
      );
      return response.data;
    } catch (error) {
      console.error("AI Service Error:", error);
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          error.response.data?.detail || "AI Service Error",
          error.response.status,
        );
      }
      throw new HttpException(
        "Failed to parse resume. AI service might be unavailable.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
  async matchCandidate(resumeText: string, jobDescription: string) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/match`, {
        resumeText,
        jobDescription,
      });
      return response.data;
    } catch (error) {
      console.error("AI Service Error (Match):", error);
      // Return fallback so we don't crash
      return {
        score: 0,
        matchedSkills: [],
        missingSkills: [],
        summary: "AI matching unavailable",
      };
    }
  }

  async generateSubjectLines(data: {
    context: string;
    candidateName?: string;
    jobTitle?: string;
    companyName?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/generate-subject-lines`,
        data,
      );
      return response.data;
    } catch (error) {
      console.error("AI Service Error (Subject Lines):", error);
      // Return fallback suggestions
      return {
        suggestions: [
          `Regarding Your Application${data.jobTitle ? ` for ${data.jobTitle}` : ""}`,
          "Next Steps in Your Application",
          "Important Update from Our Team",
          "Your Application Status",
          "We Have an Update for You",
        ],
      };
    }
  }
}
