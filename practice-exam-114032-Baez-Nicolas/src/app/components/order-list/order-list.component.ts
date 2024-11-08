import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service.ts.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  filterText: string = '';
  searchTerm: string = '';

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loadOrders();
    this.orderService.getOrders().subscribe((orders) => {
      this.orders = orders;
      this.filteredOrders = orders;
    });
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.filteredOrders = orders;
      },
      error: err => console.error('Error al cargar pedidos:', err)
    });
  }

  filterOrders() {
    const filter = this.filterText.toLowerCase();
    this.filteredOrders = this.orders.filter(order =>
      order.customerName.toLowerCase().includes(filter) || order.email.toLowerCase().includes(filter)
    );
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredOrders = this.orders.filter(order =>
      order.customerName.toLowerCase().includes(term) ||
      order.email.toLowerCase().includes(term)
    );
  }
}