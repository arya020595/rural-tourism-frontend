export interface UserRole {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserAssociation {
  id: number;
  name: string;
  image?: string;
}

export interface UserCompany {
  id: number;
  company_name: string;
  email?: string;
  address?: string;
  location?: string;
  postcode?: string;
  contact_no?: string;
  operator_logo_image?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  association_id: number | null;
  role_id: number | null;
  company_id: number | null;
  role?: UserRole | null;
  association?: UserAssociation | null;
  company?: UserCompany | null;
  created_at: string;
  updated_at: string;
}

export interface UserMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: UserMeta;
}

export interface UserSingleResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UserCreatePayload {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmed_password: string;
  role_id?: number | null;
}

export interface UserUpdatePayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmed_password?: string;
}

export interface RoleItem {
  id: number;
  name: string;
}

export interface RoleListResponse {
  success: boolean;
  data: RoleItem[];
}

export interface UserListParams {
  page?: number;
  per_page?: number;
  search?: string;
}
