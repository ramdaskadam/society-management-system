import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptDialogComponent } from './receipt-dialog.component';

describe('ReceiptDialogComponent', () => {
  let component: ReceiptDialogComponent;
  let fixture: ComponentFixture<ReceiptDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ReceiptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
