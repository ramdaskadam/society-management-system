import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartComplaintsComponent } from './chart-complaints.component';

describe('ChartComplaintsComponent', () => {
  let component: ChartComplaintsComponent;
  let fixture: ComponentFixture<ChartComplaintsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComplaintsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartComplaintsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
