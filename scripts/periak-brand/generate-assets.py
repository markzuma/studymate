from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PUBLIC = Path("public")
BLUE = "#287dcc"
WHITE = "#ffffff"
NAVY = "#172b40"

SVG = '''<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 160 160">
  <rect width="160" height="160" rx="32" fill="#287dcc"/>
  <path d="M80 30V88M51 59H109"
    stroke="#ffffff" stroke-width="17"
    stroke-linecap="round" fill="none"/>
  <text x="80" y="128"
    font-family="Arial, sans-serif"
    font-size="26" font-weight="750"
    letter-spacing="1.2"
    text-anchor="middle"
    fill="#ffffff">PERIAK</text>
</svg>
'''

def font(size):
    return ImageFont.truetype(
        "DejaVuSans-Bold.ttf", size
    )

def icon(size, maskable=False):
    s = size * 4
    image = Image.new(
        "RGBA", (s, s),
        BLUE if maskable else (0, 0, 0, 0)
    )

    d = ImageDraw.Draw(image)

    if not maskable:
        d.rounded_rectangle(
            (0, 0, s-1, s-1),
            radius=int(s * .2),
            fill=BLUE
        )

    # Keep the full logo inside the maskable safe zone.
    scale = .72 if maskable else 1
    offset = (1 - scale) / 2

    def coord(value):
        return round(
            s * (offset + value / 160 * scale)
        )

    stroke = max(1, round(s * 17 / 160 * scale))
    radius = stroke // 2

    x = coord(80)
    y = coord(59)

    d.rounded_rectangle(
        (x-radius, coord(30)-radius,
         x+radius, coord(88)+radius),
        radius=radius, fill=WHITE
    )

    d.rounded_rectangle(
        (coord(51)-radius, y-radius,
         coord(109)+radius, y+radius),
        radius=radius, fill=WHITE
    )

    f = font(round(s * 26 / 160 * scale))

    d.text(
        (coord(80), coord(128)),
        "PERIAK",
        font=f,
        fill=WHITE,
        anchor="ms"
    )

    return image.resize(
        (size, size),
        Image.Resampling.LANCZOS
    )

for name in ["periak-icon.svg", "favicon.svg"]:
    (PUBLIC / name).write_text(SVG)

for size in [192, 512]:
    icon(size).save(
        PUBLIC / f"pwa-{size}x{size}.png"
    )

icon(512, True).convert("RGB").save(
    PUBLIC / "periak-maskable-512.png"
)

icon(128).save(
    PUBLIC / "favicon.ico",
    sizes=[(16,16), (32,32), (48,48), (64,64)]
)

# Minimal social sharing preview.
preview = Image.new("RGB", (1200, 630), WHITE)
mark = icon(400)

preview.paste(mark, (400, 115), mark)

preview.save(
    PUBLIC / "periak-social-preview.png",
    optimize=True
)

print("SUCCESS: All PERIAK branding assets generated.")
