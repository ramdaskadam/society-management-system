import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitsViewComponent } from './units-view.component';

describe('UnitsViewComponent', () => {
  let component: UnitsViewComponent;
  let fixture: ComponentFixture<UnitsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitsViewComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(UnitsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
