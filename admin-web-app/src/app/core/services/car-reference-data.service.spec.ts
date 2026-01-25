import { TestBed } from '@angular/core/testing';

import { CarReferenceDataService } from './car-reference-data.service';

describe('CarReferenceDataService', () => {
  let service: CarReferenceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarReferenceDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
