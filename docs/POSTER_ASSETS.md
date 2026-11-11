# Poster art

Show posters are **landscape 3:2 tiles**, built from stacked layers:

1. Background — **either** a full scene (art, it has its own sky) **or** a colour,
   gradient or sky drawn in code
2. Front image(s) — art, transparent (up to 2)
3. Icons — art, transparent squares (up to 8; centre, sides, scattered, rows, corners, around; 4 sizes)
4. Effects — art, transparent
5. Frame — art, transparent centre
6. Title text — code (fonts, position, rotation, colour, size)

**The minimum poster is a background plus one cast image or one icon** (a roast chicken on
red is a complete poster). Frame, effect, more icons and a second cast image are optional.
The editor's Save is disabled until that minimum is met, and `setPoster` refuses it too.

Every art layer is a full 3:2 tile, so layers stack without lining anything up. Assets are kept at the sheet's own cell size (384 × 256, WebP) so they stay sharp at every size the game shows them; frames are cropped to their edges and their empty window is measured, and the picture and title sit inside that window.

**How the art is made:** ChatGPT draws 8 sprite sheets of 16 assets each
(4 × 4 grid on 1536 × 1024, every cell 384 × 256 = 4 × the final tile).
`scripts/slice_posters.py` cuts each cell into a 384 × 256 WebP.

- Icon sheets 9–10 are 8 × 8 grids of 64 icons each (any size, transparent); the cutter finds
  the gaps between icons (`"grid": [8, 8], "gutters": true`) and centres each on a 192 × 192 square.
- Cells with almost nothing in them are skipped and reported (re-ask ChatGPT for those).
- Re-cut only some sheets: `python3 scripts/slice_posters.py sheet-9-icons.png sheet-10-icons.png`.
- The list of all assets, in sheet order: `art/posters/manifest.json`
- The prompt to paste into ChatGPT: `docs/CHATGPT_POSTER_PROMPT.md`
- Put finished sheets in `art/posters/sheets/`; the cut tiles go to `public/posters/`.

## In the game

- Every show gets an **automatic poster** picked from its format and topics (same show,
  same poster). Shows → 🎨 Edit poster opens the editor: Background (scene or colour), Cast (up to 2), Icons,
  Effect, Frame and Title (10 fonts, 6 colours, 3 sizes, top / middle / bottom / tilted),
  plus 🎲 Shuffle and "Use automatic".
- Until a tile exists in `public/posters/`, the editor shows a stand-in (emoji or CSS).
  After `python3 scripts/slice_posters.py`, real art replaces stand-ins automatically.
- `scripts/gen_poster_library.py` regenerates `src/ui/posters/assets.gen.ts` (labels,
  stand-in emoji and topic tags) from the manifest.
