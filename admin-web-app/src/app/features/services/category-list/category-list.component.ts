import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceService } from '../../../core/services/service.service';
import { Category } from '../../../core/models/business.model';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p class="text-gray-600 mt-1">Manage categories to organize your services.</p>
        </div>
        <button (click)="openModal()" class="btn btn-primary">
          {{ 'COMMON.ADD_NEW' | translate }}
        </button>
      </div>

      <!-- List -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" class="divide-y divide-gray-200">
          <li *ngFor="let category of categories" class="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ category.name }}</h3>
              <p *ngIf="category.description" class="text-sm text-gray-500">{{ category.description }}</p>
            </div>
            <div class="flex gap-2">
              <button (click)="openModal(category)" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Edit</button>
              <button (click)="deleteCategory(category)" class="text-red-600 hover:text-red-900 font-medium text-sm">Delete</button>
            </div>
          </li>
          <li *ngIf="categories.length === 0" class="px-6 py-8 text-center text-gray-500">
            No categories found. Create one to get started.
          </li>
        </ul>
      </div>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 class="text-xl font-bold mb-4">{{ isEditMode ? 'Edit Category' : 'Add Category' }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" [(ngModel)]="currentCategory.name" class="input-field w-full" placeholder="e.g. Wash & Detail">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea [(ngModel)]="currentCategory.description" rows="3" class="input-field w-full"></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button (click)="closeModal()" class="btn btn-secondary">Cancel</button>
            <button (click)="saveCategory()" [disabled]="!currentCategory.name" class="btn btn-primary">
                {{ isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
    styles: [`
    .input-field { @apply rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2; }
    .btn { @apply px-4 py-2 rounded-md font-medium transition-colors; }
    .btn-primary { @apply bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50; }
    .btn-secondary { @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50; }
  `]
})
export class CategoryListComponent implements OnInit {
    categories: Category[] = [];
    showModal = false;
    isEditMode = false;
    currentCategory: Partial<Category> = { name: '', description: '' };
    editId?: number;

    constructor(private serviceService: ServiceService) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.serviceService.getCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => console.error('Error loading categories', err)
        });
    }

    openModal(category?: Category): void {
        if (category) {
            this.isEditMode = true;
            this.editId = category.id;
            this.currentCategory = { name: category.name, description: category.description };
        } else {
            this.isEditMode = false;
            this.editId = undefined;
            this.currentCategory = { name: '', description: '' };
        }
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.currentCategory = { name: '', description: '' };
    }

    saveCategory(): void {
        if (!this.currentCategory.name) return;

        if (this.isEditMode && this.editId) {
            this.serviceService.updateCategory(this.editId, this.currentCategory).subscribe({
                next: () => {
                    this.loadCategories();
                    this.closeModal();
                },
                error: (err) => console.error('Error updating category', err)
            });
        } else {
            this.serviceService.createCategory(this.currentCategory).subscribe({
                next: () => {
                    this.loadCategories();
                    this.closeModal();
                },
                error: (err) => console.error('Error creating category', err)
            });
        }
    }

    deleteCategory(category: Category): void {
        if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            this.serviceService.deleteCategory(category.id).subscribe({
                next: () => this.loadCategories(),
                error: (err) => console.error('Error deleting category', err)
            });
        }
    }
}
