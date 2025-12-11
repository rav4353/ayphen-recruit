import { ReferenceService } from './reference.service';
export declare class ReferenceController {
    private readonly referenceService;
    constructor(referenceService: ReferenceService);
    getCurrencies(): {
        code: string;
        name: string;
        symbol: string;
    }[];
}
