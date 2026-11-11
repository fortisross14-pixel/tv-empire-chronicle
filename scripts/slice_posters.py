"""Cut ChatGPT poster sheets into game assets.

Usage: python3 scripts/slice_posters.py
  Reads   art/posters/sheets/<file> for every sheet in art/posters/manifest.json
  Writes  public/posters/<group>/<id>.webp   (384x256, the sheet's own cell size)
          public/posters/manifest.json       (which assets exist + each frame's window)

Assets stay at the sheet's cell resolution so they are sharp at every size the game
shows them. Frames are cropped to their own edges and measured: the transparent
window in the middle is where the poster picture and title go.
Requires Pillow with WebP (pip install pillow). Missing sheets are skipped.
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
# A frame pixel counts as "solid" above this alpha when finding its window.
SOLID = 140
QUALITY = 86


def frame_window(tile: Image.Image) -> list:
    """Fractions [left, top, right, bottom] of the clear window around the centre."""
    a = tile.getchannel('A')
    w, h = tile.size
    cx, cy = w // 2, h // 2

    def first_solid(points):
        for i, (x, y) in enumerate(points):
            if a.getpixel((x, y)) > SOLID:
                return i
        return len(points)

    # Look along three lines near the centre and take the middle value, so one
    # decoration (a starburst, a knob) doesn't shrink the whole window.
    lefts, rights, tops, bottoms = [], [], [], []
    for dy in (-h // 6, 0, h // 6):
        y = cy + dy
        lefts.append(cx - first_solid([(x, y) for x in range(cx, -1, -1)]))
        rights.append(cx + first_solid([(x, y) for x in range(cx, w)]))
    for dx in (-w // 6, 0, w // 6):
        x = cx + dx
        tops.append(cy - first_solid([(x, y) for y in range(cy, -1, -1)]))
        bottoms.append(cy + first_solid([(x, y) for y in range(cy, h)]))
    pad = 0.012
    mid = lambda xs: sorted(xs)[1]
    return [round(mid(lefts) / w + pad, 3), round(mid(tops) / h + pad, 3),
            round(1 - mid(rights) / w + pad, 3), round(1 - mid(bottoms) / h + pad, 3)]


def main() -> int:
    spec = json.load(open(MANIFEST))
    cell = spec['cell']
    cols, rows = cell['cols'], cell['rows']
    out_size = (cell['outWidth'], cell['outHeight'])
    made, windows = {}, {}
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
            tile = img.crop(box)
            if sheet['group'] == 'frames':
                # Frames fill the whole poster: crop to the drawn edges.
                bbox = tile.getchannel('A').point(lambda v: 255 if v > HAZE else 0).getbbox()
                if bbox:
                    tile = tile.crop(bbox)
            tile = tile.resize(out_size, Image.LANCZOS)
            if not sheet['transparent']:
                bg = Image.new('RGBA', out_size, (0, 0, 0, 255))
                tile = Image.alpha_composite(bg, tile).convert('RGB')
            if sheet['group'] == 'frames':
                windows[asset_id] = frame_window(tile)
            tile.save(os.path.join(group_dir, f'{asset_id}.webp'), 'WEBP', quality=QUALITY, method=6)
            made.setdefault(sheet['group'], []).append(asset_id)
        print(f"cut   {sheet['file']}: {len(sheet['items'])} assets")
    os.makedirs(OUT, exist_ok=True)
    json.dump({'assets': made, 'frameWindows': windows}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print(f"done  {sum(len(v) for v in made.values())} assets -> public/posters/")
    return 0


if __name__ == '__main__':
    sys.exit(main())
