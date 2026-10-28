import os
import subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

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

def get_font(size):
    try:
        return ImageFont.truetype(selected_font, size)
    except:
        return ImageFont.load_default()

def draw_rings(draw, cx, cy, color=(127, 212, 245)):
    radii = [6, 12, 18, 23]
    for i, r in enumerate(radii):
        alpha = int(255 * (1.0 - i * 0.18))
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(color[0], color[1], color[2], alpha),
            width=2
        )

def draw_headphones(draw, cx, cy, color=(127, 212, 245, 230)):
    draw.arc([cx - 16, cy - 18, cx + 16, cy + 14], start=180, end=0, fill=color, width=3)
    draw.rounded_rectangle([cx - 19, cy - 4, cx - 11, cy + 14], radius=3, fill=color)
    draw.rounded_rectangle([cx + 11, cy - 4, cx + 19, cy + 14], radius=3, fill=color)

def make_frosted_panel(base, box, radius, tint_rgb, alpha_range, blur_rad=28, sat=1.8):
    """
    Renders an authentic frosted glassmorphic panel over the base image:
    1. Crops background with padding
    2. Applies Gaussian Blur (frosted diffusion)
    3. Saturates colors (saturate 180%)
    4. Applies translucent glass tint gradient
    5. Returns (glass_image, mask)
    """
    x0, y0, x1, y1 = box
    w = x1 - x0
    h = y1 - y0
    pad = blur_rad + 6
    
    crop_box = (max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad))
    patch = base.crop(crop_box)
    
    blurred = patch.filter(ImageFilter.GaussianBlur(blur_rad))
    blurred = ImageEnhance.Color(blurred).enhance(sat)
    
    # Crop back to exact panel dimensions
    exact_patch = blurred.crop((pad, pad, pad + w, pad + h))
    
    # Tint overlay
    tint = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tint)
    a_start, a_end = alpha_range
    for y in range(h):
        t = y / h
        a = int(a_start * (1 - t) + a_end * t)
        t_draw.line([0, y, w, y], fill=(tint_rgb[0], tint_rgb[1], tint_rgb[2], a))
    
    # Specular glass reflection on top 100px
    for y in range(min(120, h)):
        t = y / min(120, h)
        alpha = int(24 * (1.0 - t))
        t_draw.line([0, y, w, y], fill=(255, 255, 255, alpha))
    
    glass = Image.alpha_composite(exact_patch.convert("RGBA"), tint)
    
    mask = Image.new("L", (w, h), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, w, h], radius=radius, fill=255)
    
    return glass, mask

def build_glass_cover(badge_text, title_lines, subtitle_text, bottom_text, out_path):
    canvas = base_img.copy()
    cx = W // 2  # 540

    # -------------------------------------------------------------
    # 1. SHADOWS LAYER (Deep soft ambient shadows)
    # -------------------------------------------------------------
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    
    # Card shadow (Y: 740 to 1160, X: 80 to 1000)
    card_box = (80, 740, 1000, 1160)
    s_draw.rounded_rectangle([card_box[0] - 4, card_box[1] + 16, card_box[2] + 4, card_box[3] + 28], radius=28, fill=(0, 0, 0, 195))
    
    # Top pill shadow
    pt_box = (cx - 190, 220, cx + 190, 295)
    s_draw.rounded_rectangle([pt_box[0], pt_box[1] + 8, pt_box[2], pt_box[3] + 12], radius=38, fill=(0, 0, 0, 140))
    
    # Bottom pill shadow
    pb_box = (cx - 280, 1320, cx + 280, 1405)
    s_draw.rounded_rectangle([pb_box[0], pb_box[1] + 8, pb_box[2], pb_box[3] + 12], radius=42, fill=(0, 0, 0, 140))
    
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(24))
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # -------------------------------------------------------------
    # 2. FROSTED GLASS PANELS (AUTHENTIC GLASSMORHPISM)
    # -------------------------------------------------------------
    # Top Pill Glass
    glass_pt, mask_pt = make_frosted_panel(base_img, pt_box, radius=38, tint_rgb=(11, 14, 26), alpha_range=(160, 190), blur_rad=20)
    canvas.paste(glass_pt, (pt_box[0], pt_box[1]), mask_pt)
    
    # Center Card Glass (Indigo translucent frosted glass, NO BORDER)
    glass_card, mask_card = make_frosted_panel(base_img, card_box, radius=24, tint_rgb=(14, 24, 64), alpha_range=(140, 180), blur_rad=32, sat=1.8)
    canvas.paste(glass_card, (card_box[0], card_box[1]), mask_card)
    
    # Bottom Pill Glass
    glass_pb, mask_pb = make_frosted_panel(base_img, pb_box, radius=42, tint_rgb=(11, 14, 26), alpha_range=(150, 180), blur_rad=20)
    canvas.paste(glass_pb, (pb_box[0], pb_box[1]), mask_pb)

    # -------------------------------------------------------------
    # 3. TYPOGRAPHY & VECTOR OVERLAYS
    # -------------------------------------------------------------
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # A. Top Pill: DEPH · 04
    draw_rings(draw, pt_box[0] + 52, (pt_box[1] + pt_box[3]) // 2)
    font_pt = get_font(28)
    draw.text((pt_box[0] + 98, pt_box[1] + 18), "DEPH", font=font_pt, fill=(255, 255, 255, 250))
    draw.text((pt_box[0] + 194, pt_box[1] + 18), "·", font=font_pt, fill=(127, 212, 245, 240))
    draw.text((pt_box[0] + 224, pt_box[1] + 18), "04", font=font_pt, fill=(127, 212, 245, 255))

    # B. Card Content (No border!)
    badge_y = card_box[1] + 38
    font_badge = get_font(23)
    full_badge = f"• {badge_text}"
    bbox_b = draw.textbbox((0, 0), full_badge, font=font_badge)
    bw = bbox_b[2] - bbox_b[0]
    bx = cx - bw // 2
    draw.text((bx, badge_y), "•", font=font_badge, fill=(217, 70, 239, 255))
    draw.text((bx + 24, badge_y), badge_text, font=font_badge, fill=(192, 132, 252, 255))

    # Hook Title
    font_title = get_font(54)
    line_h = 68
    total_title_h = len(title_lines) * line_h
    title_start_y = card_box[1] + 104
    
    for i, line in enumerate(title_lines):
        bbox_l = draw.textbbox((0, 0), line, font=font_title)
        lw = bbox_l[2] - bbox_l[0]
        lx = cx - lw // 2
        ly = title_start_y + i * line_h
        draw.text((lx, ly + 3), line, font=font_title, fill=(0, 0, 0, 220))
        draw.text((lx, ly), line, font=font_title, fill=(255, 255, 255, 255))

    # Divider Bar
    div_w, div_h = 120, 3
    div_x0 = cx - div_w // 2
    div_y = title_start_y + total_title_h + 16
    for step in range(div_w):
        t = step / div_w
        r = int(56 * (1 - t) + 192 * t)
        g = int(189 * (1 - t) + 132 * t)
        b = int(248 * (1 - t) + 252 * t)
        draw.line([div_x0 + step, div_y, div_x0 + step, div_y + div_h], fill=(r, g, b, 240))

    # Subtitle
    sub_y = div_y + 24
    font_sub = get_font(25)
    bbox_s = draw.textbbox((0, 0), subtitle_text, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    sx = cx - sw // 2
    draw.text((sx, sub_y), subtitle_text, font=font_sub, fill=(56, 189, 248, 255))

    # C. Bottom Pill
    draw_headphones(draw, pb_box[0] + 48, (pb_box[1] + pb_box[3]) // 2)
    font_bot = get_font(23)
    draw.text((pb_box[0] + 82, pb_box[1] + 26), bottom_text, font=font_bot, fill=(226, 232, 240, 240))

    # Final composite
    final_img = Image.alpha_composite(canvas, overlay).convert("RGB")
    final_img.save(out_path, "JPEG", quality=95)
    print(f"✓ Saved authentic glassmorphic cover: {out_path} (1080x1920)")

# Generate ES
build_glass_cover(
    badge_text="GEOMETRÍA SAGRADA · 432 HZ",
    title_lines=["¿Y SI SER LIBRE Y ESTAR", "ATRAPADO FUERAN LO MISMO?"],
    subtitle_text="INTEGRACIÓN · 432 HZ",
    bottom_text="AURICULARES · AMBIENTE GENERATIVO",
    out_path=os.path.join(out_dir, "gnosis-short-cover-es.jpg")
)

# Generate EN
build_glass_cover(
    badge_text="SACRED GEOMETRY · 432 HZ",
    title_lines=["WHAT IF BEING FREE AND", "TRAPPED WERE THE SAME?"],
    subtitle_text="INTEGRATION · 432 HZ",
    bottom_text="HEADPHONES · GENERATIVE AMBIENT",
    out_path=os.path.join(out_dir, "gnosis-short-cover-en.jpg")
)

if os.path.exists(bg_frame):
    os.remove(bg_frame)

print("Both authentic glassmorphic covers rendered successfully.")
