import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './confirmation-modal.component.html',
    styleUrl: './confirmation-modal.component.css',
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'scale(0.9)', opacity: 0 }),
                animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 }))
            ])
        ])
    ]
})
export class ConfirmationModalComponent {
    @Input() isOpen: boolean = false;
    @Input() title: string = '';
    @Input() message: string = '';
    @Input() confirmText: string = 'COMMON.CONFIRM';
    @Input() cancelText: string = 'COMMON.CANCEL';
    @Input() confirmClass: string = 'btn-danger'; // 'btn-danger' or 'btn-primary'
    @Input() icon: 'warning' | 'info' | 'danger' = 'warning';

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        // Only close if clicking the backdrop itself, not its children
        if (event.target === event.currentTarget) {
            this.onCancel();
        }
    }

    getIconPath(): string {
        switch (this.icon) {
            case 'warning':
                return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            case 'danger':
                return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'info':
                return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            default:
                return '';
        }
    }

    getIconClass(): string {
        switch (this.icon) {
            case 'warning':
                return 'text-yellow-600 bg-yellow-100';
            case 'danger':
                return 'text-red-600 bg-red-100';
            case 'info':
                return 'text-blue-600 bg-blue-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    }
}
