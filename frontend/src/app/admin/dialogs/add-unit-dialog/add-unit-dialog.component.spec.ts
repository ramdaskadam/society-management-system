import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUnitDialogComponent } from './add-unit-dialog.component';

describe('AddUnitDialogComponent', () => {
  let component: AddUnitDialogComponent;
  let fixture: ComponentFixture<AddUnitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUnitDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AddUnitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
