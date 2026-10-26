import json
import random
import os
import string

def make_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=10))

def make_rect(x, y, w, h, bg="#eeeeee", stroke="#000000", stroke_width=1.5, stroke_style="solid", fill_style="solid", opacity=100, roundness=1):
    return {
        "id": make_id(),
        "type": "rectangle",
        "x": x, "y": y, "width": w, "height": h,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": bg,
        "fillStyle": fill_style,
        "strokeWidth": stroke_width,
        "strokeStyle": stroke_style,
        "roughness": 1,
        "opacity": opacity,
        "groupIds": [],
        "frameId": None,
        "roundness": {"type": roundness} if roundness else None,
        "seed": random.randint(1, 1000000),
        "version": 1,
        "versionNonce": 1,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1720000000000,
        "link": None,
        "locked": False
    }

def make_ellipse(x, y, w, h, bg="transparent", stroke="#000000", stroke_width=1.5, fill_style="solid", opacity=100):
    return {
        "id": make_id(),
        "type": "ellipse",
        "x": x, "y": y, "width": w, "height": h,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": bg,
        "fillStyle": fill_style,
        "strokeWidth": stroke_width,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": opacity,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 1000000),
        "version": 1,
        "versionNonce": 1,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1720000000000,
        "link": None,
        "locked": False
    }

def make_line(x, y, points, stroke="#000000", stroke_width=1.5):
    w = max(abs(p[0]) for p in points) if points else 1
    h = max(abs(p[1]) for p in points) if points else 1
    return {
        "id": make_id(),
        "type": "line",
        "x": x, "y": y, "width": w, "height": h,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": stroke_width,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": {"type": 2},
        "seed": random.randint(1, 1000000),
        "version": 1,
        "versionNonce": 1,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1720000000000,
        "link": None,
        "locked": False,
        "points": points,
        "lastCommittedPoint": None,
        "startBinding": None,
        "endBinding": None,
        "startArrowhead": None,
        "endArrowhead": None
    }

def make_text(x, y, text, font_size=15.0, font_family=8, color="#000000", align="center"):
    lines = text.split("\n")
    max_len = max(len(l) for l in lines) if lines else 1
    w = max_len * (font_size * 0.55)
    h = len(lines) * (font_size * 1.35)
    return {
        "id": make_id(),
        "type": "text",
        "x": x, "y": y, "width": w, "height": h,
        "angle": 0,
        "strokeColor": color,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "seed": random.randint(1, 1000000),
        "version": 1,
        "versionNonce": 1,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1720000000000,
        "link": None,
        "locked": False,
        "text": text,
        "fontSize": font_size,
        "fontFamily": font_family,
        "textAlign": align,
        "verticalAlign": "top",
        "baseline": font_size * 0.9,
        "containerId": None,
        "originalText": text,
        "lineHeight": 1.35
    }

def make_arrow(start_x, start_y, end_x, end_y, stroke="#000000", stroke_width=2, stroke_style="solid", label=None, label_offset=(0, -18)):
    dx = end_x - start_x
    dy = end_y - start_y
    elements = []
    arrow = {
        "id": make_id(),
        "type": "arrow",
        "x": start_x, "y": start_y, "width": abs(dx), "height": abs(dy),
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": stroke_width,
        "strokeStyle": stroke_style,
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "roundness": {"type": 2},
        "seed": random.randint(1, 1000000),
        "version": 1,
        "versionNonce": 1,
        "isDeleted": False,
        "boundElements": [],
        "updated": 1720000000000,
        "link": None,
        "locked": False,
        "points": [[0, 0], [dx, dy]],
        "lastCommittedPoint": None,
        "startBinding": None,
        "endBinding": None,
        "startArrowhead": None,
        "endArrowhead": "arrow"
    }
    elements.append(arrow)
    if label:
        lines = label.split("\n")
        font_size = 12.0
        w = max(len(l) for l in lines) * (font_size * 0.55)
        h = len(lines) * (font_size * 1.35)
        mid_x = start_x + dx * 0.5 - w * 0.5 + label_offset[0]
        mid_y = start_y + dy * 0.5 - h * 0.5 + label_offset[1]
        elements.append(make_text(mid_x, mid_y, label, font_size=font_size, color="#1e293b", align="center"))
    return elements

def make_callout_box(x, y, w, h, text, bg="#fff1f2", stroke="#f43f5e", text_color="#be123c", font_size=11.0, font_family=8):
    elements = []
    elements.append(make_rect(x, y, w, h, bg=bg, stroke=stroke, stroke_width=1.5, roundness=2))
    lines = text.split("\n")
    text_h = len(lines) * (font_size * 1.35)
    pad_y = max(6.0, (h - text_h) / 2)
    elements.append(make_text(x + 12, y + pad_y, text, font_size=font_size, font_family=font_family, color=text_color, align="left"))
    return elements

def make_user_figure(x, y, label="User"):
    elements = []
    elements.append(make_ellipse(x, y, 24, 25, bg="transparent", stroke="#000000", stroke_width=2))
    elements.append(make_line(x+3, y+2, [[0,0], [10, -8], [20, 0]], stroke="#2563eb", stroke_width=2))
    elements.append(make_line(x+12, y+25, [[0,0], [0, 30]], stroke="#000000", stroke_width=2))
    elements.append(make_line(x+1, y+35, [[0,0], [11, 5], [22, -5]], stroke="#000000", stroke_width=2))
    elements.append(make_line(x+12, y+55, [[0,0], [-10, 18]], stroke="#000000", stroke_width=2))
    elements.append(make_line(x+12, y+55, [[0,0], [10, 18]], stroke="#000000", stroke_width=2))
    elements.append(make_text(x - 10, y + 80, label, font_size=16.0, align="center"))
    return elements

def make_mobile_device(x, y, label="Mobile"):
    elements = []
    elements.append(make_rect(x, y, 85, 130, bg="#ced4da", stroke="#000000", stroke_width=1.5, roundness=3))
    elements.append(make_rect(x+4, y+5, 77, 120, bg="#ffffff", stroke="#000000", stroke_width=1.5, roundness=1))
    elements.append(make_ellipse(x+40, y+8, 5, 5, bg="#ced4da", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x+8, y+18, 69, 25, bg="#15aabf", stroke="#000000", stroke_width=1))
    elements.append(make_text(x+12, y+22, "APP", font_size=10.0, color="#ffffff", align="left"))
    elements.append(make_rect(x+10, y+48, 30, 25, bg="#fab005", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x+45, y+55, 28, 20, bg="#fab005", stroke="#000000", stroke_width=1))
    elements.append(make_ellipse(x+22, y+58, 8, 8, bg="#e03131", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x+8, y+110, 69, 10, bg="#15aabf", stroke="#000000", stroke_width=1))
    elements.append(make_text(x - 5, y + 138, label, font_size=16.0, align="center"))
    return elements

def make_browser_window(x, y, label="Browser"):
    elements = []
    elements.append(make_rect(x, y, 130, 80, bg="#ffffff", stroke="#000000", stroke_width=1.5, roundness=2))
    elements.append(make_rect(x, y, 130, 16, bg="#ced4da", stroke="#000000", stroke_width=1))
    elements.append(make_ellipse(x+6, y+5, 6, 6, bg="#fa5252", stroke="#000000", stroke_width=1))
    elements.append(make_ellipse(x+16, y+5, 6, 6, bg="#fab005", stroke="#000000", stroke_width=1))
    elements.append(make_ellipse(x+26, y+5, 6, 6, bg="#40c057", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x+38, y+3, 84, 10, bg="#ffffff", stroke="#000000", stroke_width=1))
    elements.append(make_text(x+5, y+90, label, font_size=15.0, align="center"))
    return elements

def make_component_box(x, y, w, h, text, bg="#eeeeee", stroke="#000000"):
    elements = []
    elements.append(make_rect(x, y, w, h, bg=bg, stroke=stroke, stroke_width=1.5, roundness=1))
    lines = text.split("\n")
    font_size = 14.0
    text_h = len(lines) * (font_size * 1.35)
    elements.append(make_text(x + 5, y + (h - text_h) / 2, text, font_size=font_size, color="#000000", align="center"))
    return elements

def make_queue_stack(x, y, w, h, text):
    elements = []
    elements.append(make_rect(x + 10, y + 10, w, h, bg="#868e96", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x + 5, y + 5, w, h, bg="#ced4da", stroke="#000000", stroke_width=1))
    elements.append(make_rect(x, y, w, h, bg="#eeeeee", stroke="#000000", stroke_width=1.5))
    lines = text.split("\n")
    font_size = 14.0
    text_h = len(lines) * (font_size * 1.35)
    elements.append(make_text(x + 10, y + (h - text_h) / 2, text, font_size=font_size, color="#000000", align="center"))
    return elements

def make_database_cylinder(x, y, w, h, text, bg="#ffffff"):
    elements = []
    elements.append(make_rect(x, y + 10, w, h - 20, bg=bg, stroke="#000000", stroke_width=1.5, roundness=None))
    elements.append(make_ellipse(x, y + h - 20, w, 20, bg=bg, stroke="#000000", stroke_width=1.5))
    elements.append(make_line(x, y + 10, [[0, 0], [0, h - 20]], stroke="#000000", stroke_width=1.5))
    elements.append(make_line(x + w, y + 10, [[0, 0], [0, h - 20]], stroke="#000000", stroke_width=1.5))
    elements.append(make_ellipse(x, y, w, 20, bg=bg, stroke="#000000", stroke_width=1.5))
    lines = text.split("\n")
    font_size = 13.5
    text_h = len(lines) * (font_size * 1.35)
    elements.append(make_text(x + 5, y + 20 + (h - 30 - text_h) / 2, text, font_size=font_size, color="#000000", align="center"))
    return elements

def make_subsystem_container(x, y, w, h, title):
    elements = []
    elements.append(make_rect(x, y, w, h, bg="transparent", stroke="#1e1e1e", stroke_width=1.5, stroke_style="dotted", roundness=3))
    elements.append(make_text(x + 20, y + 12, title, font_size=16.0, color="#1e293b", align="left"))
    return elements

def save_excalidraw_file(elements, filepath):
    data = {
        "type": "excalidraw",
        "version": 2,
        "source": "https://excalidraw.com",
        "elements": elements,
        "appState": {
            "viewBackgroundColor": "#ffffff",
            "gridSize": None
        },
        "files": {}
    }
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {filepath} with {len(elements)} elements")
