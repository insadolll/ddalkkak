export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE';
  position: string;
  ourCompanyId: number;
  ourCompanyCode: string;
  ourCompanyName: string;
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
