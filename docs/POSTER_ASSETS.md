# Poster art

Show posters are **landscape 3:2 tiles**, built from stacked layers:

1. Background — **either** a full scene (art, it has its own sky) **or** a colour,
   gradient or sky drawn in code
2. Front image(s) — art, transparent
3. Effects — art, transparent
4. Frame — art, transparent centre
5. Title text — code (fonts, position, rotation, colour, size)

Every art layer is a full 3:2 tile, so layers stack without lining anything up. Assets are kept at the sheet's own cell size (384 × 256, WebP) so they stay sharp at every size the game shows them; frames are cropped to their edges and their empty window is measured, and the picture and title sit inside that window.

**How the art is made:** ChatGPT draws 8 sprite sheets of 16 assets each
(4 × 4 grid on 1536 × 1024, every cell 384 × 256 = 4 × the final tile).
`scripts/slice_posters.py` cuts each cell into a 384 × 256 WebP.

- The list of all 128 assets, in sheet order: `art/posters/manifest.json`
- The prompt to paste into ChatGPT: `docs/CHATGPT_POSTER_PROMPT.md`
- Put finished sheets in `art/posters/sheets/`; the cut tiles go to `public/posters/`.

## In the game

- Every show gets an **automatic poster** picked from its format and topics (same show,
  same poster). Shows → 🎨 Edit poster opens the editor: Background (scene or colour), Cast (up to 2),
  Effect, Frame and Title (10 fonts, 6 colours, 3 sizes, top / middle / bottom / tilted),
  plus 🎲 Shuffle and "Use automatic".
- Until a tile exists in `public/posters/`, the editor shows a stand-in (emoji or CSS).
  After `python3 scripts/slice_posters.py`, real art replaces stand-ins automatically.
- `scripts/gen_poster_library.py` regenerates `src/ui/posters/assets.gen.ts` (labels,
  stand-in emoji and topic tags) from the manifest.
