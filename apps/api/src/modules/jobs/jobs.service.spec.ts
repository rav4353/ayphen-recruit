import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobBoardsService } from '../integrations/job-boards.service';
import { SettingsService } from '../settings/settings.service';

describe('JobsService', () => {
  let service: JobsService;

  const mockPrismaService = {
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    pipeline: {
      findFirst: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockJobBoardsService = {
    postJob: jest.fn(),
    updateJob: jest.fn(),
    removeJob: jest.fn(),
  };

  const mockSettingsService = {
    get: jest.fn(),
    getAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JobBoardsService, useValue: mockJobBoardsService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return jobs with pagination', async () => {
      const mockJobs = [
        { id: '1', title: 'Software Engineer', status: 'PUBLISHED' },
        { id: '2', title: 'Product Manager', status: 'DRAFT' },
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(2);

      const result = await service.findAll('tenant-1', { skip: 0, take: 20 } as any);

      expect(mockPrismaService.job.findMany).toHaveBeenCalled();
      expect(result.jobs).toHaveLength(2);
    });

    it('should filter by status', async () => {
      mockPrismaService.job.findMany.mockResolvedValue([]);
      mockPrismaService.job.count.mockResolvedValue(0);

      await service.findAll('tenant-1', { skip: 0, take: 20, status: 'PUBLISHED' } as any);

      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a new job', async () => {
      const createDto = {
        title: 'Software Engineer',
        description: 'A great opportunity',
        departmentId: 'dept-1',
        locationId: 'loc-1',
      };

      const mockCreated = {
        id: '1',
        jobCode: 'JOB-123456',
        ...createDto,
        tenantId: 'tenant-1',
        status: 'DRAFT',
      };

      mockPrismaService.pipeline.findFirst.mockResolvedValue({ id: 'pipeline-1' });
      mockPrismaService.job.create.mockResolvedValue(mockCreated);
      mockPrismaService.activityLog.create.mockResolvedValue({});

      const result = await service.create(createDto as any, 'tenant-1', 'user-1');

      expect(mockPrismaService.job.create).toHaveBeenCalled();
      expect(result.title).toBe('Software Engineer');
    });
  });
});
