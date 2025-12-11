"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const roles_service_1 = require("./roles.service");
describe('RolesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [roles_service_1.RolesService],
        }).compile();
        service = module.get(roles_service_1.RolesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=roles.service.spec.js.map