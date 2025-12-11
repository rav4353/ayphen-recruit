import { PrismaClient, JobStatus, ApplicationStatus, InterviewStatus, OfferStatus, InterviewType, EmploymentType, WorkLocation, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Tenant
  // 1. Create Tenant
  // Using a fixed UUID for consistency in development, but it looks like a real ID
  const TENANT_ID = 'd7b3e2a0-5c9f-4b1a-9d8e-3f2c1b0a6e5d';

  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Ayphen Recruit',
      domain: 'recruit.ayphen.com',
      settings: {
        theme: 'light',
        currency: 'USD',
      },
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // 2. Create Departments
  const departments = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'Product', code: 'PROD' },
    { name: 'Sales', code: 'SALES' },
    { name: 'Marketing', code: 'MKT' },
    { name: 'Human Resources', code: 'HR' },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name_tenantId: { name: dept.name, tenantId: tenant.id } },
      update: {},
      create: { ...dept, tenantId: tenant.id },
    });
    createdDepartments.push(created);
  }
  console.log('✅ Departments created');

  // 3. Create Locations
  const locations = [
    { name: 'New York HQ', city: 'New York', country: 'USA', timezone: 'America/New_York' },
    { name: 'London Office', city: 'London', country: 'UK', timezone: 'Europe/London' },
    { name: 'San Francisco Hub', city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles' },
    { name: 'Remote', city: 'Remote', country: 'Global', timezone: 'UTC' },
  ];

  const createdLocations = [];
  for (const loc of locations) {
    const created = await prisma.location.create({
      data: { ...loc, tenantId: tenant.id },
    });
    createdLocations.push(created);
  }
  console.log('✅ Locations created');

  // 4. Create Users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users = [
    { email: 'admin@ayphen.com', firstName: 'Admin', lastName: 'User', role: UserRole.ADMIN, dept: 'Human Resources' },
    { email: 'recruiter@ayphen.com', firstName: 'Sarah', lastName: 'Recruiter', role: UserRole.RECRUITER, dept: 'Human Resources' },
    { email: 'manager@ayphen.com', firstName: 'Mike', lastName: 'Manager', role: UserRole.HIRING_MANAGER, dept: 'Engineering' },
    { email: 'alex.sales@ayphen.com', firstName: 'Alex', lastName: 'Saleslead', role: UserRole.HIRING_MANAGER, dept: 'Sales' },
    { email: 'jess.prod@ayphen.com', firstName: 'Jess', lastName: 'Productlead', role: UserRole.HIRING_MANAGER, dept: 'Product' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const dept = createdDepartments.find(d => d.name === u.dept);
    const user = await prisma.user.upsert({
      where: { email_tenantId: { email: u.email, tenantId: tenant.id } },
      update: { status: 'ACTIVE' },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: hashedPassword,
        role: u.role,
        status: 'ACTIVE',
        tenantId: tenant.id,
        departmentId: dept?.id,
      },
    });
    createdUsers.push(user);
  }
  console.log('✅ Users created (Password: password123)');

  // 5. Create Pipeline
  let pipeline = await prisma.pipeline.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });

  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        name: 'Standard Hiring Pipeline',
        isDefault: true,
        tenantId: tenant.id,
        stages: {
          create: [
            { name: 'Applied', order: 0, color: '#3b82f6' },
            { name: 'Screening', order: 1, color: '#8b5cf6' },
            { name: 'Interview', order: 2, color: '#eab308' },
            { name: 'Offer', order: 3, color: '#f97316' },
            { name: 'Hired', order: 4, color: '#22c55e' },
            { name: 'Rejected', order: 5, color: '#ef4444' },
          ],
        },
      },
    });
  }
  const stages = await prisma.pipelineStage.findMany({ where: { pipelineId: pipeline!.id } });
  console.log('✅ Pipeline created');

  // 6. Create Skills
  const SKILLS = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Language' },
    { name: 'Product Management', category: 'Product' },
    { name: 'Sales Strategy', category: 'Sales' },
    { name: 'Communication', category: 'Soft Skill' },
    { name: 'Leadership', category: 'Soft Skill' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Docker', category: 'DevOps' },
  ];

  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name_tenantId: { name: skill.name, tenantId: tenant.id } },
      update: {},
      create: { ...skill, tenantId: tenant.id },
    });
  }
  console.log('✅ Skills seeded');

  // 7. Create Jobs
  const jobsData = [
    {
      title: 'Senior Frontend Engineer',
      dept: 'Engineering',
      loc: 'Remote',
      status: JobStatus.OPEN,
      salaryMin: 120000,
      salaryMax: 160000,
      currency: 'USD',
      hm: 'manager@ayphen.com',
      desc: 'We are looking for an experienced Frontend Engineer to join our team.',
    },
    {
      title: 'Backend Developer',
      dept: 'Engineering',
      loc: 'New York HQ',
      status: JobStatus.OPEN,
      salaryMin: 110000,
      salaryMax: 150000,
      currency: 'USD',
      hm: 'manager@ayphen.com',
      desc: 'Join our backend team to build scalable APIs.',
    },
    {
      title: 'Product Manager',
      dept: 'Product',
      loc: 'San Francisco Hub',
      status: JobStatus.OPEN,
      salaryMin: 130000,
      salaryMax: 170000,
      currency: 'USD',
      hm: 'jess.prod@ayphen.com',
      desc: 'Lead the product vision for our core platform.',
    },
    {
      title: 'Sales Representative',
      dept: 'Sales',
      loc: 'London Office',
      status: JobStatus.OPEN,
      salaryMin: 50000,
      salaryMax: 80000,
      currency: 'GBP',
      hm: 'alex.sales@ayphen.com',
      desc: 'Join our high-growth sales team.',
    },
    {
      title: 'Marketing Specialist',
      dept: 'Marketing',
      loc: 'Remote',
      status: JobStatus.DRAFT,
      salaryMin: 60000,
      salaryMax: 90000,
      currency: 'USD',
      hm: 'recruiter@ayphen.com',
      desc: 'Help us grow our brand presence.',
    },
    {
      title: 'DevOps Engineer',
      dept: 'Engineering',
      loc: 'Remote',
      status: JobStatus.CLOSED,
      salaryMin: 130000,
      salaryMax: 170000,
      currency: 'USD',
      hm: 'manager@ayphen.com',
      desc: 'Manage our cloud infrastructure.',
    },
  ];

  const createdJobs = [];
  for (const j of jobsData) {
    const dept = createdDepartments.find(d => d.name === j.dept);
    const loc = createdLocations.find(l => l.name === j.loc);
    const hm = createdUsers.find(u => u.email === j.hm);

    // @ts-ignore
    const job = await prisma.job.create({
      data: {
        title: j.title,
        description: j.desc,
        status: j.status,
        employmentType: EmploymentType.FULL_TIME,
        workLocation: j.loc === 'Remote' ? WorkLocation.REMOTE : WorkLocation.ONSITE,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: j.currency,
        departmentId: dept?.id,
        locationId: loc?.id,
        hiringManagerId: hm?.id,
        tenantId: tenant.id,
        pipelineId: pipeline!.id,
      },
    });
    createdJobs.push(job);
  }
  console.log('✅ Jobs created');

  // 8. Create Candidates
  const candidatesData = [
    { first: 'Alice', last: 'Smith', email: 'alice@example.com', title: 'Frontend Dev', company: 'Tech Corp' },
    { first: 'Bob', last: 'Jones', email: 'bob@example.com', title: 'Product Owner', company: 'StartUp Inc' },
    { first: 'Charlie', last: 'Brown', email: 'charlie@example.com', title: 'Sales Rep', company: 'SalesForce' },
    { first: 'David', last: 'Lee', email: 'david@example.com', title: 'Senior Engineer', company: 'Big Tech' },
    { first: 'Eve', last: 'Wilson', email: 'eve@example.com', title: 'Backend Dev', company: 'Cloud Ltd' },
    { first: 'Frank', last: 'Miller', email: 'frank@example.com', title: 'DevOps', company: 'Ops Co' },
    { first: 'Grace', last: 'Taylor', email: 'grace@example.com', title: 'Marketing', company: 'Brand Agency' },
    { first: 'Henry', last: 'Davis', email: 'henry@example.com', title: 'Full Stack', company: 'Freelance' },
    { first: 'Ivy', last: 'Clark', email: 'ivy@example.com', title: 'PM', company: 'Product Co' },
    { first: 'Jack', last: 'White', email: 'jack@example.com', title: 'Sales Lead', company: 'Growth Inc' },
  ];

  const createdCandidates = [];
  for (const c of candidatesData) {
    const candidate = await prisma.candidate.create({
      data: {
        firstName: c.first,
        lastName: c.last,
        email: c.email,
        currentTitle: c.title,
        currentCompany: c.company,
        tenantId: tenant.id,
      },
    });
    createdCandidates.push(candidate);
  }
  console.log('✅ Candidates created');

  // 9. Create Applications
  // Distribute candidates across jobs and stages
  const appsData = [
    { candIdx: 0, jobIdx: 0, stage: 'Interview' }, // Alice -> Frontend
    { candIdx: 1, jobIdx: 2, stage: 'Screening' }, // Bob -> Product
    { candIdx: 2, jobIdx: 3, stage: 'Applied' },   // Charlie -> Sales
    { candIdx: 3, jobIdx: 0, stage: 'Offer' },     // David -> Frontend
    { candIdx: 4, jobIdx: 1, stage: 'Applied' },   // Eve -> Backend
    { candIdx: 5, jobIdx: 5, stage: 'Hired' },     // Frank -> DevOps (Closed job)
    { candIdx: 7, jobIdx: 0, stage: 'Rejected' },  // Henry -> Frontend
    { candIdx: 8, jobIdx: 2, stage: 'Interview' }, // Ivy -> Product
    { candIdx: 9, jobIdx: 3, stage: 'Offer' },     // Jack -> Sales
  ];

  const createdApps = [];
  for (const app of appsData) {
    const stage = stages.find(s => s.name === app.stage);
    const application = await prisma.application.create({
      data: {
        candidateId: createdCandidates[app.candIdx].id,
        jobId: createdJobs[app.jobIdx].id,
        currentStageId: stage!.id,
        status: ApplicationStatus.APPLIED, // Default status, stage determines pipeline position
      },
    });
    createdApps.push(application);
  }
  console.log('✅ Applications created');

  // 10. Create Interviews
  const interviewTime = new Date();
  interviewTime.setDate(interviewTime.getDate() + 1); // Tomorrow
  interviewTime.setHours(14, 0, 0, 0);

  const pastInterviewTime = new Date();
  pastInterviewTime.setDate(pastInterviewTime.getDate() - 2); // 2 days ago
  pastInterviewTime.setHours(10, 0, 0, 0);

  await prisma.interview.create({
    data: {
      notes: 'Technical Deep Dive',
      scheduledAt: interviewTime,
      duration: 60,
      type: InterviewType.VIDEO,
      status: InterviewStatus.SCHEDULED,
      applicationId: createdApps[0].id, // Alice
      interviewerId: createdUsers[2].id, // Manager Mike
    },
  });

  await prisma.interview.create({
    data: {
      notes: 'Initial Screening',
      scheduledAt: pastInterviewTime,
      duration: 30,
      type: InterviewType.PHONE_SCREEN,
      status: InterviewStatus.COMPLETED,
      applicationId: createdApps[7].id, // Ivy
      interviewerId: createdUsers[4].id, // Jess Product
    },
  });
  console.log('✅ Interviews scheduled');

  // 11. Create Offer Template
  const offerTemplate = await prisma.offerTemplate.create({
    data: {
      name: 'Standard Full-Time Offer',
      content: `
        <h2>Offer of Employment</h2>
        <p>Dear {{CandidateName}},</p>
        <p>We are pleased to offer you the position of <strong>{{JobTitle}}</strong> at Ayphen Recruit.</p>
        <p><strong>Start Date:</strong> {{StartDate}}</p>
        <p><strong>Salary:</strong> {{Salary}} per year</p>
        <p><strong>Equity:</strong> {{Equity}}</p>
        <p><strong>Bonus:</strong> {{Bonus}}</p>
        <p>We look forward to having you on the team!</p>
        <p>Sincerely,<br/>The Hiring Team</p>
      `,
      tenantId: tenant.id,
    },
  });

  // 12. Create Offers
  // David -> Frontend (Draft)
  await prisma.offer.create({
    data: {
      applicationId: createdApps[3].id,
      templateId: offerTemplate.id,
      status: OfferStatus.DRAFT,
      salary: 145000,
      currency: 'USD',
      startDate: new Date(new Date().setDate(new Date().getDate() + 14)),
      equity: '0.05%',
      bonus: 10000,
      content: offerTemplate.content,
    },
  });

  // Jack -> Sales (Sent)
  await prisma.offer.create({
    data: {
      applicationId: createdApps[8].id,
      templateId: offerTemplate.id,
      status: OfferStatus.SENT,
      salary: 75000,
      currency: 'GBP',
      startDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      equity: '0.02%',
      bonus: 25000,
      content: offerTemplate.content,
      sentAt: new Date(),
      token: 'sample-token-123',
    },
  });
  console.log('✅ Offers created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
