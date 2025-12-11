export declare class CreateUserDto {
    email: string;
    firstName: string;
    lastName: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE' | 'VENDOR';
    phone?: string;
    title?: string;
    departmentId?: string;
    password?: string;
    customPermissions?: string[];
    roleId?: string;
}
