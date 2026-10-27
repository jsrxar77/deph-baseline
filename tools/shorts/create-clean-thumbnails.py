import os
import subprocess
from PIL import Image, ImageFilter, ImageEnhance

os.makedirs("media/gnosis/shorts/thumbnails", exist_ok=True)

# 1. Extract high-quality clean frame from gnosis-short-bg.mp4 at 20.0s (peak gold tetrahedron / sacred geometry)
raw_frame_path = "media/gnosis/shorts/thumbnails/raw-clean-20s.png"
subprocess.run([
    "ffmpeg", "-ss", "00:00:20.000", "-i", "media/gnosis/shorts/gnosis-short-bg.mp4",
    "-frames:v", "1", "-pix_fmt", "rgb24", raw_frame_path, "-y"
], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Open the 1080x1920 clean frame
fg_img = Image.open(raw_frame_path)

# Save the pure 9:16 clean vertical cover (no text, no dialogue, pure art)
fg_img.save("media/gnosis/shorts/thumbnails/gnosis-cover-clean-vertical.jpg", quality=95)
print("Saved gnosis-cover-clean-vertical.jpg")

# 2. Build 1280x720 YouTube Shorts Thumbnail with blurred wings (matching The Field layout standard)
# Scale foreground to height 720 (keeping 9:16 aspect ratio: 405x720)
fg_resized = fg_img.resize((405, 720), Image.Resampling.LANCZOS)

# Create background: scale fg_img to cover 1280x720, then heavy blur + slight darken
bg_img = fg_img.resize((1280, 2275), Image.Resampling.LANCZOS)
# Crop center 1280x720
crop_top = (2275 - 720) // 2
bg_cropped = bg_img.crop((0, crop_top, 1280, crop_top + 720))
# Apply heavy gaussian blur and dim
bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=35))
enhancer = ImageEnhance.Brightness(bg_blurred)
bg_dark = enhancer.enhance(0.45)

# Composite foreground in center
composite = bg_dark.copy()
paste_x = (1280 - 405) // 2
composite.paste(fg_resized, (paste_x, 0))

# Save 100% clean art thumbnail (NO TEXT, NO DIALOGUE)
composite.save("media/gnosis/shorts/thumbnails/gnosis-cover-clean-16x9.jpg", quality=95)
print("Saved gnosis-cover-clean-16x9.jpg")

