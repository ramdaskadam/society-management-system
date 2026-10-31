import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartCollectionComponent } from './chart-collection.component';

describe('ChartCollectionComponent', () => {
  let component: ChartCollectionComponent;
  let fixture: ComponentFixture<ChartCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartCollectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
