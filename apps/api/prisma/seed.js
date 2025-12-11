"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcrypt"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var TENANT_ID, tenant, departments, createdDepartments, _i, departments_1, dept, created, locations, createdLocations, _a, locations_1, loc, created, salt, hashedPassword, users, createdUsers, _loop_1, _b, users_1, u, pipeline, stages, SKILLS, _c, SKILLS_1, skill, jobsData, createdJobs, _loop_2, _d, jobsData_1, j, candidatesData, createdCandidates, _e, candidatesData_1, c, candidate, appsData, createdApps, _loop_3, _f, appsData_1, app, interviewTime, pastInterviewTime, offerTemplate;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    TENANT_ID = 'd7b3e2a0-5c9f-4b1a-9d8e-3f2c1b0a6e5d';
                    return [4 /*yield*/, prisma.tenant.upsert({
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
                        })];
                case 1:
                    tenant = _g.sent();
                    console.log('✅ Tenant created:', tenant.name);
                    departments = [
                        { name: 'Engineering', code: 'ENG' },
                        { name: 'Product', code: 'PROD' },
                        { name: 'Sales', code: 'SALES' },
                        { name: 'Marketing', code: 'MKT' },
                        { name: 'Human Resources', code: 'HR' },
                    ];
                    createdDepartments = [];
                    _i = 0, departments_1 = departments;
                    _g.label = 2;
                case 2:
                    if (!(_i < departments_1.length)) return [3 /*break*/, 5];
                    dept = departments_1[_i];
                    return [4 /*yield*/, prisma.department.upsert({
                            where: { name_tenantId: { name: dept.name, tenantId: tenant.id } },
                            update: {},
                            create: __assign(__assign({}, dept), { tenantId: tenant.id }),
                        })];
                case 3:
                    created = _g.sent();
                    createdDepartments.push(created);
                    _g.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('✅ Departments created');
                    locations = [
                        { name: 'New York HQ', city: 'New York', country: 'USA', timezone: 'America/New_York' },
                        { name: 'London Office', city: 'London', country: 'UK', timezone: 'Europe/London' },
                        { name: 'San Francisco Hub', city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles' },
                        { name: 'Remote', city: 'Remote', country: 'Global', timezone: 'UTC' },
                    ];
                    createdLocations = [];
                    _a = 0, locations_1 = locations;
                    _g.label = 6;
                case 6:
                    if (!(_a < locations_1.length)) return [3 /*break*/, 9];
                    loc = locations_1[_a];
                    return [4 /*yield*/, prisma.location.create({
                            data: __assign(__assign({}, loc), { tenantId: tenant.id }),
                        })];
                case 7:
                    created = _g.sent();
                    createdLocations.push(created);
                    _g.label = 8;
                case 8:
                    _a++;
                    return [3 /*break*/, 6];
                case 9:
                    console.log('✅ Locations created');
                    return [4 /*yield*/, bcrypt.genSalt(10)];
                case 10:
                    salt = _g.sent();
                    return [4 /*yield*/, bcrypt.hash('password123', salt)];
                case 11:
                    hashedPassword = _g.sent();
                    users = [
                        { email: 'admin@ayphen.com', firstName: 'Admin', lastName: 'User', role: client_1.UserRole.ADMIN, dept: 'Human Resources' },
                        { email: 'recruiter@ayphen.com', firstName: 'Sarah', lastName: 'Recruiter', role: client_1.UserRole.RECRUITER, dept: 'Human Resources' },
                        { email: 'manager@ayphen.com', firstName: 'Mike', lastName: 'Manager', role: client_1.UserRole.HIRING_MANAGER, dept: 'Engineering' },
                        { email: 'alex.sales@ayphen.com', firstName: 'Alex', lastName: 'Saleslead', role: client_1.UserRole.HIRING_MANAGER, dept: 'Sales' },
                        { email: 'jess.prod@ayphen.com', firstName: 'Jess', lastName: 'Productlead', role: client_1.UserRole.HIRING_MANAGER, dept: 'Product' },
                    ];
                    createdUsers = [];
                    _loop_1 = function (u) {
                        var dept, user;
                        return __generator(this, function (_h) {
                            switch (_h.label) {
                                case 0:
                                    dept = createdDepartments.find(function (d) { return d.name === u.dept; });
                                    return [4 /*yield*/, prisma.user.upsert({
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
                                                departmentId: dept === null || dept === void 0 ? void 0 : dept.id,
                                            },
                                        })];
                                case 1:
                                    user = _h.sent();
                                    createdUsers.push(user);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _b = 0, users_1 = users;
                    _g.label = 12;
                case 12:
                    if (!(_b < users_1.length)) return [3 /*break*/, 15];
                    u = users_1[_b];
                    return [5 /*yield**/, _loop_1(u)];
                case 13:
                    _g.sent();
                    _g.label = 14;
                case 14:
                    _b++;
                    return [3 /*break*/, 12];
                case 15:
                    console.log('✅ Users created (Password: password123)');
                    return [4 /*yield*/, prisma.pipeline.findFirst({
                            where: { tenantId: tenant.id, isDefault: true },
                        })];
                case 16:
                    pipeline = _g.sent();
                    if (!!pipeline) return [3 /*break*/, 18];
                    return [4 /*yield*/, prisma.pipeline.create({
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
                        })];
                case 17:
                    pipeline = _g.sent();
                    _g.label = 18;
                case 18: return [4 /*yield*/, prisma.pipelineStage.findMany({ where: { pipelineId: pipeline.id } })];
                case 19:
                    stages = _g.sent();
                    console.log('✅ Pipeline created');
                    SKILLS = [
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
                    _c = 0, SKILLS_1 = SKILLS;
                    _g.label = 20;
                case 20:
                    if (!(_c < SKILLS_1.length)) return [3 /*break*/, 23];
                    skill = SKILLS_1[_c];
                    return [4 /*yield*/, prisma.skill.upsert({
                            where: { name_tenantId: { name: skill.name, tenantId: tenant.id } },
                            update: {},
                            create: __assign(__assign({}, skill), { tenantId: tenant.id }),
                        })];
                case 21:
                    _g.sent();
                    _g.label = 22;
                case 22:
                    _c++;
                    return [3 /*break*/, 20];
                case 23:
                    console.log('✅ Skills seeded');
                    jobsData = [
                        {
                            title: 'Senior Frontend Engineer',
                            dept: 'Engineering',
                            loc: 'Remote',
                            status: client_1.JobStatus.OPEN,
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
                            status: client_1.JobStatus.OPEN,
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
                            status: client_1.JobStatus.OPEN,
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
                            status: client_1.JobStatus.OPEN,
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
                            status: client_1.JobStatus.DRAFT,
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
                            status: client_1.JobStatus.CLOSED,
                            salaryMin: 130000,
                            salaryMax: 170000,
                            currency: 'USD',
                            hm: 'manager@ayphen.com',
                            desc: 'Manage our cloud infrastructure.',
                        },
                    ];
                    createdJobs = [];
                    _loop_2 = function (j) {
                        var dept, loc, hm, job;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    dept = createdDepartments.find(function (d) { return d.name === j.dept; });
                                    loc = createdLocations.find(function (l) { return l.name === j.loc; });
                                    hm = createdUsers.find(function (u) { return u.email === j.hm; });
                                    return [4 /*yield*/, prisma.job.create({
                                            data: {
                                                title: j.title,
                                                description: j.desc,
                                                status: j.status,
                                                employmentType: client_1.EmploymentType.FULL_TIME,
                                                workLocation: j.loc === 'Remote' ? client_1.WorkLocation.REMOTE : client_1.WorkLocation.ONSITE,
                                                salaryMin: j.salaryMin,
                                                salaryMax: j.salaryMax,
                                                salaryCurrency: j.currency,
                                                departmentId: dept === null || dept === void 0 ? void 0 : dept.id,
                                                locationId: loc === null || loc === void 0 ? void 0 : loc.id,
                                                hiringManagerId: hm === null || hm === void 0 ? void 0 : hm.id,
                                                tenantId: tenant.id,
                                                pipelineId: pipeline.id,
                                            },
                                        })];
                                case 1:
                                    job = _j.sent();
                                    createdJobs.push(job);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, jobsData_1 = jobsData;
                    _g.label = 24;
                case 24:
                    if (!(_d < jobsData_1.length)) return [3 /*break*/, 27];
                    j = jobsData_1[_d];
                    return [5 /*yield**/, _loop_2(j)];
                case 25:
                    _g.sent();
                    _g.label = 26;
                case 26:
                    _d++;
                    return [3 /*break*/, 24];
                case 27:
                    console.log('✅ Jobs created');
                    candidatesData = [
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
                    createdCandidates = [];
                    _e = 0, candidatesData_1 = candidatesData;
                    _g.label = 28;
                case 28:
                    if (!(_e < candidatesData_1.length)) return [3 /*break*/, 31];
                    c = candidatesData_1[_e];
                    return [4 /*yield*/, prisma.candidate.create({
                            data: {
                                firstName: c.first,
                                lastName: c.last,
                                email: c.email,
                                currentTitle: c.title,
                                currentCompany: c.company,
                                tenantId: tenant.id,
                            },
                        })];
                case 29:
                    candidate = _g.sent();
                    createdCandidates.push(candidate);
                    _g.label = 30;
                case 30:
                    _e++;
                    return [3 /*break*/, 28];
                case 31:
                    console.log('✅ Candidates created');
                    appsData = [
                        { candIdx: 0, jobIdx: 0, stage: 'Interview' }, // Alice -> Frontend
                        { candIdx: 1, jobIdx: 2, stage: 'Screening' }, // Bob -> Product
                        { candIdx: 2, jobIdx: 3, stage: 'Applied' }, // Charlie -> Sales
                        { candIdx: 3, jobIdx: 0, stage: 'Offer' }, // David -> Frontend
                        { candIdx: 4, jobIdx: 1, stage: 'Applied' }, // Eve -> Backend
                        { candIdx: 5, jobIdx: 5, stage: 'Hired' }, // Frank -> DevOps (Closed job)
                        { candIdx: 7, jobIdx: 0, stage: 'Rejected' }, // Henry -> Frontend
                        { candIdx: 8, jobIdx: 2, stage: 'Interview' }, // Ivy -> Product
                        { candIdx: 9, jobIdx: 3, stage: 'Offer' }, // Jack -> Sales
                    ];
                    createdApps = [];
                    _loop_3 = function (app) {
                        var stage, application;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    stage = stages.find(function (s) { return s.name === app.stage; });
                                    return [4 /*yield*/, prisma.application.create({
                                            data: {
                                                candidateId: createdCandidates[app.candIdx].id,
                                                jobId: createdJobs[app.jobIdx].id,
                                                currentStageId: stage.id,
                                                status: client_1.ApplicationStatus.APPLIED, // Default status, stage determines pipeline position
                                            },
                                        })];
                                case 1:
                                    application = _k.sent();
                                    createdApps.push(application);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _f = 0, appsData_1 = appsData;
                    _g.label = 32;
                case 32:
                    if (!(_f < appsData_1.length)) return [3 /*break*/, 35];
                    app = appsData_1[_f];
                    return [5 /*yield**/, _loop_3(app)];
                case 33:
                    _g.sent();
                    _g.label = 34;
                case 34:
                    _f++;
                    return [3 /*break*/, 32];
                case 35:
                    console.log('✅ Applications created');
                    interviewTime = new Date();
                    interviewTime.setDate(interviewTime.getDate() + 1); // Tomorrow
                    interviewTime.setHours(14, 0, 0, 0);
                    pastInterviewTime = new Date();
                    pastInterviewTime.setDate(pastInterviewTime.getDate() - 2); // 2 days ago
                    pastInterviewTime.setHours(10, 0, 0, 0);
                    return [4 /*yield*/, prisma.interview.create({
                            data: {
                                notes: 'Technical Deep Dive',
                                scheduledAt: interviewTime,
                                duration: 60,
                                type: client_1.InterviewType.VIDEO,
                                status: client_1.InterviewStatus.SCHEDULED,
                                applicationId: createdApps[0].id, // Alice
                                interviewerId: createdUsers[2].id, // Manager Mike
                            },
                        })];
                case 36:
                    _g.sent();
                    return [4 /*yield*/, prisma.interview.create({
                            data: {
                                notes: 'Initial Screening',
                                scheduledAt: pastInterviewTime,
                                duration: 30,
                                type: client_1.InterviewType.PHONE_SCREEN,
                                status: client_1.InterviewStatus.COMPLETED,
                                applicationId: createdApps[7].id, // Ivy
                                interviewerId: createdUsers[4].id, // Jess Product
                            },
                        })];
                case 37:
                    _g.sent();
                    console.log('✅ Interviews scheduled');
                    return [4 /*yield*/, prisma.offerTemplate.create({
                            data: {
                                name: 'Standard Full-Time Offer',
                                content: "\n        <h2>Offer of Employment</h2>\n        <p>Dear {{CandidateName}},</p>\n        <p>We are pleased to offer you the position of <strong>{{JobTitle}}</strong> at Ayphen Recruit.</p>\n        <p><strong>Start Date:</strong> {{StartDate}}</p>\n        <p><strong>Salary:</strong> {{Salary}} per year</p>\n        <p><strong>Equity:</strong> {{Equity}}</p>\n        <p><strong>Bonus:</strong> {{Bonus}}</p>\n        <p>We look forward to having you on the team!</p>\n        <p>Sincerely,<br/>The Hiring Team</p>\n      ",
                                tenantId: tenant.id,
                            },
                        })];
                case 38:
                    offerTemplate = _g.sent();
                    // 12. Create Offers
                    // David -> Frontend (Draft)
                    return [4 /*yield*/, prisma.offer.create({
                            data: {
                                applicationId: createdApps[3].id,
                                templateId: offerTemplate.id,
                                status: client_1.OfferStatus.DRAFT,
                                salary: 145000,
                                currency: 'USD',
                                startDate: new Date(new Date().setDate(new Date().getDate() + 14)),
                                equity: '0.05%',
                                bonus: 10000,
                                content: offerTemplate.content,
                            },
                        })];
                case 39:
                    // 12. Create Offers
                    // David -> Frontend (Draft)
                    _g.sent();
                    // Jack -> Sales (Sent)
                    return [4 /*yield*/, prisma.offer.create({
                            data: {
                                applicationId: createdApps[8].id,
                                templateId: offerTemplate.id,
                                status: client_1.OfferStatus.SENT,
                                salary: 75000,
                                currency: 'GBP',
                                startDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                                equity: '0.02%',
                                bonus: 25000,
                                content: offerTemplate.content,
                                sentAt: new Date(),
                                token: 'sample-token-123',
                            },
                        })];
                case 40:
                    // Jack -> Sales (Sent)
                    _g.sent();
                    console.log('✅ Offers created');
                    console.log('🎉 Database seeding completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
