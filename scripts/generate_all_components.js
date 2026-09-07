// scripts/generate_all_components.js
const fs = require('fs');
const path = require('path');

// Project root (assumed current working directory when script runs)
const projectRoot = path.resolve(__dirname, '..');
const featuresDir = path.join(projectRoot, 'src', 'app', 'features');

// Template snippets
const glassStyle = `
  :host { display: block; padding: 1rem; font-family: 'Inter', sans-serif; }
  .card { background: rgba(255,255,255,0.12); backdrop-filter: blur(10px); border-radius: 12px; padding: 1.5rem; color: #fff; }
`;

function pascalCase(str) {
  return str.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Component';
}

function listTemplate(name) {
  return `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-${name}',
  standalone: true,
  imports: [CommonModule],
  template: \`<div class="card">
    <h2 class="text-xl mb-2 capitalize">${name.replace('-', ' ')} List</h2>
    <table class="w-full text-sm">
      <thead><tr><th *ngFor="let col of columns">{{col}}</th><th>Actions</th></tr></thead>
      <tbody>
        <tr *ngFor="let item of items">
          <td *ngFor="let col of columns">{{item[col]}}</td>
          <td>
            <button (click)="edit(item)" class="mr-2">Edit</button>
            <button (click)="remove(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>\`,
  styles: [\`
    ${glassStyle}
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    button { background: #891EA2; color: #fff; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; }
  \`]
})
export class ${pascalCase(name)} {
  columns = ['id', 'name']; // adjust per entity
  items: any[] = [];
  constructor(private api: ApiService) { this.load(); }
  load() { this.api.post('/v1/${name}/list', {}).subscribe(res => this.items = res?.data || []); }
  edit(item: any) { /* navigate to form */ }
  remove(item: any) { this.api.post('/v1/${name}/delete', { id: item.id }).subscribe(() => this.load()); }
}
`;
}

function formTemplate(name) {
  return `
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-${name}',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`<div class="card">
    <h2 class="text-xl mb-2 capitalize">${name.replace('-', ' ')} Form</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div *ngFor="let ctrl of fieldKeys" class="mb-2">
        <label class="block mb-1" [for]="ctrl">{{ctrl}}</label>
        <input [formControlName]="ctrl" [id]="ctrl" class="w-full p-2 rounded" />
      </div>
      <button type="submit" class="bg-[#891EA2] text-white p-2 rounded">Save</button>
    </form>
  </div>\`,
  styles: [\`
    ${glassStyle}
    input { background: rgba(255,255,255,0.08); border: none; color: #fff; }
  \`]
})
export class ${pascalCase(name)} {
  form = this.fb.group({});
  fieldKeys: string[] = [];
  constructor(private fb: FormBuilder, private api: ApiService) { this.init(); }
  init() {
    const fields = ['name']; // placeholder – extend per entity
    fields.forEach(f => this.form.addControl(f, this.fb.control('', Validators.required)));
    this.fieldKeys = fields;
  }
  save() {
    if (this.form.invalid) return;
    this.api.post('/v1/${name}/create', this.form.value).subscribe(() => alert('Saved'));
  }
}
`;
}

function processComponent(filePath) {
  const parts = filePath.split(path.sep);
  const name = parts[parts.length - 2]; // folder name before file
  let newContent;
  if (name.includes('list') || name.includes('approval') || name.includes('view')) {
    newContent = listTemplate(name);
  } else if (name.includes('form') || name.includes('create') || name.includes('edit')) {
    newContent = formTemplate(name);
  } else {
    newContent = listTemplate(name);
  }
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Updated ${filePath}`);
}

function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.component.ts')) {
      processComponent(fullPath);
    }
  });
}

walk(featuresDir);
console.log('All components regenerated with premium UI.');
