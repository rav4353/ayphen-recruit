import { Test, TestingModule } from '@nestjs/testing';
import { BGVService } from './bgv.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckrService } from './providers/checkr.service';

describe('BGVService', () => {
  let service: BGVService;

  const mockPrismaService = {
    bGVSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    bGVCheck: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    candidate: {
      findUnique: jest.fn(),
    },
  };

  const mockCheckrService = {
    createCandidate: jest.fn(),
    createInvitation: jest.fn(),
    getReport: jest.fn(),
    getCandidateReports: jest.fn(),
    getPackages: jest.fn(),
    mapStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BGVService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CheckrService, useValue: mockCheckrService },
      ],
    }).compile();

    service = module.get<BGVService>(BGVService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return BGV settings for tenant', async () => {
      const mockSettings = {
        id: '1',
        provider: 'CHECKR',
        isConfigured: true,
        sandboxMode: true,
      };

      mockPrismaService.bGVSettings.findUnique.mockResolvedValue(mockSettings);

      const result = await service.getSettings('tenant-1');

      expect(mockPrismaService.bGVSettings.findUnique).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        select: { id: true, provider: true, isConfigured: true, sandboxMode: true },
      });
      expect(result).toEqual(mockSettings);
    });

    it('should return null when no settings exist', async () => {
      mockPrismaService.bGVSettings.findUnique.mockResolvedValue(null);

      const result = await service.getSettings('tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('configure', () => {
    it('should configure BGV provider', async () => {
      const configDto = {
        provider: 'CHECKR' as const,
        apiKey: 'test-api-key',
        sandboxMode: true,
      };

      const mockSettings = {
        id: '1',
        ...configDto,
        isConfigured: true,
      };

      mockPrismaService.bGVSettings.upsert.mockResolvedValue(mockSettings);

      const result = await service.configure('tenant-1', configDto);

      expect(mockPrismaService.bGVSettings.upsert).toHaveBeenCalled();
      expect(result.isConfigured).toBe(true);
    });
  });

  describe('initiate', () => {
    it('should initiate a background check with Checkr', async () => {
      const mockSettings = {
        provider: 'CHECKR',
        apiKey: 'test-key',
        sandboxMode: true,
      };

      const mockCandidate = {
        id: 'candidate-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        tenantId: 'tenant-1',
      };

      const mockCheckrCandidate = { id: 'checkr-candidate-1' };
      const mockInvitation = { id: 'invitation-1', invitation_url: 'https://...' };
      const mockBGVCheck = {
        id: 'check-1',
        provider: 'CHECKR',
        status: 'INITIATED',
        externalId: 'invitation-1',
      };

      mockPrismaService.bGVSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrismaService.candidate.findUnique.mockResolvedValue(mockCandidate);
      mockPrismaService.bGVCheck.findFirst.mockResolvedValue(null);
      mockCheckrService.createCandidate.mockResolvedValue(mockCheckrCandidate);
      mockCheckrService.createInvitation.mockResolvedValue(mockInvitation);
      mockPrismaService.bGVCheck.create.mockResolvedValue(mockBGVCheck);

      const result = await service.initiate('tenant-1', 'user-1', {
        candidateId: 'candidate-1',
      });

      expect(mockCheckrService.createCandidate).toHaveBeenCalled();
      expect(mockCheckrService.createInvitation).toHaveBeenCalled();
      expect(result.status).toBe('INITIATED');
    });

    it('should throw error if BGV is not configured', async () => {
      mockPrismaService.bGVSettings.findUnique.mockResolvedValue(null);

      await expect(
        service.initiate('tenant-1', 'user-1', { candidateId: 'candidate-1' }),
      ).rejects.toThrow('BGV provider not configured');
    });

    it('should throw error if candidate already has pending check', async () => {
      mockPrismaService.bGVSettings.findUnique.mockResolvedValue({
        apiKey: 'key',
        provider: 'CHECKR',
      });
      mockPrismaService.candidate.findUnique.mockResolvedValue({
        id: 'candidate-1',
        tenantId: 'tenant-1',
      });
      mockPrismaService.bGVCheck.findFirst.mockResolvedValue({
        id: 'existing-check',
        status: 'IN_PROGRESS',
      });

      await expect(
        service.initiate('tenant-1', 'user-1', { candidateId: 'candidate-1' }),
      ).rejects.toThrow('background check is already in progress');
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard stats', async () => {
      mockPrismaService.bGVCheck.count
        .mockResolvedValueOnce(100)  // total
        .mockResolvedValueOnce(10)   // pending
        .mockResolvedValueOnce(15)   // inProgress
        .mockResolvedValueOnce(60)   // clear
        .mockResolvedValueOnce(5);   // consider

      const result = await service.getDashboard('tenant-1');

      expect(result.total).toBe(100);
      expect(result.pending).toBe(10);
      expect(result.inProgress).toBe(15);
      expect(result.clear).toBe(60);
      expect(result.consider).toBe(5);
      expect(result.clearRate).toBe(60);
    });
  });
});
