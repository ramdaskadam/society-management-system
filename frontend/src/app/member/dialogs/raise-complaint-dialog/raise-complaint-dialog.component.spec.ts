import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RaiseComplaintDialogComponent } from './raise-complaint-dialog.component';

describe('RaiseComplaintDialogComponent', () => {
  let component: RaiseComplaintDialogComponent;
  let fixture: ComponentFixture<RaiseComplaintDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaiseComplaintDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(RaiseComplaintDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
