import os
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out_dir = "media/gnosis/shorts/thumbnails"
os.makedirs(out_dir, exist_ok=True)

# 1. Extract clean background frame from gnosis-short-bg.mp4 at 20.0s
bg_frame = os.path.join(out_dir, "temp_bg.png")
subprocess.run([
    "ffmpeg", "-ss", "00:00:20.000", "-i", "media/gnosis/shorts/gnosis-short-bg.mp4",
    "-frames:v", "1", "-pix_fmt", "rgb24", bg_frame, "-y"
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

base_img = Image.open(bg_frame).convert("RGBA")
W, H = base_img.size  # 1080 x 1920

# Fonts selection
font_paths = [
    "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
    "/System/Library/Fonts/Avenir Next.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
selected_font = None
for fp in font_paths:
    if os.path.exists(fp):
        selected_font = fp
        break

def get_font(size, bold=True):
    try:
        # Avenir Next index 1 is Demi Bold / Bold if ttc, or fallback
        return ImageFont.truetype(selected_font, size)
    except:
        return ImageFont.load_default()

def draw_rings(draw, cx, cy, size=48, color=(127, 212, 245)):
    # 4 concentric circles like the creation-torus
    radii = [6, 12, 18, 23]
    for i, r in enumerate(radii):
        alpha = int(255 * (1.0 - i * 0.18))
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(color[0], color[1], color[2], alpha),
            width=2
        )

def draw_headphones(draw, cx, cy, color=(127, 212, 245, 230)):
    # Simple clean headphone icon
    # Arc headband
    draw.arc([cx - 16, cy - 18, cx + 16, cy + 14], start=180, end=0, fill=color, width=3)
    # Left ear cup
    draw.rounded_rectangle([cx - 19, cy - 4, cx - 11, cy + 14], radius=3, fill=color)
    # Right ear cup
    draw.rounded_rectangle([cx + 11, cy - 4, cx + 19, cy + 14], radius=3, fill=color)

def build_cover(badge_text, title_lines, subtitle_text, bottom_text, out_path):
    canvas = base_img.copy()
    
    # Layer 1: Shadow layer for card
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    card_x0, card_x1 = 80, 1000
    card_y0, card_y1 = 740, 1160
    # Draw dark shadow slightly offset downwards
    s_draw.rounded_rectangle([card_x0 - 5, card_y0 + 15, card_x1 + 5, card_y1 + 25], radius=28, fill=(0, 0, 0, 180))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(24))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # Layer 2: Main overlays (Card and Pills)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    cx = W // 2  # 540

    # ==============================================================
    # 1. TOP PILL: DEPH · 04 (Y: 220 to 295)
    # ==============================================================
    pill_top_w, pill_top_h = 380, 75
    pt_x0 = cx - pill_top_w // 2
    pt_y0 = 220
    pt_x1 = cx + pill_top_w // 2
    pt_y1 = pt_y0 + pill_top_h
    
    # Fill with deep translucent dark
    draw.rounded_rectangle([pt_x0, pt_y0, pt_x1, pt_y1], radius=38, fill=(11, 14, 26, 195))
    # Concentric rings glyph at left
    draw_rings(draw, pt_x0 + 52, (pt_y0 + pt_y1) // 2)
    # Pill text
    font_pt = get_font(28)
    draw.text((pt_x0 + 98, pt_y0 + 18), "DEPH", font=font_pt, fill=(255, 255, 255, 250))
    draw.text((pt_x0 + 194, pt_y0 + 18), "·", font=font_pt, fill=(127, 212, 245, 240))
    draw.text((pt_x0 + 224, pt_y0 + 18), "04", font=font_pt, fill=(127, 212, 245, 255))

    # ==============================================================
    # 2. CENTER CARD: EXACT THE FIELD PROPORTIONS (Y: 740 to 1160)
    # NO BORDER STROKE AT ALL!
    # ==============================================================
    # Solid glass background (deep indigo/blue)
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=24, fill=(16, 28, 70, 225))
    
    # A. Badge (• GEOMETRÍA SAGRADA · 432 HZ)
    badge_y = card_y0 + 38
    font_badge = get_font(23)
    # Measure badge width to center precisely
    full_badge = f"• {badge_text}"
    bbox_b = draw.textbbox((0, 0), full_badge, font=font_badge)
    bw = bbox_b[2] - bbox_b[0]
    bx = cx - bw // 2
    # Bullet in bright magenta/fuchsia
    draw.text((bx, badge_y), "•", font=font_badge, fill=(217, 70, 239, 255))
    # Text in light purple/lilac
    draw.text((bx + 24, badge_y), badge_text, font=font_badge, fill=(192, 132, 252, 255))

    # B. Main Hook Title (Bold / Heavy, 54px, Line-height compact ~65px)
    font_title = get_font(54)
    # Calculate vertical starting position based on 2 lines
    line_h = 68
    total_title_h = len(title_lines) * line_h
    title_start_y = card_y0 + 104
    
    for i, line in enumerate(title_lines):
        bbox_l = draw.textbbox((0, 0), line, font=font_title)
        lw = bbox_l[2] - bbox_l[0]
        lx = cx - lw // 2
        ly = title_start_y + i * line_h
        # Text shadow
        draw.text((lx, ly + 3), line, font=font_title, fill=(0, 0, 0, 200))
        # Text fill (pure white)
        draw.text((lx, ly), line, font=font_title, fill=(255, 255, 255, 255))

    # C. Divider Bar (120px x 3px gradient cyan to purple)
    div_w, div_h = 120, 3
    div_x0 = cx - div_w // 2
    div_y = title_start_y + total_title_h + 16
    for step in range(div_w):
        t = step / div_w
        # Interpolate from cyan (56, 189, 248) to purple (192, 132, 252)
        r = int(56 * (1 - t) + 192 * t)
        g = int(189 * (1 - t) + 132 * t)
        b = int(248 * (1 - t) + 252 * t)
        draw.line([div_x0 + step, div_y, div_x0 + step, div_y + div_h], fill=(r, g, b, 240))

    # D. Subtitle (INTEGRACIÓN · 432 HZ)
    sub_y = div_y + 24
    font_sub = get_font(25)
    bbox_s = draw.textbbox((0, 0), subtitle_text, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    sx = cx - sw // 2
    draw.text((sx, sub_y), subtitle_text, font=font_sub, fill=(56, 189, 248, 255))

    # ==============================================================
    # 3. BOTTOM PILL: AUDIO CUE (Y: 1320 to 1405)
    # ==============================================================
    pill_bot_w, pill_bot_h = 560, 85
    pb_x0 = cx - pill_bot_w // 2
    pb_y0 = 1320
    pb_x1 = cx + pill_bot_w // 2
    pb_y1 = pb_y0 + pill_bot_h
    
    draw.rounded_rectangle([pb_x0, pb_y0, pb_x1, pb_y1], radius=42, fill=(11, 14, 26, 175))
    # Headphone icon
    draw_headphones(draw, pb_x0 + 48, (pb_y0 + pb_y1) // 2)
    # Bottom text
    font_bot = get_font(23)
    draw.text((pb_x0 + 82, pb_y0 + 26), bottom_text, font=font_bot, fill=(226, 232, 240, 240))

    # Composite overlay
    final_img = Image.alpha_composite(canvas, overlay).convert("RGB")
    final_img.save(out_path, "JPEG", quality=95)
    print(f"✓ Saved {out_path} (1080x1920)")

# Generate ES
build_cover(
    badge_text="GEOMETRÍA SAGRADA · 432 HZ",
    title_lines=["¿Y SI SER LIBRE Y ESTAR", "ATRAPADO FUERAN LO MISMO?"],
    subtitle_text="INTEGRACIÓN · 432 HZ",
    bottom_text="AURICULARES · AMBIENTE GENERATIVO",
    out_path=os.path.join(out_dir, "gnosis-short-cover-es.jpg")
)

# Generate EN
build_cover(
    badge_text="SACRED GEOMETRY · 432 HZ",
    title_lines=["WHAT IF BEING FREE AND", "TRAPPED WERE THE SAME?"],
    subtitle_text="INTEGRATION · 432 HZ",
    bottom_text="HEADPHONES · GENERATIVE AMBIENT",
    out_path=os.path.join(out_dir, "gnosis-short-cover-en.jpg")
)

# Clean temp bg
if os.path.exists(bg_frame):
    os.remove(bg_frame)

print("Canonical covers generated successfully.")
