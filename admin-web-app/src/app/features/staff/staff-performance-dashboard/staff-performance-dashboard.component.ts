import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../core/services/staff.service';
import { OperationsService } from '../../../core/services/operations.service';
import { Staff } from '../../../core/models/business.model';
import { JobTask } from '../../../core/models/operations.model';

interface StaffRanking {
    staff: Staff;
    rank: number;
    tasksCompleted: number;
    totalHours: number;
    avgDuration: number;
    score: number; // custom score for sorting
}

@Component({
    selector: 'app-staff-performance-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './staff-performance-dashboard.component.html',
    styles: [`
    .gold { background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); color: white; }
    .silver { background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%); color: white; }
    .bronze { background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%); color: white; }
  `]
})
export class StaffPerformanceDashboardComponent implements OnInit {
    rankings: StaffRanking[] = [];
    isLoading = false;

    selectedMonth: number = new Date().getMonth();
    selectedYear: number = new Date().getFullYear();

    months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ];

    years = [2024, 2025, 2026, 2027];

    constructor(
        private staffService: StaffService,
        private operationsService: OperationsService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.isLoading = true;

        // ForkJoin would be better, but simple nested subs work for MVP
        this.staffService.getAll().subscribe({
            next: (staffList) => {
                // Fetch tasks
                // In a real app, we'd pass start_date and end_date to backend
                // For MVP with small data, fetching all done tasks and filtering is "okay"
                this.operationsService.getAllTasks({ status: 'DONE' }).subscribe({
                    next: (tasks) => {
                        this.calculateRankings(staffList, tasks);
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Error fetching tasks', err);
                        this.isLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error fetching staff', err);
                this.isLoading = false;
            }
        });
    }

    calculateRankings(staffList: Staff[], allTasks: JobTask[]): void {
        // Filter tasks for selected month/year
        const periodTasks = allTasks.filter(task => {
            const date = new Date(task.end_time || '');
            return date.getMonth() === Number(this.selectedMonth) &&
                date.getFullYear() === Number(this.selectedYear);
        });

        const rankings: StaffRanking[] = [];

        staffList.forEach(staff => {
            if (!staff.is_active) return; // Skip inactive staff? Maybe keep if they worked this month.

            const staffTasks = periodTasks.filter(t => (t.staff && t.staff.id === staff.id) || t.staff_id === staff.id);
            const count = staffTasks.length;

            let totalHours = 0;
            staffTasks.forEach(t => {
                // Assuming duration_hours exists or calculating from start/end
                if (t.end_time && t.start_time) {
                    const end = new Date(t.end_time).getTime();
                    const start = new Date(t.start_time).getTime();
                    totalHours += (end - start) / (1000 * 60 * 60);
                }
            });

            const avgDuration = count > 0 ? totalHours / count : 0;

            // Simple score: Tasks * 10. Could be more complex.
            const score = count * 10;

            rankings.push({
                staff,
                rank: 0, // set later
                tasksCompleted: count,
                totalHours: parseFloat(totalHours.toFixed(1)),
                avgDuration: parseFloat(avgDuration.toFixed(1)),
                score
            });
        });

        // Sort by Score Descending
        rankings.sort((a, b) => b.score - a.score);

        // Assign Ranks
        rankings.forEach((r, index) => r.rank = index + 1);

        this.rankings = rankings;
    }

    onFilterChange(): void {
        this.loadData();
    }

    getInitials(staff: Staff): string {
        return (staff.first_name?.[0] || '') + (staff.last_name?.[0] || '');
    }

    getRankClass(rank: number): string {
        if (rank === 1) return 'gold shadow-lg transform scale-105';
        if (rank === 2) return 'silver shadow-md';
        if (rank === 3) return 'bronze shadow-md';
        return 'bg-white border border-gray-200';
    }
}
