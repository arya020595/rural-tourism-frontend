import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

console.log('📢 main.ts loaded, SW check running');

if (environment.production && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('✅ SW registered:', reg.scope))
    .catch(err => console.error('❌ SW registration failed:', err));
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
