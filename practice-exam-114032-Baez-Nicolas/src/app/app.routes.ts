import { Route, RouterModule } from '@angular/router';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { NgModule } from '@angular/core';

export const appRoutes: Route[] = [
    { path: 'create-order', component: OrderFormComponent },
    { path: 'order-list', component: OrderListComponent },
    { path: '', redirectTo: 'create-order', pathMatch: 'full' },
    { path: '**', redirectTo: 'create-order' }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
