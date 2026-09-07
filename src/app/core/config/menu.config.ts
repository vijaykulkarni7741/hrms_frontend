export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  permission?: string;     // show only if user has this permission
  roles?: string[];        // show only if user has one of these roles
  children?: MenuItem[];
  badge?: string;
  dividerAfter?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    route: '/dashboard',
    dividerAfter: false,
  },

  // ── Employee Management ──────────────────────────────────────
  {
    id: 'employees',
    label: 'Employees',
    icon: '👥',
    roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'],
    children: [
      { id: 'employee-list',    label: 'All Employees',   icon: '📋', route: '/employees',            roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE']   },
      { id: 'employee-add',     label: 'Add Employee',    icon: '➕', route: '/employees/new',         roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'] },
      { id: 'departments',      label: 'Departments',     icon: '🏢', route: '/departments',           roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'designations',     label: 'Designations',    icon: '💼', route: '/designations',          roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'asset-allocations', label: 'Asset Allocations', icon: '💻', route: '/assets',              roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'] },
      { id: 'resignation-queue', label: 'Resignation Approvals', icon: '📜', route: '/resignations',      roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'SENIOR_MANAGER', 'MANAGER'] },
      { id: 'document-types',   label: 'Document Types',  icon: '📄', route: '/document-types',        roles: ['ADMIN', 'HR_MANAGER']   },
    ],
  },

  // ── Attendance ───────────────────────────────────────────────
  {
    id: 'attendance',
    label: 'Attendance',
    icon: '🕐',
    children: [
      { id: 'mark-attendance',    label: 'Live Selfie Check-In', icon: '📸', route: '/attendance/mark' },
      { id: 'attendance-log',     label: 'Attendance Log',   icon: '📅', route: '/attendance' },
      { id: 'shifts',             label: 'Shift & Week-Off',       icon: '🔄', route: '/shifts' },
      { id: 'holidays',           label: 'Holiday Calendar', icon: '🎉', route: '/holidays' },
    ],
  },

  // ── Leave ────────────────────────────────────────────────────
  {
    id: 'leave',
    label: 'Leave',
    icon: '🌴',
    children: [
      { id: 'my-leaves',          label: 'My Leaves',        icon: '📤', route: '/leave/my' },
      { id: 'leave-approvals',    label: 'Approvals',        icon: '✔️', route: '/leave/approvals',      roles: ['ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'SENIOR_MANAGER', 'MANAGER'] },
      { id: 'leave-types',        label: 'Leave Types',      icon: '🗂️', route: '/leave-types',          roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'leave-balances',     label: 'Leave Balances',   icon: '⚖️', route: '/leave/balances',       roles: ['ADMIN', 'HR_MANAGER'] },
    ],
  },

  // ── Payroll ──────────────────────────────────────────────────
  {
    id: 'payroll',
    label: 'Payroll',
    icon: '💰',
    roles: ['ADMIN', 'HR_MANAGER'],
    children: [
      { id: 'salary-slips',       label: 'Salary Slips',     icon: '🧾', route: '/payroll/slips' },
      { id: 'salary-structures',  label: 'Salary Structures',icon: '📊', route: '/payroll/structures',   roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'salary-components',  label: 'Components',       icon: '🔧', route: '/payroll/components',   roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'tax-rules',          label: 'Tax Rules',        icon: '📑', route: '/payroll/tax-rules',    roles: ['ADMIN', 'HR_MANAGER'] },
      { id: 'process-payroll',    label: 'Process Payroll',  icon: '▶️', route: '/payroll/process',      roles: ['ADMIN', 'HR_MANAGER'] },
    ],
  },

  // ── Workflow & Approvals ─────────────────────────────────────
  {
    id: 'workflow',
    label: 'Workflows',
    icon: '🔀',
    roles: ['ADMIN', 'HR_MANAGER', 'SENIOR_MANAGER', 'MANAGER'],
    children: [
      { id: 'workflow-list',      label: 'All Workflows',    icon: '📋', route: '/workflows' },
      { id: 'workflow-approvals', label: 'My Approvals',     icon: '✅', route: '/workflows/approvals' },
    ],
  },

  // ── Travel & Expenses ────────────────────────────────────────
  {
    id: 'travel',
    label: 'Travel & Expenses',
    icon: '✈️',
    children: [
      { id: 'travel-requests',    label: 'My Requests',      icon: '📤', route: '/travel' },
      { id: 'travel-approvals',   label: 'Approvals',        icon: '✔️', route: '/travel/approvals',     roles: ['ADMIN', 'HR_MANAGER', 'SENIOR_MANAGER', 'MANAGER'] },
      { id: 'expense-claims',     label: 'Expense Claims',   icon: '🧾', route: '/expenses' },
    ],
  },

  // ── Policies ─────────────────────────────────────────────────
  {
    id: 'company-policies',
    label: 'Company Policies',
    icon: '📜',
    route: '/admin/policies',
    dividerAfter: true,
  },

  // ── Admin ────────────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Administration',
    icon: '⚙️',
    roles: ['ADMIN', 'HR_MANAGER'],
    children: [
      { id: 'users',              label: 'Users',            icon: '👤', route: '/admin/users' },
      { id: 'roles',              label: 'Roles',            icon: '🔑', route: '/admin/roles' },
      { id: 'permissions',        label: 'Permissions',      icon: '🛡️', route: '/admin/permissions' },
      { id: 'company',            label: 'Company Setup',    icon: '🏗️', route: '/admin/company' },
      { id: 'branches',           label: 'Branches',         icon: '🏢', route: '/admin/branches' },
      { id: 'countries',          label: 'Countries',        icon: '🌐', route: '/admin/countries' },
      { id: 'states',             label: 'States',           icon: '🗺️', route: '/admin/states' },
      { id: 'cities',             label: 'Cities',           icon: '🏙️', route: '/admin/cities' },
      { id: 'units',              label: 'Units',            icon: '📍', route: '/admin/units' },
      { id: 'hr-rules',           label: 'HR Policy Rules',  icon: '⚙️', route: '/admin/rules' },
      { id: 'lookup-types',       label: 'Lookup Types Master', icon: '🗂️', route: '/admin/lookup-types' },
      { id: 'lookup-values',      label: 'Lookup Values Master', icon: '🏷️', route: '/admin/lookup-values' },
    ],
  },
];

