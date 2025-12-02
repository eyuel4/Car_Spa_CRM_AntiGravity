import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { RoleNotificationPreference } from '../../../core/models/role-notification-preference.model';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { forkJoin } from 'rxjs';

type PreferenceKey = keyof Omit<RoleNotificationPreference, 'id' | 'role'>;

interface SchemaItem {
    key: PreferenceKey;
    label: string;
}

interface SchemaCategory {
    category: string;
    items: SchemaItem[];
}

@Component({
    selector: 'app-notification-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        TranslateModule,
        ConfirmationModalComponent
    ],
    templateUrl: './notification-settings.component.html',
    styleUrl: './notification-settings.component.css'
})
export class NotificationSettingsComponent implements OnInit {
    preferences: RoleNotificationPreference[] = [];
    originalPreferences: RoleNotificationPreference[] = []; // Deep copy for comparison/revert
    schema: SchemaCategory[] = [];
    loading = true;
    saving = false;
    showSaveConfirmation = false;
    showCancelConfirmation = false;
    selectedTabIndex = 0; // Track selected tab
    errorMessage: string | null = null;

    constructor(
        private notificationService: NotificationDataService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.errorMessage = null;
        
        forkJoin({
            preferences: this.notificationService.getRolePreferences(),
            config: this.notificationService.getNotificationConfiguration()
        }).subscribe({
            next: (data) => {
                console.log('Loaded data:', data);
                this.preferences = data.preferences || [];
                this.schema = data.config || [];
                this.originalPreferences = JSON.parse(JSON.stringify(this.preferences));
                this.loading = false;

                // If no preferences found, try to initialize defaults
                if (this.preferences.length === 0) {
                    this.initializeDefaults();
                }
            },
            error: (err) => {
                console.error('Error loading settings:', err);
                this.loading = false;
                this.errorMessage = err.error?.detail || err.message || 'Error loading notification settings';
                this.showError(this.errorMessage || 'Error loading notification settings');
                
                // Try to load config even if preferences fail
                this.notificationService.getNotificationConfiguration().subscribe({
                    next: (config) => {
                        this.schema = config || [];
                    },
                    error: (configErr) => {
                        console.error('Error loading configuration:', configErr);
                    }
                });
            }
        });
    }

    initializeDefaults(): void {
        this.loading = true;
        this.notificationService.initializeDefaultPreferences().subscribe({
            next: (response) => {
                console.log('Initialized defaults:', response);
                this.preferences = response.preferences || [];
                this.originalPreferences = JSON.parse(JSON.stringify(this.preferences));
                this.loading = false;
                this.showSuccess('Initialized default settings');
            },
            error: (err) => {
                console.error('Error initializing defaults:', err);
                this.loading = false;
                this.showError('Could not initialize default settings: ' + (err.error?.detail || err.message));
            }
        });
    }

    onSave(): void {
        if (!this.hasUnsavedChanges) return;
        // Show confirmation modal asking if user wants to save
        this.showSaveConfirmation = true;
    }

    confirmSave(): void {
        this.showSaveConfirmation = false;
        this.saving = true;

        // Find modified preferences
        const updates = this.preferences.filter((pref, index) => {
            return JSON.stringify(pref) !== JSON.stringify(this.originalPreferences[index]);
        });

        if (updates.length === 0) {
            this.saving = false;
            return;
        }

        // Update each modified preference
        const updateObservables = updates.map(pref =>
            this.notificationService.updateRolePreference(pref.id!, pref)
        );

        forkJoin(updateObservables).subscribe({
            next: (updatedPrefs) => {
                // Update original preferences to match new state
                this.originalPreferences = JSON.parse(JSON.stringify(this.preferences));
                this.saving = false;
                this.showSuccess('Settings saved successfully');
            },
            error: (err) => {
                console.error('Error saving settings:', err);
                this.saving = false;
                this.showError('Error saving settings');
            }
        });
    }

    discardChanges(): void {
        // User chose "Don't Save" - just close the modal
        this.showSaveConfirmation = false;
    }

    onCancel(): void {
        if (!this.hasUnsavedChanges) return;
        // Show confirmation modal asking if user wants to discard changes
        this.showCancelConfirmation = true;
    }

    confirmCancel(): void {
        this.showCancelConfirmation = false;
        // Revert changes
        this.preferences = JSON.parse(JSON.stringify(this.originalPreferences));
        this.showSuccess('Changes discarded');
    }

    get hasUnsavedChanges(): boolean {
        return JSON.stringify(this.preferences) !== JSON.stringify(this.originalPreferences);
    }

    getRoleLabel(role: string): string {
        switch (role) {
            case 'OWNER': return 'Owner';
            case 'MANAGER': return 'Manager';
            case 'STAFF': return 'Staff';
            default: return role;
        }
    }

    getPreferenceValue(pref: RoleNotificationPreference, key: string): boolean {
        const preferenceKey = key as PreferenceKey;
        return pref[preferenceKey] ?? false;
    }

    setPreferenceValue(pref: RoleNotificationPreference, key: string, value: boolean): void {
        const preferenceKey = key as PreferenceKey;
        pref[preferenceKey] = value;
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }
}
