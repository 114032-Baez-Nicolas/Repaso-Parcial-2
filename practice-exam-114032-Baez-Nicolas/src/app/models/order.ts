import { OrderProduct } from "./orderproduct";

export interface Order {
    id?: string;
    customerName: string;
    email: string;
    products: OrderProduct[];
    total: number;
    orderCode: string;
    timestamp: string;
}