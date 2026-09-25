import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdmOrdersPage } from './adm-orders.page';

describe('AdmOrdersPage', () => {
  let component: AdmOrdersPage;
  let fixture: ComponentFixture<AdmOrdersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdmOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
