import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoticesViewComponent } from './notices-view.component';

describe('NoticesViewComponent', () => {
  let component: NoticesViewComponent;
  let fixture: ComponentFixture<NoticesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoticesViewComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(NoticesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
