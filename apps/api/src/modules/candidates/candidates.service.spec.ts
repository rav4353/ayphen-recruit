import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { SkillsService } from '../reference/skills.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const mockPrismaService = {
    candidate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockSkillsService = {
    normalizeSkills: jest.fn().mockImplementation((skills) => Promise.resolve(skills)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SkillsService, useValue: mockSkillsService },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated candidates', async () => {
      const mockCandidates = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', applications: [], _count: { applications: 0 } },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', applications: [], _count: { applications: 0 } },
      ];

      mockPrismaService.candidate.findMany.mockResolvedValue(mockCandidates);
      mockPrismaService.candidate.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1', {});

      expect(mockPrismaService.candidate.findMany).toHaveBeenCalled();
      expect(result.candidates).toHaveLength(2);
    });

    it('should apply search filter', async () => {
      mockPrismaService.candidate.findMany.mockResolvedValue([]);
      mockPrismaService.candidate.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { search: 'john' });

      expect(mockPrismaService.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a new candidate', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockCreated = {
        id: '1',
        candidateId: 'CAND-123456',
        ...createDto,
        tenantId: 'tenant-1',
        createdAt: new Date(),
      };

      mockPrismaService.candidate.findFirst.mockResolvedValue(null);
      mockPrismaService.candidate.create.mockResolvedValue(mockCreated);
      mockPrismaService.activityLog.create.mockResolvedValue({});

      const result = await service.create(createDto as any, 'tenant-1');

      expect(mockPrismaService.candidate.create).toHaveBeenCalled();
      expect(result.email).toBe('john@example.com');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const createDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
      };

      mockPrismaService.candidate.findFirst.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      });

      await expect(service.create(createDto as any, 'tenant-1')).rejects.toThrow();
    });
  });
});
