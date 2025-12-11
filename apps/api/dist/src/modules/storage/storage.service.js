"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let StorageService = class StorageService {
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = 'uploads';
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async uploadFile(file) {
        const fileExt = path.extname(file.originalname);
        const filename = `${(0, uuid_1.v4)()}${fileExt}`;
        const filePath = path.join(this.uploadDir, filename);
        await fs.promises.writeFile(filePath, file.buffer);
        const baseUrl = this.configService.get('API_URL') || 'http://localhost:3001/api/v1';
        const serverUrl = this.configService.get('API_URL') || 'http://localhost:3001';
        const url = `${serverUrl}/uploads/${filename}`;
        return {
            url,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map