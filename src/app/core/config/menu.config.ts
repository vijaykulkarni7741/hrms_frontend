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
    permission: 'EMPLOYEE_VIEW',
    children: [
      { id: 'employee-list',    label: 'All Employees',   icon: '📋', route: '/employees',            permission: 'EMPLOYEE_VIEW'   },
      { id: 'employee-add',     label: 'Add Employee',    icon: '➕', route: '/employees/new',         permission: 'EMPLOYEE_CREATE' },
      { id: 'departments',      label: 'Departments',     icon: '🏢', route: '/departments',           permission: 'DEPARTMENT_VIEW' },
      { id: 'designations',     label: 'Designations',    icon: '💼', route: '/designations',          permission: 'DESIGNATION_VIEW'},
      { id: 'document-types',   label: 'Document Types',  icon: '📄', route: '/document-types',        permission: 'DOCUMENT_VIEW'   },
    ],
  },

  // ── Attendance ───────────────────────────────────────────────
  {
    id: 'attendance',
    label: 'Attendance',
    icon: '🕐',
    permission: 'ATTENDANCE_VIEW',
    children: [
      { id: 'attendance-log',     label: 'Attendance Log',   icon: '📅', route: '/attendance',           permission: 'ATTENDANCE_VIEW'   },
      { id: 'shifts',             label: 'Shift Management', icon: '🔄', route: '/shifts',               permission: 'SHIFT_VIEW'        },
      { id: 'holidays',           label: 'Holiday Calendar', icon: '🎉', route: '/holidays',             permission: 'HOLIDAY_VIEW'      },
    ],
  },

  // ── Leave ────────────────────────────────────────────────────
  {
    id: 'leave',
    label: 'Leave',
    icon: '🌴',
    permission: 'LEAVE_VIEW',
    children: [
      { id: 'my-leaves',          label: 'My Leaves',        icon: '📤', route: '/leave/my',             permission: 'LEAVE_APPLY'       },
      { id: 'leave-approvals',    label: 'Approvals',        icon: '✔️', route: '/leave/approvals',      permission: 'LEAVE_APPROVE'     },
      { id: 'leave-types',        label: 'Leave Types',      icon: '🗂️', route: '/leave-types',          permission: 'LEAVE_TYPE_VIEW'   },
      { id: 'leave-balances',     label: 'Leave Balances',   icon: '⚖️', route: '/leave/balances',       permission: 'LEAVE_VIEW'        },
    ],
  },

  // ── Payroll ──────────────────────────────────────────────────
  {
    id: 'payroll',
    label: 'Payroll',
    icon: '💰',
    permission: 'PAYROLL_VIEW',
    children: [
      { id: 'salary-slips',       label: 'Salary Slips',     icon: '🧾', route: '/payroll/slips',        permission: 'PAYROLL_VIEW'      },
      { id: 'salary-structures',  label: 'Salary Structures',icon: '📊', route: '/payroll/structures',   permission: 'PAYROLL_MANAGE'    },
      { id: 'salary-components',  label: 'Components',       icon: '🔧', route: '/payroll/components',   permission: 'PAYROLL_MANAGE'    },
      { id: 'tax-rules',          label: 'Tax Rules',        icon: '📑', route: '/payroll/tax-rules',    permission: 'PAYROLL_MANAGE'    },
      { id: 'process-payroll',    label: 'Process Payroll',  icon: '▶️', route: '/payroll/process',      permission: 'PAYROLL_PROCESS'   },
    ],
  },

  // ── Workflow & Approvals ─────────────────────────────────────
  {
    id: 'workflow',
    label: 'Workflows',
    icon: '🔀',
    permission: 'WORKFLOW_VIEW',
    children: [
      { id: 'workflow-list',      label: 'All Workflows',    icon: '📋', route: '/workflows',            permission: 'WORKFLOW_VIEW'     },
      { id: 'workflow-approvals', label: 'My Approvals',     icon: '✅', route: '/workflows/approvals',  permission: 'WORKFLOW_APPROVE'  },
    ],
  },

  // ── Travel & Expenses ────────────────────────────────────────
  {
    id: 'travel',
    label: 'Travel',
    icon: '✈️',
    permission: 'TRAVEL_VIEW',
    children: [
      { id: 'travel-requests',    label: 'My Requests',      icon: '📤', route: '/travel',               permission: 'TRAVEL_APPLY'      },
      { id: 'travel-approvals',   label: 'Approvals',        icon: '✔️', route: '/travel/approvals',     permission: 'TRAVEL_APPROVE'    },
      { id: 'expense-claims',     label: 'Expense Claims',   icon: '🧾', route: '/expenses',             permission: 'EXPENSE_VIEW'      },
    ],
    dividerAfter: true,
  },

  // ── Admin ────────────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Administration',
    icon: '⚙️',
    roles: ['ADMIN', 'HR_MANAGER'],
    children: [
      { id: 'users',              label: 'Users',            icon: '👤', route: '/admin/users',          permission: 'USER_VIEW'         },
      { id: 'roles',              label: 'Roles',            icon: '🔑', route: '/admin/roles',          permission: 'ROLE_VIEW'         },
      { id: 'permissions',        label: 'Permissions',      icon: '🛡️', route: '/admin/permissions',    permission: 'PERMISSION_VIEW'   },
      { id: 'company',            label: 'Company Setup',    icon: '🏗️', route: '/admin/company',        permission: 'COMPANY_VIEW'      },
      { id: 'branches',           label: 'Branches',         icon: '🏢', route: '/admin/branches',       permission: 'BRANCH_VIEW'       },
      { id: 'policies',           label: 'Policies',         icon: '📜', route: '/admin/policies',       permission: 'POLICY_VIEW'       },
    ],
  },

  // ── Notifications ────────────────────────────────────────────
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    route: '/notifications',
  },

  // ── Profile ──────────────────────────────────────────────────
  {
    id: 'profile',
    label: 'My Profile',
    icon: '👤',
    route: '/profile',
  },
];
