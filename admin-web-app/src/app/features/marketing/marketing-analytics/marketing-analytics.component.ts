import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketingService, MarketingAnalytics } from '../../../core/services/marketing.service';

@Component({
    selector: 'app-marketing-analytics',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './marketing-analytics.component.html'
})
export class MarketingAnalyticsComponent implements OnInit {
    analytics: MarketingAnalytics | null = null;
    isLoading = false;

    constructor(private marketingService: MarketingService) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.marketingService.getAnalytics().subscribe({
            next: (data) => {
                this.analytics = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching analytics', err);
                this.isLoading = false;
            }
        });
    }
}
