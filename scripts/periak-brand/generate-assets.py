from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PUBLIC = Path("public")
BLUE = "#287dcc"
NAVY = "#172b40"
WHITE = "#ffffff"

SVG = '''<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 512 512">
  <rect width="512" height="512"
    rx="108" fill="#287dcc"/>
  <path d="M256 132V380M132 256H380"
    fill="none" stroke="#ffffff"
    stroke-width="76" stroke-linecap="round"/>
</svg>
'''

for name in ["periak-icon.svg", "favicon.svg"]:
    (PUBLIC / name).write_text(SVG)

def icon(size, maskable=False):
    s = size * 4

    image = Image.new(
        "RGBA",
        (s, s),
        BLUE if maskable else (0, 0, 0, 0)
    )

    draw = ImageDraw.Draw(image)

    if not maskable:
        draw.rounded_rectangle(
            (0, 0, s - 1, s - 1),
            radius=round(s * .21),
            fill=BLUE
        )

    cx = s // 2
    arm = round(s * .242)
    half = round(s * .074)

    draw.rounded_rectangle(
        (cx-half, cx-arm-half,
         cx+half, cx+arm+half),
        radius=half,
        fill=WHITE
    )

    draw.rounded_rectangle(
        (cx-arm-half, cx-half,
         cx+arm+half, cx+half),
        radius=half,
        fill=WHITE
    )

    return image.resize(
        (size, size),
        Image.Resampling.LANCZOS
    )

for size in [192, 512]:
    icon(size).save(
        PUBLIC / f"pwa-{size}x{size}.png"
    )

icon(512, True).convert("RGB").save(
    PUBLIC / "periak-maskable-512.png"
)

icon(64).save(
    PUBLIC / "favicon.ico",
    sizes=[(16,16), (32,32), (48,48), (64,64)]
)

# Professional social preview.
# No referral codes or personal information in the image.

def font(size, bold=False):
    name = (
        "DejaVuSans-Bold.ttf"
        if bold else
        "DejaVuSans.ttf"
    )
    return ImageFont.truetype(name, size)

preview = Image.new("RGB", (1200, 630), WHITE)
draw = ImageDraw.Draw(preview)

mark = icon(116)

preview.paste(mark, (82, 75), mark)

draw.text(
    (222, 94),
    "PERIAK",
    font=font(63, True),
    fill=NAVY
)

draw.text(
    (82, 259),
    "Learn. Practise. Excel.",
    font=font(57, True),
    fill=NAVY
)

draw.text(
    (84, 359),
    "Your nursing learning companion.",
    font=font(32),
    fill="#475569"
)

draw.text(
    (84, 425),
    "Study notes  •  Past papers  •  Smart exams",
    font=font(28),
    fill="#475569"
)

draw.rounded_rectangle(
    (82, 522, 280, 534),
    radius=6,
    fill=BLUE
)

preview.save(
    PUBLIC / "periak-social-preview.png",
    optimize=True
)

for name in [
    "periak-icon.svg",
    "favicon.svg",
    "favicon.ico",
    "pwa-192x192.png",
    "pwa-512x512.png",
    "periak-maskable-512.png",
    "periak-social-preview.png"
]:
    print("CREATED:", PUBLIC / name)
