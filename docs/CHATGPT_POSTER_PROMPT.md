# ChatGPT prompt for the poster art

Paste everything inside the box below into a new ChatGPT chat (an image-capable model).
It makes Sheet 1; check it, then type **NEXT** for each of the other 7 sheets.

Save each sheet as the file name below and send them to me (or drop them in
`art/posters/sheets/`). I cut them into 96×64 tiles with `scripts/slice_posters.py`.

| Sheet | Save as |
|---|---|
| 1 | `sheet-1-frames.png` |
| 2 | `sheet-2-backgrounds.png` |
| 3 | `sheet-3-backgrounds.png` |
| 4 | `sheet-4-fronts.png` |
| 5 | `sheet-5-fronts.png` |
| 6 | `sheet-6-fronts.png` |
| 7 | `sheet-7-fronts.png` |
| 8 | `sheet-8-effects.png` |

Tips:
- If a sheet comes back with the wrong number of items, or things crossing cells,
  reply "Redo this sheet: exactly 16 items in a 4×4 grid, one per cell, nothing crossing cells."
- If the background isn't transparent on a sheet that should be, reply
  "Same image, transparent background."
- To swap a single item, ask for the whole sheet again with that item changed, so the
  grid stays aligned.

```text
I'm making a cartoon TV-station management game. I need art assets for show posters, delivered as sprite sheets. We'll make 8 sheets, one at a time. Generate Sheet 1 now. After each sheet I'll check it, then type NEXT for the following one. Keep exactly the same art style on every sheet.

STYLE (every sheet): a cartoonish take on classic 1960s–80s movie posters and vintage TV-guide magazine covers. Bold clean outlines, big simple shapes, strong readable silhouettes, flat saturated colours with simple shading, high contrast. Each asset will be shrunk to a tiny 96×64 pixel tile, so avoid fine detail and thin lines. No text, letters, numbers, logos or watermarks anywhere.

SHEET FORMAT (every sheet):
- One image, 1536 × 1024 pixels, landscape.
- A grid of 4 columns × 4 rows = 16 equal cells, each 384 × 256 (landscape 3:2).
- One asset per cell, in the order listed below, row by row from top-left.
- Keep each asset fully inside its own cell with a small empty margin. Nothing crosses into a neighbouring cell.
- No grid lines, borders between cells, labels or numbers.
- Transparent PNG background unless the sheet says otherwise.

SHEET 1 — FRAMES — transparent background. Only the frame around the edges of each cell; the centre of every cell stays empty and transparent.
1. thin cream border with a fine inner line
2. ornate gold award frame
3. vintage TV-guide magazine cover border with a solid masthead band across the top
4. film-strip border with sprocket holes top and bottom
5. retro wooden TV set around the picture, knobs on the right
6. instant-photo frame, thicker bottom edge
7. glowing pink and blue neon tube border
8. cinema marquee light bulbs all around the edge
9. torn paper edges
10. comic-book panel border with a halftone corner
11. old cinema ticket stub with notched corners
12. red theatre curtains drawn open at both sides
13. rough wooden wanted-poster board edge
14. perforated postage-stamp edge
15. corner starburst sticker in the top right, rest of the edge plain
16. shiny chrome retro bezel

SHEET 2 — BACKGROUND SCENES — not transparent. Each cell is a complete scene that fills its whole cell edge to edge (no margin on this sheet). No people.
1. medieval castle on a hill
2. tropical beach with palm trees
3. city skyline at night with lit windows
4. busy city street in daylight
5. restaurant kitchen with pots and steam
6. TV studio stage with lights
7. news desk with screens behind
8. game-show set with podiums and flashing lights
9. sports stadium under floodlights
10. martial-arts dojo with paper walls
11. hospital corridor
12. dark city alley with police lights
13. high-school hallway with lockers
14. open-plan office with desks
15. cosy family living room with a sofa
16. suburban houses and green lawns

SHEET 3 — BACKGROUND SCENES — not transparent. Each cell is a complete scene that fills its whole cell edge to edge (no margin on this sheet). No people.
1. jungle island with a waterfall
2. desert canyon at sunset
3. snowy mountains
4. coral reef under the sea
5. deep green forest
6. outer space with a ringed planet
7. spaceship bridge interior
8. spooky mansion on a stormy night
9. courtroom with a judge's bench
10. government building with flags
11. concert stage with a crowd
12. fashion runway with camera flashes
13. snowy village with holiday lights
14. ancient temple ruins
15. farm with a red barn and fields
16. romantic old-town street with string lights

SHEET 4 — FRONT IMAGES — transparent background. Characters or objects only, no scenery. Each subject stands on the bottom of its cell (feet about 90% down) and fills about two-thirds of the cell height, centred, all at the same scale.
1. couple kissing, solid black silhouette
2. couple kissing, full colour
3. couple holding hands, walking
4. single red rose
5. two fighters mid-kick facing each other
6. boxer with gloves up
7. ninja leaping with a sword
8. kid in a karate pose
9. chef flipping a pan with flames
10. three plated gourmet dishes
11. tall decorated cake
12. two chefs facing off with knives
13. news anchor at a desk
14. weather presenter pointing at a map
15. field reporter with a microphone
16. retro studio microphone

SHEET 5 — FRONT IMAGES — transparent background. Characters or objects only, no scenery. Each subject stands on the bottom of its cell (feet about 90% down) and fills about two-thirds of the cell height, centred, all at the same scale.
1. talk-show host and guest on a couch
2. late-night host at a desk with a mug
3. game-show host holding cue cards
4. two contestants slamming buzzers
5. big golden trophy
6. pile of cash and a giant prize cheque
7. group of castaways in torn clothes
8. three people around a campfire
9. two people on a date on a park bench
10. doctor with a stethoscope
11. surgeon, nurse and doctor team
12. detective with a magnifying glass and trench coat
13. two police officers by a squad car
14. crime-scene tape and an evidence bag
15. family of four on a sofa
16. group of office coworkers

SHEET 6 — FRONT IMAGES — transparent background. Characters or objects only, no scenery. Each subject stands on the bottom of its cell (feet about 90% down) and fills about two-thirds of the cell height, centred, all at the same scale.
1. three roommates laughing
2. astronaut floating
3. friendly giant robot
4. rocket launching
5. cartoon alien waving
6. knight raising a sword
7. queen on a throne with a crown
8. dragon breathing fire
9. lion roaring
10. owl on a branch
11. explorer with binoculars
12. singer at a stand microphone
13. rock band of three with guitars
14. DJ at turntables
15. American football player charging
16. soccer player kicking a ball

SHEET 7 — FRONT IMAGES — transparent background. Characters or objects only, no scenery. Each subject stands on the bottom of its cell (feet about 90% down) and fills about two-thirds of the cell height, centred, all at the same scale.
1. basketball player dunking
2. fashion model posing
3. movie star waving on a red carpet
4. dog and cat sitting together
5. builder with a hammer and plans
6. dream house with a big ribbon bow
7. businessperson with a briefcase
8. two businesspeople shaking hands
9. politician at a podium
10. explorer holding a torch by a pharaoh statue
11. two students with backpacks
12. vintage TV camera on a tripod
13. cowboy with a lasso
14. superhero flying with a cape
15. cartoon zombie shuffling
16. panel of three talent-show judges at a desk

SHEET 8 — EFFECTS — transparent background. Only the effect, spread across the cell; the centre stays mostly clear.
1. two crossing stage spotlights from below
2. floating music notes
3. sparkles and twinkles
4. falling confetti
5. rain streaks
6. low fog along the bottom
7. fire sparks and embers
8. bright light burst behind the centre
9. floating hearts
10. lightning bolts
11. falling snowflakes
12. rising bubbles
13. comic speed lines from the edges
14. cartoon explosion burst
15. falling dollar bills
16. shooting stars
```

## Extra: icon sheets (9 and 10)

Paste this in the same ChatGPT chat after sheet 8. Save them as `sheet-9-icons.png`
and `sheet-10-icons.png`.

```text
Two more sheets in exactly the same style and sheet format as before (1536 × 1024, 4 × 4 grid of 384 × 256 cells, transparent background, no text). These are ICONS: one single object per cell, centred, filling about 80% of the cell height, bold outline, no shadow, no scenery. Generate Sheet 9 now; I'll type NEXT for Sheet 10.

SHEET 9 — ICONS
1. basketball
2. American football
3. soccer ball
4. tennis ball
5. baseball
6. golf ball on a tee
7. volleyball
8. hockey stick and puck
9. red boxing glove
10. checkered racing flag
11. gold medal with ribbon
12. stopwatch
13. pair of dice
14. fan of playing cards
15. chess knight piece
16. bowling pin and ball

SHEET 10 — ICONS
1. pizza slice
2. burger
3. cupcake
4. coffee cup with steam
5. electric guitar
6. music note
7. handheld microphone
8. film clapperboard
9. popcorn bucket
10. film reel
11. gold star
12. red heart
13. money bag
14. gold crown
15. lightning bolt
16. glowing light bulb
```
