# Poster art

Show posters are **96 × 64 px landscape tiles (3:2)**, built from stacked layers:

1. Background colour or sky — generated in code
2. Background scene — art
3. Front image(s) — art, transparent
4. Effects — art, transparent
5. Frame — art, transparent centre
6. Title text — code (fonts, position, rotation, colour, size)

Every art layer is a full 96 × 64 tile, so layers stack without lining anything up.

**How the art is made:** ChatGPT draws 8 sprite sheets of 16 assets each
(4 × 4 grid on 1536 × 1024, every cell 384 × 256 = 4 × the final tile).
`scripts/slice_posters.py` cuts each cell and shrinks it to 96 × 64.

- The list of all 128 assets, in sheet order: `art/posters/manifest.json`
- The prompt to paste into ChatGPT: `docs/CHATGPT_POSTER_PROMPT.md`
- Put finished sheets in `art/posters/sheets/`; the cut tiles go to `public/posters/`.
