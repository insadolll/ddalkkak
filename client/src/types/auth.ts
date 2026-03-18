export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE';
  position: string;
  ourCompanyId: string;
  ourCompanyCode: string;
  ourCompanyName: string;
  departmentId?: string;
  departmentName?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface MeResponse {
  success: boolean;
  data: User;
}
