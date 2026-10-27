import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

os.makedirs("media/gnosis/shorts/thumbnails", exist_ok=True)

# 1. Extract the native 1080x1920 clean frame from gnosis-short-bg.mp4 at 20.0s (peak gold geometry)
raw_frame_path = "media/gnosis/shorts/thumbnails/raw-clean-20s.png"
if not os.path.exists(raw_frame_path):
    subprocess.run([
        "ffmpeg", "-ss", "00:00:20.000", "-i", "media/gnosis/shorts/gnosis-short-bg.mp4",
        "-frames:v", "1", "-pix_fmt", "rgb24", raw_frame_path, "-y"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

base_img = Image.open(raw_frame_path).convert("RGBA")
W, H = base_img.size  # 1080 x 1920

# Locate system bold fonts
font_candidates = [
    "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
    "/System/Library/Fonts/Avenir Next.ttc",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
bold_font_path = None
for f in font_candidates:
    if os.path.exists(f):
        bold_font_path = f
        break

def draw_concentric_rings(draw, cx, cy, color=(127, 212, 245, 240)):
    for r in [6, 12, 18, 24]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)

def build_vertical_cover(lang, badge_text, title_lines, sub_text, out_path):
    img = base_img.copy()
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    cx = W // 2  # 540

    # 1. Brand Pill (y: ~680)
    pill_w, pill_h = 280, 56
    pill_x0 = cx - pill_w // 2
    pill_y0 = 680
    pill_x1 = pill_x0 + pill_w
    pill_y1 = pill_y0 + pill_h

    # Capsule background & border
    draw.rounded_rectangle([pill_x0, pill_y0, pill_x1, pill_y1], radius=28, fill=(11, 14, 26, 210), outline=(127, 212, 245, 140), width=2)
    # Ring logo
    draw_concentric_rings(draw, pill_x0 + 38, pill_y0 + 28)
    # Pill text
    try:
        font_pill = ImageFont.truetype(bold_font_path, 22)
    except:
        font_pill = ImageFont.load_default()
    draw.text((pill_x0 + 82, pill_y0 + 14), "DEPH · 04", font=font_pill, fill=(242, 251, 255, 255))

    # 2. Editorial Glass Card (y: ~770)
    card_w, card_h = 860, 360
    card_x0 = cx - card_w // 2
    card_y0 = 770
    card_x1 = card_x0 + card_w
    card_y1 = card_y0 + card_h

    # Glass background with purple border
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=28, fill=(11, 14, 26, 195), outline=(168, 85, 247, 140), width=3)
    # Top inner bevel highlight
    draw.line([card_x0 + 28, card_y0 + 2, card_x1 - 28, card_y0 + 2], fill=(255, 255, 255, 70), width=2)

    # A) Category badge
    try:
        font_badge = ImageFont.truetype(bold_font_path, 24)
    except:
        font_badge = ImageFont.load_default()
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = badge_bbox[2] - badge_bbox[0]
    draw.text((cx - badge_w // 2, card_y0 + 38), badge_text, font=font_badge, fill=(127, 212, 245, 240))

    # B) Hook Title (Bold White)
    try:
        font_title = ImageFont.truetype(bold_font_path, 36)
    except:
        font_title = ImageFont.load_default()

    line_y = card_y0 + 98
    for line in title_lines:
        line_bbox = draw.textbbox((0, 0), line, font=font_title)
        lw = line_bbox[2] - line_bbox[0]
        # Drop shadow for readability
        draw.text((cx - lw // 2 + 2, line_y + 2), line, font=font_title, fill=(0, 0, 0, 200))
        draw.text((cx - lw // 2, line_y), line, font=font_title, fill=(255, 255, 255, 255))
        line_y += 48

    # C) Divider line
    div_w = 64
    div_y = line_y + 14
    draw.line([cx - div_w // 2, div_y, cx + div_w // 2, div_y], fill=(127, 212, 245, 220), width=3)

    # D) Subtitle
    try:
        font_sub = ImageFont.truetype(bold_font_path, 24)
    except:
        font_sub = ImageFont.load_default()
    sub_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = sub_bbox[2] - sub_bbox[0]
    draw.text((cx - sw // 2, div_y + 20), sub_text, font=font_sub, fill=(165, 180, 252, 230))

    # Composite & save high quality JPEG
    final = Image.alpha_composite(img, overlay).convert("RGB")
    final.save(out_path, "JPEG", quality=96)
    print(f"Generated {out_path} ({W}x{H})")

# ES Vertical Cover
build_vertical_cover(
    "es",
    "• GEOMETRÍA SAGRADA · 432 HZ",
    ["¿Y SI SER LIBRE Y ESTAR", "ATRAPADO FUERAN LO MISMO?"],
    "INTEGRACIÓN · 432 HZ",
    "media/gnosis/shorts/thumbnails/gnosis-short-vertical-es.jpg"
)

# EN Vertical Cover
build_vertical_cover(
    "en",
    "• SACRED GEOMETRY · 432 HZ",
    ["WHAT IF BEING FREE AND", "TRAPPED WERE THE SAME?"],
    "INTEGRATION · 432 HZ",
    "media/gnosis/shorts/thumbnails/gnosis-short-vertical-en.jpg"
)

