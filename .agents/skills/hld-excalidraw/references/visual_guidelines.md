# Excalidraw HLD Visual Guidelines & Architecture Patterns

> **Core Philosophy:** "A picture speaks a thousand words. Text walls inside diagram boxes fail to paint a picture."

---

## 1. Visual Metaphors (The Architectural Building Blocks)

Never use generic, empty rectangles for everything. Ground each subsystem in recognizable distributed systems metaphors:

| Architectural Role | Metaphor / Shape | Excalidraw Representation | Helper Function |
| :--- | :--- | :--- | :--- |
| **Human Actor** | User stick figure with cap/hat | Ellipse head, stick body, arms, legs, blue visor line, role label | `make_user_figure(x, y, label)` |
| **Mobile Client** | Smartphone handset frame | Outer bezel, screen window, speaker dot, header banner, UI content blocks, home bar | `make_mobile_device(x, y, label)` |
| **Web Client** | Browser window frame | Window frame, red/yellow/green control dots, URL address bar | `make_browser_window(x, y, label)` |
| **Microservice / Worker** | Clean component box | Rectangular block (`w=110-140, h=80-95`), `#eeeeee` fill, `#000000` stroke, 2–3 words centered text | `make_component_box(x, y, w, h, text, bg, stroke)` |
| **Event Stream / Queue** | Partitioned log stack | 3 offset stacked rectangles with depth shading (`#868e96`, `#ced4da`, `#eeeeee`) | `make_queue_stack(x, y, w, h, text)` |
| **Database / Datastore** | 3D storage cylinder | Top curved ellipse, rectangular body with side borders, bottom curved ellipse | `make_database_cylinder(x, y, w, h, text, bg)` |
| **Subsystem Boundary** | Tier container | Dotted rounded bounding box (`strokeStyle: "dotted"`), 18pt title in top-left | `make_subsystem_container(x, y, w, h, title)` |
| **Bottleneck / Alert** | Callout highlight badge | Rounded box with soft tint (`#fff1f2` red for bottlenecks, `#f0fdf4` green for optimizations) | `make_callout_box(x, y, w, h, text, bg, stroke, text_color)` |

---

## 2. Anti-Patterns to Avoid ("AI Slop" Diagnostics)

1. **Text Stuffing:** 
   * *Anti-Pattern:* Packing full paragraphs, operational bullets, or latency proofs inside component boxes.
   * *Correction:* Limit text inside boxes to 2 to 4 words (`Envoy Gateway`, `Kuhn-Munkres Batch Matcher`). Move all engineering justifications and protocol details into the body text.
2. **Line Collisions & Crossings:**
   * *Anti-Pattern:* Drawing long diagonal arrows that cut directly through unrelated boxes or cylinders.
   * *Correction:* Route return paths through intermediary event brokers or dedicated upper/lower perimeter channels. Stagger component heights so arrows run horizontally or vertically without intersections.
3. **Overlapping Labels:**
   * *Anti-Pattern:* Arrow text rendered directly on top of the arrow line or box borders.
   * *Correction:* Offset label coordinates by $-14\text{ px}$ to $-18\text{ px}$ vertically so text sits comfortably above the line.

---

## 3. Structural Layout & Information Flow

* **Left-to-Right Pipeline:**
  `[Clients / Actors]` $\rightarrow$ `[Edge Ingress Tier]` $\rightarrow$ `[State & Queue Tier]` $\rightarrow$ `[Core Compute / Persistence]`
* **Return Flow Pattern:**
  Rather than drawing a giant red arrow cutting across the entire canvas, route match/dispatch events back through the Ingress Gateway or message topic, which notifies edge clients over existing persistent connections.
* **Text Alignment Rule:**
  Every labeled box in the diagram must have a matching 1 to 2 sentence explanation in the document text detailing:
  1. *Input:* Protocols, payloads, arrival rates.
  2. *Computation:* Algorithms, state updates, routing decisions.
  3. *Output:* Downstream RPCs, database commits, client push notifications.
