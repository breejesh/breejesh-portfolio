import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout parent for /projects and /projects/:slug (Analog: projects.page.ts + projects/).
 * Child routes render through the outlet.
 */
@Component({
  selector: 'app-projects-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export default class ProjectsLayoutPage {}
