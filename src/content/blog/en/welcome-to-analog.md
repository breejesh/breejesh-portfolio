---
title: Welcome to Analog.js!
description: This is my first blog post on my newly migrated portfolio site using Analog.js.
date: 2026-07-15
tags: [Angular, Analog, Vite]
coverImage: /assets/images/d-robot.jpg
previewImage: /assets/images/d-robot.jpg
---

# Welcome to Analog.js!

Hello! I have successfully migrated my portfolio website from standard Angular CLI to **Analog.js** and **Vite**. This gives me the speed of Vite dev bundling, standalone components by default, and a filesystem-based router.

Here is an example code block with typescript highlighting to verify our syntax highlighter configuration:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<h1>Hello Analog!</h1>`
})
export class AppComponent {
  title = 'Analog.js Portfolio';
}
```

## Adding Images to Posts

We can embed visual illustrations inside our articles. For instance, here is an image of the Visual Piano project that was developed:

![Visual Piano](/assets/images/virtual-piano.jpg)

This markdown rendering is completely safe, pre-rendered during SSG, and styled with high-performance CSS variables.

Enjoy reading!
