import os
import subprocess
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont

os.makedirs("media/gnosis/shorts/thumbnails", exist_ok=True)

# 1. Ensure we have the clean frame from 20s
raw_frame_path = "media/gnosis/shorts/thumbnails/raw-clean-20s.png"
if not os.path.exists(raw_frame_path):
    subprocess.run([
        "ffmpeg", "-ss", "00:00:20.000", "-i", "media/gnosis/shorts/gnosis-short-bg.mp4",
        "-frames:v", "1", "-pix_fmt", "rgb24", raw_frame_path, "-y"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

fg_img = Image.open(raw_frame_path).convert("RGBA")

# Resize for 1280x720 composition
fg_center = fg_img.resize((405, 720), Image.Resampling.LANCZOS)

# Background blurred wings
bg_img = fg_img.resize((1280, 2275), Image.Resampling.LANCZOS)
crop_top = (2275 - 720) // 2
bg_cropped = bg_img.crop((0, crop_top, 1280, crop_top + 720))
bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=35))
enhancer = ImageEnhance.Brightness(bg_blurred)
bg_dark = enhancer.enhance(0.40)

# Base composite
base_composite = bg_dark.copy()
paste_x = (1280 - 405) // 2
base_composite.paste(fg_center, (paste_x, 0))

# Fonts
# Try finding Outfit or Avenir or Helvetica or Arial
font_paths = [
    "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
    "/System/Library/Fonts/Avenir Next.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
bold_font_path = None
for p in font_paths:
    if os.path.exists(p):
        bold_font_path = p
        break

def draw_rings(draw, cx, cy, color=(127, 212, 245, 230)):
    # 4 concentric circles
    for r in [4, 8, 12, 16]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)

def generate_cover(lang, badge_text, title_lines, sub_text, out_path):
    img = base_composite.copy()
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    cx = 1280 // 2  # 640

    # 1. Brand Pill (y ~ 190)
    pill_w, pill_h = 136, 32
    pill_x0 = cx - pill_w // 2
    pill_y0 = 180
    pill_x1 = pill_x0 + pill_w
    pill_y1 = pill_y0 + pill_h

    # Pill background + border
    draw.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1], radius=16, fill=(11, 14, 26, 210), outline=(127, 212, 245, 120), width=1)
    # Ring icon
    draw_rings(draw, pill_x0 + 20, pill_y0 + 16)
    # Pill text
    try:
        font_pill = ImageFont.truetype(bold_font_path, 13)
    except:
        font_pill = ImageFont.load_default()
    draw.text((pill_x0 + 44, pill_y0 + 7), "DEPH · 04", font=font_pill, fill=(242, 251, 255, 240))

    # 2. Editorial Glass Card (y ~ 240)
    card_w, card_h = 330, 145
    card_x0 = cx - card_w // 2
    card_y0 = 230
    card_x1 = card_x0 + card_w
    card_y1 = card_y0 + card_h

    # Card background + purple border
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=18, fill=(11, 14, 26, 185), outline=(168, 85, 247, 130), width=2)
    # Top inner bevel highlight
    draw.line([card_x0 + 18, card_y0 + 1, card_x1 - 18, card_y0 + 1], fill=(255, 255, 255, 60), width=1)

    # A) Category badge
    try:
        font_badge = ImageFont.truetype(bold_font_path, 11)
    except:
        font_badge = ImageFont.load_default()
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = badge_bbox[2] - badge_bbox[0]
    draw.text((cx - badge_w // 2, card_y0 + 16), badge_text, font=font_badge, fill=(127, 212, 245, 230))

    # B) Title Lines (bold uppercase)
    try:
        font_title = ImageFont.truetype(bold_font_path, 14)
    except:
        font_title = ImageFont.load_default()
    
    line_y = card_y0 + 42
    for line in title_lines:
        line_bbox = draw.textbbox((0, 0), line, font=font_title)
        lw = line_bbox[2] - line_bbox[0]
        # Text shadow
        draw.text((cx - lw // 2 + 1, line_y + 1), line, font=font_title, fill=(0, 0, 0, 180))
        draw.text((cx - lw // 2, line_y), line, font=font_title, fill=(255, 255, 255, 255))
        line_y += 20

    # C) Divider line
    div_w = 34
    div_y = line_y + 6
    draw.line([cx - div_w // 2, div_y, cx + div_w // 2, div_y], fill=(127, 212, 245, 200), width=2)

    # D) Subtitle
    try:
        font_sub = ImageFont.truetype(bold_font_path, 10)
    except:
        font_sub = ImageFont.load_default()
    sub_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = sub_bbox[2] - sub_bbox[0]
    draw.text((cx - sw // 2, div_y + 10), sub_text, font=font_sub, fill=(165, 180, 252, 220))

    # Final composite
    final_img = Image.alpha_composite(img, overlay).convert("RGB")
    final_img.save(out_path, "JPEG", quality=96)
    print(f"Generated {out_path}")

# ES Cover
generate_cover(
    "es",
    "• GEOMETRÍA SAGRADA · 432 HZ",
    ["¿Y SI SER LIBRE Y ESTAR", "ATRAPADO FUERAN LO MISMO?"],
    "INTEGRACIÓN · 432 HZ",
    "media/gnosis/shorts/thumbnails/gnosis-short-thumb-es.jpg"
)

# EN Cover
generate_cover(
    "en",
    "• SACRED GEOMETRY · 432 HZ",
    ["WHAT IF BEING FREE AND", "TRAPPED WERE THE SAME?"],
    "INTEGRATION · 432 HZ",
    "media/gnosis/shorts/thumbnails/gnosis-short-thumb-en.jpg"
)

