# Contributing to Ayphen TalentX

Thank you for your interest in contributing to TalentX! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- pnpm >= 8.x
- PostgreSQL >= 14
- Redis >= 6 (optional for development)
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/talentx.git
cd talentx

# Add upstream remote
git remote add upstream https://github.com/ayphen/talentx.git
```

---

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Set Up Database

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

### 4. Start Development Servers

```bash
# From root directory
pnpm dev

# Or start individually
pnpm --filter api dev
pnpm --filter web dev
```

### 5. Verify Setup

- API: http://localhost:3001/api/v1/health
- Web: http://localhost:3000
- API Docs: http://localhost:3001/api/v1/docs

---

## Coding Standards

### TypeScript

We use strict TypeScript throughout the project.

```typescript
// ✅ Good: Explicit types
function createUser(data: CreateUserDto): Promise<User> {
  return this.prisma.user.create({ data });
}

// ❌ Bad: Implicit any
function createUser(data) {
  return this.prisma.user.create({ data });
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-profile.service.ts` |
| Classes | PascalCase | `UserProfileService` |
| Functions | camelCase | `getUserById` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Interfaces | PascalCase (no I prefix) | `UserProfile` |
| Types | PascalCase | `ApplicationStatus` |

### Backend (NestJS)

```typescript
// Service structure
@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async findAll(tenantId: string, params: FindCandidatesDto) {
    // Implementation
  }
}

// Controller structure
@Controller('candidates')
@ApiTags('candidates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @RequirePermissions(Permission.CANDIDATE_VIEW)
  @ApiOperation({ summary: 'List all candidates' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: FindCandidatesDto) {
    return this.candidatesService.findAll(user.tenantId, query);
  }
}
```

### Frontend (React)

```tsx
// Component structure
interface CandidateCardProps {
  candidate: Candidate;
  onSelect?: (id: string) => void;
}

export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  const handleClick = () => {
    onSelect?.(candidate.id);
  };

  return (
    <div className="card" onClick={handleClick}>
      {/* Content */}
    </div>
  );
}

// Hooks usage
export function CandidatesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidatesApi.getAll(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map(candidate => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
}
```

### Code Style

We use ESLint and Prettier for consistent formatting.

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix lint issues
pnpm lint:fix
```

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Use soft delete to maintain referential integrity with activity logs
await this.prisma.candidate.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// ❌ Bad: Redundant comments
// Delete the candidate
await this.prisma.candidate.delete({ where: { id } });
```

---

## Git Workflow

### Branch Naming

```
feature/ABC-123-add-candidate-notes
bugfix/ABC-456-fix-email-sending
hotfix/ABC-789-security-patch
chore/update-dependencies
docs/improve-readme
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructure
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
feat(candidates): add bulk email functionality

fix(auth): resolve token refresh race condition

docs(api): update swagger descriptions for jobs endpoints

chore(deps): upgrade prisma to v5.0
```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**
   ```bash
   pnpm test
   ```

3. **Run linting**
   ```bash
   pnpm lint
   ```

4. **Build successfully**
   ```bash
   pnpm build
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing approach

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests for new functionality
- [ ] All tests pass locally
- [ ] I have updated documentation as needed
- [ ] My changes generate no new warnings
```

### Review Process

1. Create PR against `main` branch
2. Fill out the PR template completely
3. Wait for CI checks to pass
4. Request review from maintainers
5. Address feedback and update PR
6. Once approved, maintainer will merge

### PR Best Practices

- Keep PRs focused and small (< 400 lines ideally)
- One PR per feature/fix
- Include screenshots for UI changes
- Link related issues
- Respond to feedback promptly

---

## Testing Guidelines

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

### Writing Tests

```typescript
// Unit test example
describe('CandidatesService', () => {
  let service: CandidatesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CandidatesService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return paginated candidates for tenant', async () => {
      const tenantId = 'tenant-1';
      const mockCandidates = [{ id: '1', firstName: 'John' }];
      
      prisma.candidate.findMany.mockResolvedValue(mockCandidates);

      const result = await service.findAll(tenantId, {});

      expect(result).toEqual(mockCandidates);
      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId } })
      );
    });
  });
});
```

### Test Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific test file
pnpm test -- candidates.service.spec.ts

# Run e2e tests
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Coverage Requirements

- Minimum 80% coverage for new code
- Critical paths should have 100% coverage
- All bug fixes must include regression tests

---

## Documentation

### Code Documentation

```typescript
/**
 * Creates a new candidate in the system.
 * 
 * @param tenantId - The tenant identifier
 * @param data - Candidate creation data
 * @returns The created candidate with generated ID
 * @throws ConflictException if email already exists
 * 
 * @example
 * const candidate = await service.create('tenant-1', {
 *   email: 'john@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 */
async create(tenantId: string, data: CreateCandidateDto): Promise<Candidate> {
  // Implementation
}
```

### API Documentation

All endpoints should have Swagger decorators:

```typescript
@Post()
@ApiOperation({ summary: 'Create a new candidate' })
@ApiResponse({ status: 201, description: 'Candidate created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 409, description: 'Email already exists' })
async create(@Body() dto: CreateCandidateDto) {
  // Implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing environment variables
- Modifying setup steps
- Adding new dependencies

---

## Issue Guidelines

### Bug Reports

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10]
```

### Feature Requests

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
Describe your ideal solution

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

---

## Getting Help

- 📖 Check existing documentation
- 🔍 Search existing issues
- 💬 Ask in discussions
- 📧 Email: engineering@ayphen.com

---

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual contributor spotlight

Thank you for contributing to TalentX! 🎉
