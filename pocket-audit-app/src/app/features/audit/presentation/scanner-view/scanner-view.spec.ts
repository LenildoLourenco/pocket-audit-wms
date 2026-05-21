import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerView } from './scanner-view';

describe('ScannerView', () => {
  let component: ScannerView;
  let fixture: ComponentFixture<ScannerView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerView],
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
