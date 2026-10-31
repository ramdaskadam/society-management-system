import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AmenitiesViewComponent } from './amenities-view.component';

describe('AmenitiesViewComponent', () => {
  let component: AmenitiesViewComponent;
  let fixture: ComponentFixture<AmenitiesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmenitiesViewComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AmenitiesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
