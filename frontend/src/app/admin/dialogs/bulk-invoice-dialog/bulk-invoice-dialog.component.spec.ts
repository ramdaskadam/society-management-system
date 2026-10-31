import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BulkInvoiceDialogComponent } from './bulk-invoice-dialog.component';

describe('BulkInvoiceDialogComponent', () => {
  let component: BulkInvoiceDialogComponent;
  let fixture: ComponentFixture<BulkInvoiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkInvoiceDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(BulkInvoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
