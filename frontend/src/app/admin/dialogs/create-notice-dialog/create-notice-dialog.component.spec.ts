import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateNoticeDialogComponent } from './create-notice-dialog.component';

describe('CreateNoticeDialogComponent', () => {
  let component: CreateNoticeDialogComponent;
  let fixture: ComponentFixture<CreateNoticeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNoticeDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(CreateNoticeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
