import { Routes } from '@angular/router';
import { SettingsOverviewComponent } from './settings-overview/settings-overview.component';
import { ShopsSettingsComponent } from './shops-settings/shops-settings.component';
import { ShopFormComponent } from './shops-settings/shop-form/shop-form.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { TenantProfileComponent } from './tenant-profile/tenant-profile.component';
import { SystemPreferencesComponent } from './system-preferences/system-preferences.component';
import { MyProfileComponent } from './my-profile/my-profile.component';

export const SETTINGS_ROUTES: Routes = [
    {
        path: '',
        component: SettingsOverviewComponent,
        pathMatch: 'full'
    },
    {
        path: 'profile',
        component: TenantProfileComponent
    },
    {
        path: 'preferences',
        component: SystemPreferencesComponent
    },
    {
        path: 'my-profile',
        component: MyProfileComponent
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
