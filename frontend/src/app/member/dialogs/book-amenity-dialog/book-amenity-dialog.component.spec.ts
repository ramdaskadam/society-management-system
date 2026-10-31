import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookAmenityDialogComponent } from './book-amenity-dialog.component';

describe('BookAmenityDialogComponent', () => {
  let component: BookAmenityDialogComponent;
  let fixture: ComponentFixture<BookAmenityDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookAmenityDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(BookAmenityDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
