import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service.ts.service';
import { OrderService } from '../../services/order.service.ts.service';
import { debounceTime, map, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  orderForm: FormGroup;
  products: Product[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  isSubmitDisabled: boolean = true;
  totalQuantity: number = 0;
  maxProducts = 10;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService,
    private orderService: OrderService
  ) {
    this.orderForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email], [this.emailValidator.bind(this)]],
      products: this.fb.array([], [Validators.required, this.validateUniqueProducts]),
      total: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.orderForm.get('products')?.valueChanges.subscribe(() => {
      this.calculateTotal();
      this.calculateTotalQuantity();
      this.checkSubmitButtonState();
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: products => (this.products = products),
      error: () => (this.errorMessage = 'Error al cargar los productos')
    });
  }

  get productsFormArray(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  get isAddProductDisabled(): boolean {
    return this.productsFormArray.length >= this.maxProducts;
  }

  addProduct(): void {
    const productForm = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, this.validateProductQuantity]],
      price: [{ value: 0, disabled: true }],
      stock: [{ value: 0, disabled: true }]
    });
    this.productsFormArray.push(productForm);
  }

  removeProduct(index: number): void {
    this.productsFormArray.removeAt(index);
    this.checkSubmitButtonState();
  }

  validateProductQuantity(control: FormControl): { [key: string]: any } | null {
    const quantity = control.value;
    return quantity > 0 && quantity <= 10 ? null : { invalidQuantity: true };
  }

  validateUniqueProducts(control: FormArray): { [key: string]: any } | null {
    const productIds = control.controls.map(c => c.value.productId);
    const hasDuplicates = productIds.some((id, idx) => productIds.indexOf(id) !== idx);
    return hasDuplicates ? { duplicate: true } : null;
  }

  emailValidator(control: FormControl) {
    return control.valueChanges.pipe(
      debounceTime(500),
      switchMap(email => this.orderService.validateOrderLimit(email)),
      map(response => (response.isValid ? null : { limitExceeded: true }))
    );
  }

  onProductChange(index: number): void {
    const productId = this.productsFormArray.at(index).get('productId')?.value;
    const selectedProduct = this.products.find(p => p.id === productId);

    if (selectedProduct) {
      this.productsFormArray.at(index).patchValue({
        price: selectedProduct.price,
        stock: selectedProduct.stock
      });
    }
    this.checkSubmitButtonState();
  }

  calculateTotal(): void {
    const total = this.productsFormArray.controls.reduce((sum, control) => {
      return sum + (control.get('price')?.value * control.get('quantity')?.value);
    }, 0);

    this.orderForm.patchValue({
      total: total > 1000 ? total * 0.9 : total
    });
  }

  calculateTotalQuantity(): void {
    this.totalQuantity = this.productsFormArray.controls.reduce((sum, control) => {
      return sum + (control.get('quantity')?.value || 0);
    }, 0);
  }

  checkSubmitButtonState(): void {
    const customerName = this.orderForm.get('customerName');
    const email = this.orderForm.get('email');
    const productsArray = this.productsFormArray;

    const isCustomerNameInvalid = customerName?.invalid;
    const isEmailInvalid = email?.invalid;

    const totalQuantity = productsArray.controls.reduce((total, control) => {
      return total + (control.get('quantity')?.value || 0);
    }, 0);
    const isTotalQuantityExceeded = totalQuantity > 10;

    const hasUnselectedProducts = productsArray.controls.some(control => !control.get('productId')?.value);
    const productIds = productsArray.controls.map(control => control.get('productId')?.value);
    const hasDuplicateProducts = new Set(productIds).size !== productIds.length;
    const exceedsMaxQuantity = this.totalQuantity > this.maxProducts;

    const noProductsSelected = productsArray.length === 0;
    this.isSubmitDisabled = isCustomerNameInvalid || isEmailInvalid || hasUnselectedProducts || hasDuplicateProducts || noProductsSelected || isTotalQuantityExceeded || this.totalQuantity > 10 || exceedsMaxQuantity;;
  }


  generateOrderCode(name: string, email: string): string {
    const initial = name.charAt(0).toUpperCase();
    const lastFourEmail = email.slice(-4);
    const timestamp = new Date().getTime().toString().slice(-4);
    return `${initial}${lastFourEmail}${timestamp}`;
  }

  submitOrder(): void {
    if (this.orderForm.invalid) return;

    const orderData: Order = {
      ...this.orderForm.getRawValue(),
      orderCode: this.generateOrderCode(
        this.orderForm.get('customerName')?.value,
        this.orderForm.get('email')?.value
      ),
      timestamp: new Date().toISOString()
    };

    this.loading = true;
    this.orderService.createOrder(orderData).subscribe({
      next: () => {
        this.resetForm();
        this.loading = false;
        alert('Pedido cargado exitosamente');
        this.router.navigate(['/order-list']);
        this.resetForm();
      },
      error: () => {
        this.errorMessage = 'Error al crear el pedido';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.orderForm.reset();
    this.productsFormArray.clear();
    this.addProduct();
  }

  isProductsSelected(): boolean {
    return this.productsFormArray.controls.every(control => control.get('productId')?.value);
  }

}