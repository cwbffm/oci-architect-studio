"""Bundle maintained sources into a portable, standalone HTML document."""
from pathlib import Path
import argparse
import base64

ROOT = Path(__file__).resolve().parents[1]


def build():
    source = ROOT / "frontend"
    styles = "\n".join((source / "styles" / name).read_text(encoding='utf-8') for name in ("studio.css", "special-previews.css", "premium-backgrounds.css", "special-backgrounds.css"))
    wallpaper = base64.b64encode((source / "assets" / "premium-backgrounds.webp").read_bytes()).decode('ascii')
    styles = styles.replace("{{PREMIUM_WALLPAPERS}}", "data:image/webp;base64," + wallpaper)
    special_wallpaper = base64.b64encode((source / "assets" / "special-backgrounds.webp").read_bytes()).decode('ascii')
    styles = styles.replace("{{SPECIAL_WALLPAPERS}}", "data:image/webp;base64," + special_wallpaper)
    scripts = "\n".join((source / "js" / name).read_text(encoding='utf-8') for name in ("special-themes.js", "studio.js"))
    template = (source / "index.template.html").read_text(encoding='utf-8')
    return template.replace("{{STUDIO_STYLES}}", "<style>" + styles + "</style>").replace("{{STUDIO_SCRIPTS}}", "<script>" + scripts + "</script>")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if index.html is out of date")
    args = parser.parse_args()
    output = build()
    target = ROOT / "index.html"
    if args.check:
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            raise SystemExit("index.html is out of date; run python tools/build_frontend.py")
        print("Frontend bundle is current")
    else:
        target.write_text(output, encoding='utf-8')
        print("Built index.html")
