"""
Generate branded splash screen + icon assets for Quran Companion app.
Theme: Soft green (#2E7D32) on warm off-white (#F5F7F2)
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')

# ── Colour palette ─────────────────────────────────────────────────────────────
BG          = (245, 247, 242)        # #F5F7F2
GREEN_DEEP  = (46,  125,  50)        # #2E7D32
GREEN_MID   = (76,  155,  80)        # #4C9B50
GREEN_LIGHT = (200, 230, 201)        # #C8E6C9
GOLD        = (212, 175,  55)        # #D4AF37
WHITE       = (255, 255, 255)

# ── Helpers ────────────────────────────────────────────────────────────────────

def radial_glow(img: Image.Image, cx, cy, r, color, steps=12):
    """Paint a soft radial glow by drawing concentric transparent circles."""
    draw = ImageDraw.Draw(img, 'RGBA')
    for i in range(steps, 0, -1):
        frac  = i / steps
        alpha = int(30 * frac * frac)            # quadratic falloff
        cr    = int(r * frac)
        rgba  = color + (alpha,)
        draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=rgba)


def geometric_ring(draw, cx, cy, r, n_petals=8, color=(46, 125, 50, 40), width=1):
    """Draw a thin decorative ring made of arc-based petals."""
    for i in range(n_petals):
        angle = 2 * math.pi * i / n_petals
        px = cx + r * math.cos(angle)
        py = cy + r * math.sin(angle)
        draw.ellipse([px - 6, py - 6, px + 6, py + 6], outline=color, width=width)


def crescent(draw, cx, cy, outer_r, inner_r_x, inner_r_y, inner_ox, color):
    """Draw a crescent: outer circle minus offset inner circle (approximated as polygon)."""
    # Build crescent as a series of points
    pts = []
    steps = 200
    # Outer arc (full circle)
    for i in range(steps + 1):
        a = 2 * math.pi * i / steps
        pts.append((cx + outer_r * math.cos(a), cy + outer_r * math.sin(a)))
    # Inner circle (offset right → left-facing crescent)
    ix, iy = cx + inner_ox, cy
    for i in range(steps, -1, -1):
        a = 2 * math.pi * i / steps
        pts.append((ix + inner_r_x * math.cos(a), iy + inner_r_y * math.sin(a)))
    draw.polygon(pts, fill=color)


def star5(draw, cx, cy, r_out, r_in, color, rotation=0):
    """Draw a 5-pointed star."""
    pts = []
    for i in range(10):
        angle = math.pi / 5 * i + rotation
        r     = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(angle - math.pi / 2),
                    cy + r * math.sin(angle - math.pi / 2)))
    draw.polygon(pts, fill=color)


def eight_pointed_star(draw, cx, cy, r, color, alpha=255):
    """Draw a subtle 8-pointed star outline."""
    pts = []
    for i in range(16):
        angle = math.pi / 8 * i
        ri    = r if i % 2 == 0 else r * 0.45
        pts.append((cx + ri * math.cos(angle), cy + ri * math.sin(angle)))
    draw.polygon(pts, fill=color + (alpha,))


# ── Generate splash.png (1284 × 2778) ─────────────────────────────────────────

W, H = 1284, 2778
splash = Image.new('RGB', (W, H), BG)
cx, cy = W // 2, H // 2 - 60   # visual centre slightly above true centre

# --- Layer 1: subtle background rings (very faint) ---
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
radial_glow(glow_layer, cx, cy, 520, GREEN_LIGHT, steps=16)
radial_glow(glow_layer, cx, cy, 340, GREEN_LIGHT, steps=12)
splash = Image.alpha_composite(splash.convert('RGBA'), glow_layer).convert('RGB')

# --- Layer 2: decorative outer ring ---
ring_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ring_draw  = ImageDraw.Draw(ring_layer)

# Large decorative circle border
r_outer = 390
ring_draw.ellipse(
    [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
    outline=GREEN_LIGHT + (180,), width=2
)
r_mid = 355
ring_draw.ellipse(
    [cx - r_mid, cy - r_mid, cx + r_mid, cy + r_mid],
    outline=GREEN_LIGHT + (100,), width=1
)
# 16-point decorative dots on outer ring
for i in range(16):
    angle = 2 * math.pi * i / 16
    px = cx + r_outer * math.cos(angle)
    py = cy + r_outer * math.sin(angle)
    ring_draw.ellipse([px - 5, py - 5, px + 5, py + 5], fill=GREEN_DEEP + (100,))

splash = Image.alpha_composite(splash.convert('RGBA'), ring_layer).convert('RGB')

# --- Layer 3: filled background circle (card) ---
card_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
card_draw  = ImageDraw.Draw(card_layer)
r_card = 320
card_draw.ellipse(
    [cx - r_card, cy - r_card, cx + r_card, cy + r_card],
    fill=WHITE + (255,)
)
splash = Image.alpha_composite(splash.convert('RGBA'), card_layer).convert('RGB')

# --- Layer 4: main icon (crescent + star) ---
icon_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
icon_draw  = ImageDraw.Draw(icon_layer)

# Crescent moon (facing right, Islamic style)
crescent(icon_draw,
         cx=cx, cy=cy - 30,
         outer_r=160,
         inner_r_x=148, inner_r_y=148,
         inner_ox=55,
         color=GREEN_DEEP + (255,))

# 5-pointed star
star5(icon_draw,
      cx=cx + 100, cy=cy - 120,
      r_out=40, r_in=18,
      color=GREEN_DEEP + (255,),
      rotation=math.pi / 10)

# Small sparkle dots around the crescent
for angle_deg, dist, size in [(30, 195, 8), (60, 180, 6), (-30, 192, 7),
                               (90, 170, 5), (150, 185, 7), (200, 175, 6)]:
    angle = math.radians(angle_deg - 90)
    px = cx + dist * math.cos(angle)
    py = (cy - 30) + dist * math.sin(angle)
    icon_draw.ellipse([px - size, py - size, px + size, py + size],
                      fill=GREEN_LIGHT + (220,))

splash = Image.alpha_composite(splash.convert('RGBA'), icon_layer).convert('RGB')

# --- Layer 5: text ---
# Since Pillow's built-in font is tiny, we approximate with a thin geometric line art
# for the app name. We'll keep it simple but elegant.
# Actual font rendering at high quality needs a TTF - skip and rely on in-app SplashScreen
# for rich text; just add a subtle horizontal line ornament below the icon.
text_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
text_draw  = ImageDraw.Draw(text_layer)

# Horizontal decorative divider
line_y = cy + 220
line_len = 200
for x in range(-line_len, line_len):
    alpha = int(180 * (1 - (abs(x) / line_len) ** 1.5))
    text_draw.point((cx + x, line_y), fill=GREEN_DEEP + (alpha,))

# Three dots ornament
for dx in [-30, 0, 30]:
    text_draw.ellipse([cx + dx - 4, line_y + 16, cx + dx + 4, line_y + 24],
                      fill=GREEN_DEEP + (120,))

# Bottom gentle arc ornament (Islamic arch suggestion)
arch_y = cy + 260
arch_r = 120
for i in range(180):
    a = math.radians(i)
    px = cx + arch_r * math.cos(a - math.pi / 2)
    py = arch_y + arch_r * math.sin(a - math.pi / 2) * 0.25
    alpha = int(60 * math.sin(a))
    text_draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=GREEN_DEEP + (alpha,))

splash = Image.alpha_composite(splash.convert('RGBA'), text_layer).convert('RGB')

# --- Slight overall softening ---
splash = splash.filter(ImageFilter.GaussianBlur(radius=0.4))

splash.save(os.path.join(OUT, 'splash.png'))
print(f"✓ splash.png saved ({W}×{H})")

# ── Generate icon.png (1024 × 1024) ───────────────────────────────────────────
SIZE = 1024
icon = Image.new('RGB', (SIZE, SIZE), BG)
icx, icy = SIZE // 2, SIZE // 2

# Glow
g_layer = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
radial_glow(g_layer, icx, icy, 440, GREEN_LIGHT, steps=14)
radial_glow(g_layer, icx, icy, 280, GREEN_LIGHT, steps=10)
icon = Image.alpha_composite(icon.convert('RGBA'), g_layer).convert('RGB')

# White circle
ci = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
ci_draw = ImageDraw.Draw(ci)
ci_draw.ellipse([icx - 440, icy - 440, icx + 440, icy + 440], fill=WHITE + (255,))
# Border ring
ci_draw.ellipse([icx - 450, icy - 450, icx + 450, icy + 450], outline=GREEN_LIGHT + (200,), width=3)
icon = Image.alpha_composite(icon.convert('RGBA'), ci).convert('RGB')

# Crescent + star on icon
il = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
il_draw = ImageDraw.Draw(il)
crescent(il_draw, icx, icy - 20, 200, 185, 185, 70, GREEN_DEEP + (255,))
star5(il_draw, icx + 125, icy - 155, 50, 22, GREEN_DEEP + (255,), math.pi / 10)
# Sparkle dots
for a_deg, dist, s in [(25, 245, 10), (55, 225, 8), (-25, 240, 9),
                        (85, 210, 7), (145, 230, 9)]:
    a = math.radians(a_deg - 90)
    px = icx + dist * math.cos(a)
    py = (icy - 20) + dist * math.sin(a)
    il_draw.ellipse([px - s, py - s, px + s, py + s], fill=GREEN_LIGHT + (230,))
icon = Image.alpha_composite(icon.convert('RGBA'), il).convert('RGB')
icon = icon.filter(ImageFilter.GaussianBlur(radius=0.3))

icon.save(os.path.join(OUT, 'icon.png'))
# Also save as adaptive icon foreground
icon_padded = Image.new('RGB', (SIZE, SIZE), BG)
icon_cropped = icon.crop([62, 62, SIZE - 62, SIZE - 62])
icon_cropped_resized = icon_cropped.resize((SIZE - 124, SIZE - 124), Image.LANCZOS)
icon_padded.paste(icon_cropped_resized, (62, 62))
icon_padded.save(os.path.join(OUT, 'adaptive-icon.png'))
print(f"✓ icon.png + adaptive-icon.png saved ({SIZE}×{SIZE})")

print("All assets generated successfully!")
