import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CustomersRoutingModule } from './customers-routing.module';
import { CUSTOMERS_ROUTES } from './customers.routes';

// Components
import { CustomerSearchComponent } from './customer-search/customer-search.component';
// Note: CustomerOnboardingComponent, CorporateOnboardingComponent, and LoyaltyAdjustmentDialogComponent
// are standalone components and should not be declared here - they are loaded directly via routes

@NgModule({
  declarations: [
    CustomerSearchComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(CUSTOMERS_ROUTES),
    CustomersRoutingModule
  ],
  exports: [
    CustomerSearchComponent
  ]
})
export class CustomersModule { }
