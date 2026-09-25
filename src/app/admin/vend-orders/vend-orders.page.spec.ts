import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendOrdersPage } from './vend-orders.page';

describe('VendOrdersPage', () => {
  let component: VendOrdersPage;
  let fixture: ComponentFixture<VendOrdersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VendOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
