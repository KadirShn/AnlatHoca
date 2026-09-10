"""Build deterministic release assets from the approved Anlat Hoca masters."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MASCOT_PATH = ROOT / "apps/mobile/assets/branding/mascot-master.png"
FEATURE_MASTER_PATH = ROOT / "apps/mobile/assets/branding/feature-graphic-master.png"
MOBILE_IMAGES = ROOT / "apps/mobile/assets/images"
PLAY_ASSETS = ROOT / "docs/release/assets/google-play"

LIGHT = "#F9FAFB"
LIGHT_GREEN = "#DCFCE7"
DARK_GREEN = "#0E7A3B"
PRIMARY_GREEN = "#16A34A"
DARK_TEXT = "#1F2937"
WHITE = "#FFFFFF"


def load_trimmed(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bounds = image.getbbox()
    if bounds is None:
        raise ValueError(f"Asset is empty: {path}")
    return image.crop(bounds)


def contain(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(box, Image.Resampling.LANCZOS)
    return copy


def center(canvas: Image.Image, image: Image.Image, y_offset: int = 0) -> None:
    position = (
        (canvas.width - image.width) // 2,
        (canvas.height - image.height) // 2 + y_offset,
    )
    canvas.alpha_composite(image, position)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def create_splash(mascot: Image.Image, dark: bool) -> Image.Image:
    canvas = Image.new("RGBA", (768, 768), (0, 0, 0, 0))
    owl = contain(mascot, (420, 420))
    center(canvas, owl, -95)

    draw = ImageDraw.Draw(canvas)
    heading_font = font("C:/Windows/Fonts/segoeuib.ttf", 64)
    tagline_font = font("C:/Windows/Fonts/segoeui.ttf", 30)
    heading_color = WHITE if dark else DARK_GREEN
    tagline_color = WHITE if dark else DARK_TEXT

    draw.text(
        (canvas.width // 2, 536),
        "Anlat Hoca",
        anchor="mm",
        fill=heading_color,
        font=heading_font,
    )
    draw.text(
        (canvas.width // 2, 602),
        "Daha iyi öğren. Daha ileri git.",
        anchor="mm",
        fill=tagline_color,
        font=tagline_font,
    )
    return canvas


def main() -> None:
    MOBILE_IMAGES.mkdir(parents=True, exist_ok=True)
    PLAY_ASSETS.mkdir(parents=True, exist_ok=True)
    mascot = load_trimmed(MASCOT_PATH)

    icon = Image.new("RGBA", (1024, 1024), LIGHT)
    center(icon, contain(mascot, (840, 840)))
    icon.convert("RGB").save(MOBILE_IMAGES / "icon.png", optimize=True)

    foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    center(foreground, contain(mascot, (620, 620)))
    foreground.save(MOBILE_IMAGES / "android-icon-foreground.png", optimize=True)

    background = Image.new("RGB", (1024, 1024), LIGHT_GREEN)
    background.save(MOBILE_IMAGES / "android-icon-background.png", optimize=True)

    alpha = foreground.getchannel("A")
    monochrome = Image.new("RGBA", foreground.size, WHITE)
    monochrome.putalpha(alpha)
    monochrome.save(MOBILE_IMAGES / "android-icon-monochrome.png", optimize=True)

    create_splash(mascot, dark=False).save(
        MOBILE_IMAGES / "splash-light.png", optimize=True
    )
    create_splash(mascot, dark=True).save(
        MOBILE_IMAGES / "splash-dark.png", optimize=True
    )

    favicon = Image.new("RGBA", (64, 64), LIGHT)
    center(favicon, contain(mascot, (56, 56)))
    favicon.save(MOBILE_IMAGES / "favicon.png", optimize=True)

    icon.resize((512, 512), Image.Resampling.LANCZOS).convert("RGBA").save(
        PLAY_ASSETS / "app-icon-512.png", optimize=True
    )

    feature = Image.open(FEATURE_MASTER_PATH).convert("RGB")
    feature.resize((1024, 500), Image.Resampling.LANCZOS).save(
        PLAY_ASSETS / "feature-graphic.png", optimize=True
    )


if __name__ == "__main__":
    main()
