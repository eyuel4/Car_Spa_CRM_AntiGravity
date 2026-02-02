import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Job } from '../../../core/models/operations.model';

@Component({
    selector: 'app-invoice-generator',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        
        <!-- Toolbar -->
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-bold">Invoice Preview</h2>
          <div class="flex gap-2">
            <button (click)="print()" class="btn btn-primary flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print / PDF
            </button>
            <button (click)="close.emit()" class="btn btn-secondary">Close</button>
          </div>
        </div>

        <!-- Invoice Content (Printable Area) -->
        <div class="flex-grow overflow-y-auto p-8 bg-gray-100" id="print-area">
            <div class="bg-white shadow-lg p-10 max-w-3xl mx-auto min-h-[1000px]">
                
                <!-- Invoice Header -->
                <div class="flex justify-between items-start mb-10">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-800">INVOICE</h1>
                         <p class="text-gray-500 mt-2">#INV-{{ job.id }}</p>
                         <p class="text-gray-500">Date: {{ job.created_at | date:'mediumDate' }}</p>
                    </div>
                    <div class="text-right">
                        <h3 class="text-xl font-bold text-blue-600">CAR SPA CRM</h3>
                        <p class="text-sm text-gray-600">123 Car Wash Lane</p>
                        <p class="text-sm text-gray-600">Nairobi, Kenya</p>
                        <p class="text-sm text-gray-600">info@carspa.com</p>
                    </div>
                </div>

                <!-- Bill To -->
                <div class="mb-10 border-b pb-6">
                    <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Bill To:</h4>
                    <p class="font-bold text-lg">{{ job.customer.first_name }} {{ job.customer.last_name }}</p>
                    <p class="text-gray-600">{{ job.customer.email }}</p>
                    <p class="text-gray-600">{{ job.customer.phone_number }}</p>
                    <div class="mt-4">
                        <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Vehicle:</h4>
                        <p class="text-gray-800">{{ job.car.plate_number }} - {{ job.car.make }} {{ job.car.model }}</p>
                    </div>
                </div>

                <!-- Items -->
                <table class="w-full mb-10">
                    <thead>
                        <tr class="border-b-2 border-gray-300">
                            <th class="text-left py-3 text-sm font-bold text-gray-600 uppercase">Description</th>
                            <th class="text-right py-3 text-sm font-bold text-gray-600 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-700">
                        <tr *ngFor="let item of job.items" class="border-b border-gray-100">
                            <td class="py-4">
                                <p class="font-bold">{{ item.service.name }}</p>
                                <p class="text-sm text-gray-500">{{ item.service.description }}</p>
                            </td>
                            <td class="py-4 text-right font-medium">\${{ item.price }}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Totals -->
                <div class="flex justify-end">
                    <div class="w-1/2">
                        <div class="flex justify-between py-2 border-b">
                            <span class="font-bold text-gray-600">Subtotal</span>
                            <span class="font-bold text-gray-900">\${{ calculateTotal() }}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b">
                            <span class="font-bold text-gray-600">Tax (0%)</span>
                            <span class="font-bold text-gray-900">$0.00</span>
                        </div>
                        <div class="flex justify-between py-4">
                            <span class="font-bold text-xl text-gray-800">Total</span>
                            <span class="font-bold text-xl text-blue-600">\${{ calculateTotal() }}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-20 pt-8 border-t text-center text-gray-500 text-sm">
                    <p>Thank you for your business!</p>
                    <p class="mt-1">For questions about this invoice, please contact us.</p>
                </div>

            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @media print {
        .fixed { position: static; background: white; padding: 0; }
        .shadow-xl, .shadow-lg { box-shadow: none; }
        .btn, .border-b, .bg-gray-100 { display: none !important; }
        #print-area { padding: 0; height: auto; overflow: visible; }
        .bg-white { width: 100%; max-width: none; border: none; }
    }
  `]
})
export class InvoiceGeneratorComponent {
    @Input() job!: Job;
    @Output() close = new EventEmitter<void>();

    calculateTotal(): number {
        return this.job.items?.reduce((sum, item) => sum + parseFloat(item.price), 0) || 0;
    }

    print() {
        const printContent = document.getElementById('print-area');
        const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
        if (WindowPrt && printContent) {
            WindowPrt.document.write(`
                <html>
                    <head>
                        <title>Invoice #${this.job.id}</title>
                        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    </head>
                    <body onload="window.print(); window.close()">
                        ${printContent.innerHTML}
                    </body>
                </html>
            `);
            WindowPrt.document.close();
            WindowPrt.focus();
        }
    }
}
