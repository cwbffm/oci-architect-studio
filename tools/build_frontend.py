"""Bundle maintained sources into a portable, standalone HTML document."""
from pathlib import Path
import argparse
import json
import unicodedata
from html import escape

ROOT = Path(__file__).resolve().parents[1]


def build():
    source = ROOT / "frontend"
    styles = (source / "styles" / "studio.css").read_text(encoding='utf-8') + "\n" + (source / "styles" / "appearance-13.css").read_text(encoding='utf-8') + "\n" + (source / "styles" / "navigation-shell.css").read_text(encoding='utf-8') + "\n" + (source / "styles" / "builder-guided.css").read_text(encoding='utf-8')
    scripts = (source / "js" / "locale-pt.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "studio.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "locale-review.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "locale-builder.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "region-selector.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "appearance-reading.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "navigation-shell.js").read_text(encoding="utf-8") + "\n" + (source / "js" / "builder-guide.js").read_text(encoding="utf-8")
    template = (source / "index.template.html").read_text(encoding='utf-8')
    region_data = json.loads((source / "data" / "oci-regions.json").read_text(encoding="utf-8"))
    groups = {}
    for region in region_data["regions"]:
        realm = region["realm"]
        group = "Comerciais · OC1" if realm == "oc1" else "Governamentais · " + realm.upper() if realm in ("oc2", "oc3", "oc4") else "Soberanas · União Europeia · OC19" if realm == "oc19" else "Dedicadas e acesso restrito · " + realm.upper()
        groups.setdefault(group, []).append(region)
    scripts = scripts.replace("const OCI_REGION_CATALOG = [];", "const OCI_REGION_CATALOG = " + json.dumps(region_data, ensure_ascii=False).replace("<", "\\u003c") + ";")
    options = []
    for group, regions in groups.items():
        options.append('<optgroup label="' + escape(group, quote=True) + '">')
        for region in sorted(regions, key=lambda row: (unicodedata.normalize("NFKD", row["label"]).encode("ascii", "ignore").decode().casefold(), row["id"])):
            label = region["label"] if region["label"] == region["id"] else region["label"] + " · " + region["id"]
            options.append('<option value="' + escape(region["id"], quote=True) + '">' + escape(label) + '</option>')
        options.append('</optgroup>')
    options.append('<option value="custom">Outra região…</option>')
    template = template.replace("{{OCI_REGION_OPTIONS}}", "".join(options))
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
