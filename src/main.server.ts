import 'zone.js/node';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { render } from '@analogjs/router/server';

export default render(AppComponent, config);
