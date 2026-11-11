"""Cut ChatGPT poster sheets into game assets.

Usage: python3 scripts/slice_posters.py [sheet-file ...]   (no files: every sheet)
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
ICON_SIZE = 192
# Cells with fewer solid pixels than this are empty (ChatGPT skipped them).
MIN_PIXELS = 200


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


def gutter_cuts(mask: Image.Image, n: int, axis: int) -> list:
    """Edges of n bands along an axis, cut where the drawing is thinnest near each grid line."""
    w, h = mask.size
    length = w if axis == 0 else h
    other = h if axis == 0 else w
    px = mask.load()
    prof = [sum(px[i, j] if axis == 0 else px[j, i] for j in range(other)) for i in range(length)]
    reach = length // (n * 4)
    cuts = [0]
    for k in range(1, n):
        c = round(length * k / n)
        cuts.append(min(range(c - reach, c + reach), key=lambda i: (prof[i], abs(i - c))))
    return cuts + [length]


def cell_boxes(img: Image.Image, cols: int, rows: int, gutters: bool, pad: int) -> list:
    """Boxes of each cell, left to right, top to bottom."""
    w, h = img.size
    if not gutters:
        cw, ch = w / cols, h / rows
        return [(round(c * cw) + pad, round(r * ch) + pad, round((c + 1) * cw) - pad, round((r + 1) * ch) - pad)
                for r in range(rows) for c in range(cols)]
    # Loose layouts (icon sheets): find the gaps between rows, then between items in each row.
    mask = img.getchannel('A').point(lambda v: 1 if v > HAZE else 0)
    ys = gutter_cuts(mask, rows, 1)
    boxes = []
    for r in range(rows):
        band = mask.crop((0, ys[r], w, ys[r + 1]))
        xs = gutter_cuts(band, cols, 0)
        boxes += [(xs[c], ys[r], xs[c + 1], ys[r + 1]) for c in range(cols)]
    return boxes


def main() -> int:
    spec = json.load(open(MANIFEST))
    cell = spec['cell']
    cols, rows = cell['cols'], cell['rows']
    out_size = (cell['outWidth'], cell['outHeight'])
    made, windows = {}, {}
    only = sys.argv[1:]
    if only:
        # Re-cut just these sheets; keep what the others made last time.
        old = json.load(open(os.path.join(OUT, 'manifest.json')))
        redo = {s['group'] for s in spec['sheets'] if s['file'] in only}
        made = {g: ids for g, ids in old['assets'].items() if g not in redo}
        windows = old['frameWindows'] if 'frames' not in redo else {}
    for sheet in spec['sheets']:
        if only and sheet['group'] not in redo:
            continue
        path = os.path.join(SHEETS, sheet['file'])
        if not os.path.exists(path):
            print(f"skip  {sheet['file']} (not found)")
            continue
        img = Image.open(path).convert('RGBA')
        if sheet['transparent']:
            # ChatGPT often leaves a faint haze or soft shadow; make it fully clear.
            r, g, b, a = img.split()
            img = Image.merge('RGBA', (r, g, b, a.point(lambda v, t=sheet.get('haze', HAZE): 0 if v < t else v)))
        cols_, rows_ = sheet.get('grid', [cols, rows])
        boxes = cell_boxes(img, cols_, rows_, sheet.get('gutters', False), sheet.get('inset', 0))
        group_dir = os.path.join(OUT, sheet['group'])
        os.makedirs(group_dir, exist_ok=True)
        for i, ((asset_id, _desc), box) in enumerate(zip(sheet['items'], boxes)):
            tile = img.crop(box)
            if sheet['group'] == 'frames':
                # Frames fill the whole poster: crop to the drawn edges.
                bbox = tile.getchannel('A').point(lambda v: 255 if v > HAZE else 0).getbbox()
                if bbox:
                    tile = tile.crop(bbox)
            # A few stray pixels are not a drawing: treat the cell as empty.
            if tile.getchannel('A').point(lambda v: 1 if v > HAZE else 0).histogram()[1] < MIN_PIXELS:
                print(f"empty {asset_id} (cell {i + 1}) - skipped, ask ChatGPT for it again")
                continue
            if sheet['group'] == 'effects':
                # Effects cover the poster: crop to the drawing and stretch it across,
                # keeping its shape, at the top, middle or bottom.
                bbox = tile.getchannel('A').point(lambda v: 255 if v > HAZE else 0).getbbox()
                tile = tile.crop(bbox)
                scale = min(out_size[0] / tile.size[0], out_size[1] / tile.size[1])
                fit = tile.resize((max(1, round(tile.size[0] * scale)), max(1, round(tile.size[1] * scale))), Image.LANCZOS)
                canvas = Image.new('RGBA', out_size, (0, 0, 0, 0))
                anchor = sheet.get('anchors', {}).get(asset_id, 'middle')
                y = 0 if anchor == 'top' else out_size[1] - fit.size[1] if anchor == 'bottom' else (out_size[1] - fit.size[1]) // 2
                canvas.paste(fit, ((out_size[0] - fit.size[0]) // 2, y))
                canvas.save(os.path.join(group_dir, f'{asset_id}.webp'), 'WEBP', quality=QUALITY, method=6)
                made.setdefault(sheet['group'], []).append(asset_id)
                continue
            if sheet['group'] == 'icons':
                # Icons are placed one by one: crop to the drawing, centre it on a square.
                bbox = tile.getchannel('A').point(lambda v: 255 if v > HAZE else 0).getbbox()
                if bbox:
                    tile = tile.crop(bbox)
                side = max(tile.size)
                square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
                square.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2))
                tile = square.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
                tile.save(os.path.join(group_dir, f'{asset_id}.webp'), 'WEBP', quality=QUALITY, method=6)
                made.setdefault(sheet['group'], []).append(asset_id)
                continue
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
