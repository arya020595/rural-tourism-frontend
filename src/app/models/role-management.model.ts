export interface RolePermission {
  id: number;
  name: string;
  code: string;
  resource: string;
  section: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: RolePermission[];
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListItem {
  id: number;
  name: string;
  permissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoleMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface RoleListResponse {
  success: boolean;
  message: string;
  data: RoleListItem[];
  meta: RoleMeta;
}

export interface RoleSingleResponse {
  success: boolean;
  message: string;
  data: Role;
}

export interface PermissionItem {
  id: number;
  name: string;
  code: string;
  resource: string;
  section: string;
}

export interface PermissionListResponse {
  success: boolean;
  message: string;
  data: PermissionItem[];
}

export interface PermissionsBySection {
  [section: string]: PermissionItem[];
}

export interface PermissionsBySectionResponse {
  success: boolean;
  message: string;
  data: PermissionsBySection;
}

export interface RoleCreatePayload {
  name: string;
  permissionIds: number[];
}

export interface RoleUpdatePayload {
  name?: string;
  permissionIds?: number[];
}

export interface RoleListParams {
  page?: number;
  per_page?: number;
  search?: string;
}
