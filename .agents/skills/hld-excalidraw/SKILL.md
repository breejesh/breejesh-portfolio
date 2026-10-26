---
name: hld-excalidraw
description: >-
  Create authentic, human-designed High-Level Design (HLD) architecture diagrams in Excalidraw format (.excalidraw) and export them to publication-grade high-resolution PNGs. Use whenever the user asks for architecture diagrams, system designs, HLD flowcharts, Excalidraw drawings, or visual system representations without AI slop or text stuffing.
---

# High-Level Design (HLD) Excalidraw Generation Skill

This skill enables the automated, programmatic generation of human-quality systems architecture diagrams in `.excalidraw` format and their headless compilation into 2x high-resolution PNGs.

Follow this runbook to produce authentic, publication-grade diagrams that communicate architectural semantics visually without AI slop or text stuffing.

---

## Core Philosophy & Design Standards

1. **A Picture Speaks a Thousand Words:** Never pack paragraphs or bullet points inside diagram boxes. Text inside boxes must be strictly limited to 2 to 4 words (e.g., `Envoy Gateway`, `Kuhn-Munkres Batch Matcher`). All deep technical justifications, runtime lifecycles, and failure recovery mechanics belong in the body text of the document.
2. **Recognizable Visual Metaphors:** Ground every subsystem in clear visual shapes:
   * **Actors:** Hand-drawn stick figures with cap/visor.
   * **Devices:** Realistic mobile phones (bezels, screen, speaker dot, app banner, map blocks, home bar) or browser windows.
   * **Queues / Event Streams:** 3-layer offset stacked rectangles (`Kafka Geo-Topic`).
   * **Databases / Caches:** 3D storage cylinders with curved ellipses (`Aurora PostgreSQL`, `Redis GEO`).
   * **Subsystem Tiers:** Dotted rounded containers with 18pt title labels in the corner.
   * **Alerts / Bottlenecks:** Callout badges with soft red or green tints.
3. **Clean Flow Routing:** Left-to-right or top-to-bottom pipeline. Zero intersecting lines. Labels placed 14px to 18px above arrows to prevent text collisions.

For detailed patterns, review the [Visual Guidelines Reference](./references/visual_guidelines.md).

---

## Step-by-Step Procedure

### Step 1: Design the Architecture Layout
Plan the system components across discrete functional tiers:
* **Tier 1 (Edge Clients):** Mobile handsets, web browsers, IoT devices, human actors.
* **Tier 2 (Ingress & Gateways):** API gateways, load balancers, authentication, protocol translators.
* **Tier 3 (State & Messaging):** Kafka message brokers, Redis caches, event logs.
* **Tier 4 (Core Processing & Storage):** Microservices, batch solvers, relational DBs, analytics engines.

### Step 2: Generate the `.excalidraw` File via Python
Use the provided [`excalidraw_builder.py`](./scripts/excalidraw_builder.py) library to build the diagram programmatically.

```python
import sys
import os

# Import the builder library
sys.path.append(r"F:\My Data\Academic\GaTech\AIC\.agents\skills\hld-excalidraw\scripts")
from excalidraw_builder import (
    make_user_figure,
    make_mobile_device,
    make_browser_window,
    make_component_box,
    make_queue_stack,
    make_database_cylinder,
    make_subsystem_container,
    make_callout_box,
    make_arrow,
    save_excalidraw_file
)

elements = []

# 1. Edge Client
elements.extend(make_user_figure(50, 100, label="User"))
elements.extend(make_mobile_device(140, 60, label="Mobile App"))

# 2. Ingress Arrow
elements.extend(make_arrow(230, 120, 360, 160, label="HTTPS / TLS 1.3", label_offset=(0, -14)))

# 3. Subsystem Container & Service Boxes
elements.extend(make_subsystem_container(340, 30, 320, 400, "Ingress & Edge Tier"))
elements.extend(make_component_box(370, 120, 110, 85, "API\nGateway", bg="#e2e8f0"))
elements.extend(make_component_box(520, 120, 115, 80, "Order\nService", bg="#eeeeee"))
elements.extend(make_arrow(480, 155, 520, 155, label="Route Request", label_offset=(0, -14)))

# 4. Message Broker Stack & Database Cylinder
elements.extend(make_subsystem_container(700, 30, 320, 400, "Persistence Tier"))
elements.extend(make_queue_stack(730, 80, 120, 85, "Kafka\nTopic"))
elements.extend(make_database_cylinder(730, 220, 120, 100, "PostgreSQL\nPrimary", bg="#ffffff"))

# Save to .excalidraw JSON
save_excalidraw_file(elements, "my_architecture.excalidraw")
```

For a full working implementation, see [`examples/generate_sample_hld.py`](./examples/generate_sample_hld.py).

### Step 3: Export to High-Resolution PNG (2x Scale)
Run the headless export tool using Node.js:

```powershell
node "F:\My Data\Academic\GaTech\AIC\.agents\skills\hld-excalidraw\scripts\export_to_png.js" <input.excalidraw> <output.png> [port]
```

* This spins up a local HTTP server hosting [`render_excal.html`](./scripts/render_excal.html).
* Automatically launches native Chrome via Puppeteer at `deviceScaleFactor: 2`.
* Calls `@excalidraw/utils` `exportToSvg({ data: { elements, appState: { exportPadding: 20 } } })`.
* Takes a high-resolution screenshot of the rendered SVG and saves it directly to PNG.

### Step 4: Visual Verification (Crucial)
Always view the exported PNG using `view_file`:
* Verify that arrow labels do not intersect lines or boxes.
* Confirm that subsystem titles and callouts are cleanly bounded.
* Check that device screens and database cylinders are rendered with proper proportions.

### Step 5: Body Text Alignment
Ensure that every labeled box, queue, and database in the diagram is explicitly referenced and explained in 1 to 2 sentences in the accompanying document text (detailing runtime data lifecycle, protocol, and failure handling).
