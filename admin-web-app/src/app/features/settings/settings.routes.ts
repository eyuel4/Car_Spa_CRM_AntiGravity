import { Routes } from '@angular/router';
import { SettingsOverviewComponent } from './settings-overview/settings-overview.component';
import { ShopsSettingsComponent } from './shops-settings/shops-settings.component';
import { ShopFormComponent } from './shops-settings/shop-form/shop-form.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';

export const SETTINGS_ROUTES: Routes = [
    {
        path: '',
        component: SettingsOverviewComponent,
        pathMatch: 'full'
    },
    {
        path: 'shops',
        component: ShopsSettingsComponent
    },
    {
        path: 'shops/new',
        component: ShopFormComponent
    },
    {
        path: 'shops/:id',
        component: ShopFormComponent
    },
    {
        path: 'notifications',
        component: NotificationSettingsComponent
    }
];
