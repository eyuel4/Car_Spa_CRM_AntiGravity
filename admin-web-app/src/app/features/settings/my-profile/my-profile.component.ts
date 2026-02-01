import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './my-profile.component.html'
})
export class MyProfileComponent implements OnInit {
    profileForm: FormGroup;
    isLoading = false;
    isSaving = false;
    user: any = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private http: HttpClient
    ) {
        this.profileForm = this.fb.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            phone_number: [''],
            // email is generally read-only in many systems, but editable here if supported
            email: [{ value: '', disabled: true }]
        });
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.user = user;
                this.profileForm.patchValue({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone_number: user.phone_number,
                    email: user.email
                });
            }
            this.isLoading = false;
        });
    }

    onSubmit(): void {
        if (this.profileForm.invalid) return;

        this.isSaving = true;
        const payload = this.profileForm.value;

        this.http.patch(`${environment.apiUrl}/users/me/`, payload).subscribe({
            next: (updatedUser) => {
                // Optimistically update local user state or re-fetch
                // For MVP, simplistic alert
                this.isSaving = false;
                alert('Profile updated successfully');
            },
            error: (err) => {
                console.error('Error updating profile', err);
                this.isSaving = false;
                alert('Failed to update profile');
            }
        });
    }
}
