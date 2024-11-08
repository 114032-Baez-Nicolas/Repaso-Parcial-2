import { Injectable } from '@angular/core';
import { Order } from '../models/order';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ValidationResponse } from '../models/validation-response';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/orders';

  constructor(private http: HttpClient) { }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrdersByEmail(email: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}?email=${email}`);
  }

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  validateOrderLimit(email: string): Observable<ValidationResponse> {
    return this.http.get<Order[]>(`${this.apiUrl}?email=${email}`).pipe(
      map(orders => {
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.timestamp);
          const twentyFourHoursAgo = new Date();
          twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
          return orderDate > twentyFourHoursAgo;
        });
        return {
          isValid: recentOrders.length < 3,
          message: recentOrders.length >= 3 ? 'Límite de pedidos alcanzado' : ''
        };
      })
    );
  }
}