import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Job, CreateJobRequest, JobStatus, JobTask } from '../models/operations.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OperationsService {
    private apiUrl = `${environment.apiUrl}/jobs`;

    constructor(private http: HttpClient) { }

    getJobs(filters?: any): Observable<Job[]> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                    params = params.set(key, filters[key]);
                }
            });
        }

        return this.http.get<{ results: Job[] }>(this.apiUrl + '/', { params }).pipe(
            map(response => response.results || [])
        );
    }

    getJob(id: number): Observable<Job> {
        return this.http.get<Job>(`${this.apiUrl}/${id}/`);
    }

    createJob(job: CreateJobRequest): Observable<Job> {
        return this.http.post<Job>(this.apiUrl, job);
    }

    updateJobStatus(id: number, status: string): Observable<Job> {
        return this.http.patch<Job>(`${this.apiUrl}/${id}/`, { status });
    }

    completeJob(id: number, paymentData: { status: 'COMPLETED', payment_method: string, transaction_reference?: string }): Observable<Job> {
        return this.http.patch<Job>(`${this.apiUrl}/${id}/`, paymentData);
    }

    // Items
    addItemToJob(jobId: number, serviceId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}${jobId}/add_item/`, { service_id: serviceId });
    }

    // Tasks
    getJobTasks(jobId: number): Observable<JobTask[]> {
        return this.http.get<JobTask[]>(`${this.apiUrl}${jobId}/tasks/`);
    }

    getAllTasks(filters?: any): Observable<JobTask[]> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        // Note: Check backend URL for general tasks list. Assuming '/api/v1/tasks/' 
        // Based on other endpoints, it might be separate. 
        // Looking at views.py: JobTaskViewSet is likely at /tasks/.
        return this.http.get<{ results: JobTask[] }>(`${environment.apiUrl}/tasks/`, { params }).pipe(
            map(response => response.results || [])
        );
    }

    createTask(task: Partial<JobTask>): Observable<JobTask> {
        return this.http.post<JobTask>(`${environment.apiUrl}/tasks/`, task);
    }

    startTask(taskId: number): Observable<JobTask> {
        return this.http.post<JobTask>(`${environment.apiUrl}/tasks/${taskId}/start/`, {});
    }

    completeTask(taskId: number): Observable<JobTask> {
        return this.http.post<JobTask>(`${environment.apiUrl}/tasks/${taskId}/complete/`, {});
    }

    // Helper for mock logic or if backend supports assigning staff directly to a task
    assignStaffToTask(taskId: number, staffId: number): Observable<any> {
        // Assuming a separate endpoint or nested endpoint for tasks
        return this.http.patch(`${environment.apiUrl}/job-tasks/${taskId}/`, { staff: staffId });
    }
}
