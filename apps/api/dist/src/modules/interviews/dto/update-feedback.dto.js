"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_feedback_dto_1 = require("./create-feedback.dto");
class UpdateFeedbackDto extends (0, swagger_1.PartialType)(create_feedback_dto_1.CreateFeedbackDto) {
}
exports.UpdateFeedbackDto = UpdateFeedbackDto;
//# sourceMappingURL=update-feedback.dto.js.map