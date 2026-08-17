export const ROLES = ["Admin", "Manager", "Editor", "Viewer"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: string): Role {
  if (isRole(value)) return value;
  if (value === "Studio Lead") return "Admin";
  return "Viewer";
}

const rank: Record<Role, number> = {
  Admin: 4,
  Manager: 3,
  Editor: 2,
  Viewer: 1,
};

export function can(role: string, action: Permission) {
  const current = normalizeRole(role);
  return PERMISSIONS[action].includes(current);
}

export type Permission =
  | "manageUsers"
  | "manageSettings"
  | "manageStages"
  | "viewFinance"
  | "viewFinanceAnalytics"
  | "managePayments"
  | "createRecords"
  | "editRecords"
  | "deleteRecords"
  | "movePipeline"
  | "addNotes";

const PERMISSIONS: Record<Permission, Role[]> = {
  manageUsers: ["Admin"],
  manageSettings: ["Admin"],
  manageStages: ["Admin"],
  viewFinance: ["Admin", "Manager", "Viewer"],
  viewFinanceAnalytics: ["Admin", "Manager"],
  managePayments: ["Admin", "Manager"],
  createRecords: ["Admin", "Manager", "Editor"],
  editRecords: ["Admin", "Manager", "Editor"],
  deleteRecords: ["Admin", "Manager"],
  movePipeline: ["Admin", "Manager", "Editor"],
  addNotes: ["Admin", "Manager", "Editor"],
};

export function roleLabel(role: string) {
  return normalizeRole(role);
}
