import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleBannerComponent } from './role-banner.component';

describe('RoleBannerComponent', () => {
  let component: RoleBannerComponent;
  let fixture: ComponentFixture<RoleBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleBannerComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(RoleBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
