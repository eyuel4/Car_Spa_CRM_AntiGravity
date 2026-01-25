import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltyAdjustmentDialogComponent } from './loyalty-adjustment-dialog.component';

describe('LoyaltyAdjustmentDialogComponent', () => {
  let component: LoyaltyAdjustmentDialogComponent;
  let fixture: ComponentFixture<LoyaltyAdjustmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltyAdjustmentDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoyaltyAdjustmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
