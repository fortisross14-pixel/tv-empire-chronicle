"""Cut ChatGPT poster sheets into 96x64 game assets.

Usage: python3 scripts/slice_posters.py
  Reads   art/posters/sheets/<file> for every sheet in art/posters/manifest.json
  Writes  public/posters/<group>/<id>.png  (96x64, transparent where the sheet is)
          public/posters/manifest.json     (what the game can use)

Each sheet is a 4x4 grid. Cells are split evenly; each cell is shrunk to the
output size with a high-quality filter, keeping the full cell so layers line up.
Requires Pillow (pip install pillow). Sheets that are missing are skipped.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'art', 'posters', 'manifest.json')
SHEETS = os.path.join(ROOT, 'art', 'posters', 'sheets')
OUT = os.path.join(ROOT, 'public', 'posters')
# Alpha below this counts as haze and is removed on transparent sheets.
HAZE = 60


def main() -> int:
    spec = json.load(open(MANIFEST))
    cell = spec['cell']
    cols, rows = cell['cols'], cell['rows']
    out_size = (cell['outWidth'], cell['outHeight'])
    made = {}
    for sheet in spec['sheets']:
        path = os.path.join(SHEETS, sheet['file'])
        if not os.path.exists(path):
            print(f"skip  {sheet['file']} (not found)")
            continue
        img = Image.open(path).convert('RGBA')
        if sheet['transparent']:
            # ChatGPT often leaves a faint haze or soft shadow; make it fully clear.
            r, g, b, a = img.split()
            img = Image.merge('RGBA', (r, g, b, a.point(lambda v: 0 if v < HAZE else v)))
        w, h = img.size
        cw, ch = w / cols, h / rows
        group_dir = os.path.join(OUT, sheet['group'])
        os.makedirs(group_dir, exist_ok=True)
        for i, (asset_id, _desc) in enumerate(sheet['items']):
            c, r = i % cols, i // cols
            # "inset" trims lines ChatGPT sometimes draws between cells.
            pad = sheet.get('inset', 0)
            box = (round(c * cw) + pad, round(r * ch) + pad, round((c + 1) * cw) - pad, round((r + 1) * ch) - pad)
            tile = img.crop(box).resize(out_size, Image.LANCZOS)
            if not sheet['transparent']:
                bg = Image.new('RGBA', out_size, (0, 0, 0, 255))
                tile = Image.alpha_composite(bg, tile)
            tile.save(os.path.join(group_dir, f'{asset_id}.png'), optimize=True)
            made.setdefault(sheet['group'], []).append(asset_id)
        print(f"cut   {sheet['file']}: {len(sheet['items'])} assets")
    os.makedirs(OUT, exist_ok=True)
    json.dump(made, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print(f"done  {sum(len(v) for v in made.values())} assets -> public/posters/")
    return 0


if __name__ == '__main__':
    sys.exit(main())
