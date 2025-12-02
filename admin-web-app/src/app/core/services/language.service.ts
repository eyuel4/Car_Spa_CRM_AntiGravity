import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { TenantService } from './tenant.service';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private currentLangSubject = new BehaviorSubject<string>('en');
    public currentLang$ = this.currentLangSubject.asObservable();

    constructor(
        private translate: TranslateService,
        private authService: AuthService,
        private tenantService: TenantService
    ) {
        this.initLanguage();
    }

    private initLanguage(): void {
        this.translate.addLangs(['en', 'es', 'am']);
        this.translate.setDefaultLang('en');

        // Load from tenant configuration
        const user = this.authService.getCurrentUser();
        const tenantLanguage = user?.tenant?.language || 'en';

        this.translate.use(tenantLanguage);
        this.currentLangSubject.next(tenantLanguage);
    }

    setLanguage(lang: string): void {
        const user = this.authService.getCurrentUser();

        if (!user || user.role !== 'OWNER') {
            console.error('Only tenant owners can change language settings');
            return;
        }

        const tenantId = user.tenant?.id;
        if (!tenantId) {
            console.error('No tenant ID found');
            return;
        }

        // Update UI immediately for better UX
        this.translate.use(lang);
        this.currentLangSubject.next(lang);

        // Save to backend
        this.tenantService.updateTenantLanguage(tenantId, lang).subscribe({
            next: () => {
                console.log('Tenant language updated successfully');
                // Update local user object
                if (user.tenant) {
                    user.tenant.language = lang;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            },
            error: (error) => {
                console.error('Failed to update tenant language:', error);
                // Revert to previous language on error
                const previousLang = user.tenant?.language || 'en';
                this.translate.use(previousLang);
                this.currentLangSubject.next(previousLang);
            }
        });
    }

    getCurrentLang(): string {
        return this.currentLangSubject.value;
    }

    canChangeLanguage(): boolean {
        const user = this.authService.getCurrentUser();
        console.log('LanguageService: Checking permission for user:', user);
        const isOwner = user?.role === 'OWNER';
        console.log('LanguageService: Is Owner?', isOwner);
        return isOwner;
    }
}
