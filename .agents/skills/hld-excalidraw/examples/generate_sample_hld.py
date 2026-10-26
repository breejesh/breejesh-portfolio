import sys
import os

# Add scripts directory to path
script_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts"))
sys.path.append(script_dir)

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

def build_sample_hld():
    elements = []

    # 1. Edge Clients (Left Tier)
    elements.extend(make_user_figure(50, 100, label="End User"))
    elements.extend(make_mobile_device(140, 60, label="Mobile App"))

    # 2. Arrows to Gateway
    elements.extend(make_arrow(230, 120, 360, 160, label="HTTPS / TLS 1.3", label_offset=(0, -14)))

    # 3. Subsystem 1: Ingress & Core Services
    elements.extend(make_subsystem_container(340, 30, 320, 420, "API & Edge Ingress Tier"))
    elements.extend(make_component_box(370, 120, 110, 85, "Envoy\nGateway", bg="#e2e8f0"))
    elements.extend(make_component_box(520, 70, 115, 80, "Auth\nService", bg="#eeeeee"))
    elements.extend(make_component_box(520, 240, 115, 80, "Order\nLifecycle", bg="#eeeeee"))

    elements.extend(make_arrow(480, 140, 520, 110, label="Verify JWT", label_offset=(0, -14)))
    elements.extend(make_arrow(480, 175, 520, 260, label="Place Order", label_offset=(0, 14)))

    # 4. Subsystem 2: Streaming & In-Memory State
    elements.extend(make_subsystem_container(700, 30, 320, 420, "Asynchronous Event Tier"))
    elements.extend(make_queue_stack(730, 70, 120, 85, "Kafka\nOrder-Events"))
    elements.extend(make_database_cylinder(730, 240, 120, 100, "Redis\nSession Cache", bg="#fef2f2"))

    elements.extend(make_arrow(635, 110, 725, 110, label="Publish", label_offset=(0, -14)))
    elements.extend(make_arrow(635, 280, 725, 280, label="Read Session", label_offset=(0, -14)))

    # 5. Subsystem 3: Persistence & Analytics
    elements.extend(make_subsystem_container(1060, 30, 380, 420, "Persistence & Processing Engine"))
    elements.extend(make_component_box(1090, 70, 135, 85, "Worker\nConsumer", bg="#eeeeee"))
    elements.extend(make_database_cylinder(1090, 230, 135, 110, "PostgreSQL\nPrimary DB", bg="#ffffff"))

    # Highlight Callout
    elements.extend(make_callout_box(1240, 70, 180, 85, "SCALABILITY GOAL:\n* Event-Driven decoupled\n* < 50ms P99 Latency\n* High Availability", bg="#f0fdf4", stroke="#22c55e", text_color="#15803d"))

    elements.extend(make_arrow(850, 110, 1085, 110, label="Consume Event", label_offset=(0, -14)))
    elements.extend(make_arrow(1155, 155, 1155, 230, label="ACID Commit", label_offset=(36, 0)))

    return elements

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "sample_hld_output.excalidraw")
    elements = build_sample_hld()
    save_excalidraw_file(elements, out_file)
