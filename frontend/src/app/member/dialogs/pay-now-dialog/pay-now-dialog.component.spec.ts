import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayNowDialogComponent } from './pay-now-dialog.component';

describe('PayNowDialogComponent', () => {
  let component: PayNowDialogComponent;
  let fixture: ComponentFixture<PayNowDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayNowDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(PayNowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
