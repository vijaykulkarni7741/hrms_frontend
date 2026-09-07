const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'app');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Fix ApiService imports
      if (content.includes("from '../../core/services/api.service'") ||
          content.includes("from '../../../core/services/api.service'") ||
          content.includes("from './core/services/api.service'") ||
          content.includes("from '../core/services/api.service'")) {
        content = content.replace(/from\s+['"].*?\/services\/api\.service['"]/g, "from 'src/app/services/api.service'");
        modified = true;
      }

      // Fix AuthStateService imports
      if (content.includes("from '../../../core/state/auth-state.service'") ||
          content.includes("from '../../core/state/auth-state.service'") ||
          content.includes("from '../core/state/auth-state.service'")) {
        content = content.replace(/from\s+['"].*?\/state\/auth-state\.service['"]/g, "from 'src/app/core/state/auth-state.service'");
        modified = true;
      }

      // Fix ToastService imports
      if (content.includes("from '../../../core/services/toast.service'") ||
          content.includes("from '../../core/services/toast.service'")) {
        content = content.replace(/from\s+['"].*?\/services\/toast\.service['"]/g, "from 'src/app/core/services/toast.service'");
        modified = true;
      }

      // Fix ToastComponent imports
      if (content.includes("from '../../../shared/toast/toast.component'") ||
          content.includes("from '../../shared/toast/toast.component'")) {
        content = content.replace(/from\s+['"].*?\/shared\/toast\/toast\.component['"]/g, "from 'src/app/shared/toast/toast.component'");
        modified = true;
      }

      // Fix subscribe callbacks without types
      content = content.replace(/\.subscribe\(\s*([a-zA-Z0-9_]+)\s*=>/g, '.subscribe(($1: any) =>');
      content = content.replace(/next:\s*([a-zA-Z0-9_]+)\s*=>/g, 'next: ($1: any) =>');
      content = content.replace(/error:\s*([a-zA-Z0-9_]+)\s*=>/g, 'error: ($1: any) =>');

      if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated imports in:', path.relative(root, fullPath));
      }
    }
  }
}

walk(root);
console.log('Import paths clean-up finished.');
