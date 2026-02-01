import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-tenant-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tenant-profile.component.html'
})
export class TenantProfileComponent implements OnInit {
    tenant: any = null;
    isLoading = false;
    showRequestModal = false;

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.authService.currentUser$.subscribe(user => {
            if (user && user.tenant) {
                // In a real app we might fetch fresh tenant data from a specific endpoint
                // For MVP, using the user's tenant object is sufficient
                this.tenant = user.tenant;
            }
            this.isLoading = false;
        });
    }

    onRequestChange(): void {
        this.showRequestModal = true;
    }

    closeModal(): void {
        this.showRequestModal = false;
    }

    submitRequest(): void {
        // In a real app, this would call an API endpoint to send an email/create a ticket
        alert('Request sent! Support will review your changes within 24 hours.');
        this.showRequestModal = false;
    }
}
