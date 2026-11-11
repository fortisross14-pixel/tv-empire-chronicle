# Poster art brief (for ChatGPT image generation)

The poster editor builds each show's poster from stacked layers:

```
1. Background colour or sky   (generated in code — no image needed)
2. Background scene           (PNG, full canvas, may be opaque)
3. Front image(s)             (PNG, transparent background)
4. Effects                    (PNG, transparent background)
5. Frame                      (PNG, transparent centre)
6. Title text                 (rendered in code: 10 fonts, position, rotation, colour, size)
```

## Sizes and format (all layers)

- **Canvas: 1024 × 1536 px (2:3 portrait).** Ask for this size every time; it is one of
  ChatGPT's native sizes, and posters are 2:3.
- Every layer uses the **full canvas**, so layers stack without lining anything up.
- **Transparent background** for fronts, effects and frames ("transparent background"
  in the prompt). Backgrounds may be opaque.
- **Safe zones:**
  - top 22% kept clear for a title
  - nothing important in the outer 6% (frames sit there)
  - the 16:9 billboard crop uses the band from 25% to 81% of the height, so keep the
    main action there
- **Front images:** subject stands on an invisible ground line at about 82% of the
  height and fills about 55–70% of the width. Keep this the same for all fronts so
  they combine.
- Delivery: PNG files named exactly as in the lists below (e.g. `bg-castle.png`),
  dropped into `art/posters/raw/<group>/`. I convert them to 600 × 900 WebP for the game.

## Shared style prompt (start every request with this)

> Cartoon illustration in the style of a classic 1960s–80s movie poster crossed with a
> vintage TV-guide magazine cover. Bold clean ink outlines, slightly exaggerated
> friendly characters, flat colour with soft painted shading and a little halftone
> texture, warm saturated palette. No text, no letters, no logos, no watermark.
> Portrait 1024×1536.

Then add the layer line, for example:

- **Backgrounds:** "Full scene background, no people, soft depth, centre slightly
  empty for characters: …"
- **Fronts:** "Transparent background. Characters only, standing on a ground line at
  82% of the height, centred, no scenery: …"
- **Effects:** "Transparent background. Only the effect, spread over the canvas,
  centre mostly clear: …"
- **Frames:** "Transparent background with an empty transparent centre. Only the
  frame around the edges: …"

Tip: generate a few, pick the best, then ask ChatGPT to "keep exactly the same style"
for the next ones in the same chat, so the whole set stays consistent.

## The list (110 pieces)

### Frames — 10 (`art/posters/raw/frames/`)
| File | Description |
|---|---|
| frame-classic.png | thin cream border with a fine inner line |
| frame-gold.png | ornate gold award-season frame |
| frame-tvguide.png | vintage TV-guide magazine cover: masthead band at top, corner price tag shape (no text) |
| frame-filmstrip.png | film strip down both sides |
| frame-tvset.png | retro wooden TV set bezel with knobs at the bottom |
| frame-polaroid.png | instant-photo frame, thicker bottom |
| frame-neon.png | glowing neon tube border |
| frame-marquee.png | cinema marquee light bulbs around the edge |
| frame-torn.png | torn paper edges |
| frame-comic.png | comic-book panel border with a halftone corner |

### Background scenes — 30 (`art/posters/raw/backgrounds/`)
| File | Scene | Fits |
|---|---|---|
| bg-castle.png | medieval castle on a hill | medieval, history |
| bg-beach.png | tropical beach with palms | survival, travel, dating |
| bg-city-night.png | city skyline at night | crime, police, news, late show |
| bg-city-day.png | busy city street | local life, business, sitcom |
| bg-kitchen.png | restaurant kitchen | cooking |
| bg-studio.png | TV studio with stage lights | talk, contest, late show |
| bg-newsroom.png | news desk with monitors | news |
| bg-gameshow.png | game-show set with lights and podiums | contest, trivia |
| bg-stadium.png | sports stadium under lights | sports |
| bg-dojo.png | martial-arts dojo | martial arts |
| bg-hospital.png | hospital corridor | medical |
| bg-precinct.png | police station / alley with blue lights | police, true crime |
| bg-school.png | high-school hallway with lockers | high school |
| bg-office.png | open-plan office | workplace, business |
| bg-livingroom.png | cosy family living room | family, sitcom |
| bg-suburb.png | suburban houses and lawns | family, home makeover |
| bg-island.png | jungle island with waterfall | survival, reality |
| bg-desert.png | desert canyon at sunset | survival, history, western films |
| bg-mountains.png | snowy mountains | travel, nature, survival |
| bg-underwater.png | coral reef under the sea | nature, documentary |
| bg-forest.png | deep green forest | nature, fantasy |
| bg-space.png | outer space with a planet | sci-fi |
| bg-spaceship.png | spaceship bridge interior | sci-fi |
| bg-haunted.png | spooky mansion on a stormy night | true crime, mystery films |
| bg-courtroom.png | courtroom | politics, true crime |
| bg-capitol.png | government building with flags | politics, political news |
| bg-concert.png | concert stage with crowd | music |
| bg-runway.png | fashion runway with flashes | fashion, celebrity |
| bg-snowtown.png | snowy village with holiday lights | holidays, family, romance |
| bg-ruins.png | ancient ruins / museum hall | history, documentary |

### Front images — 60 (`art/posters/raw/fronts/`)
| File | Subject | Fits |
|---|---|---|
| front-kiss-silhouette.png | couple kissing, black silhouette | romance, dating |
| front-kiss-color.png | couple kissing, full colour | romance, dating |
| front-couple-hands.png | couple holding hands, walking | romance, dating, travel |
| front-rose.png | single red rose | romance, dating |
| front-fighters.png | two fighters mid-kick facing off | martial arts, reality |
| front-boxer.png | boxer with gloves up | sports, martial arts |
| front-ninja.png | ninja leaping | martial arts |
| front-karate-kid.png | kid in karate pose | martial arts, family |
| front-chef-pan.png | chef flipping a pan with flames | cooking |
| front-dishes.png | three plated gourmet dishes | cooking |
| front-cake.png | tall decorated cake | cooking, family |
| front-chefs-duel.png | two chefs facing off with knives | cooking contest |
| front-anchor.png | news anchor at a desk | news |
| front-weather.png | weather presenter pointing at a map | weather |
| front-reporter.png | field reporter with microphone | news, crime beat |
| front-microphone.png | retro studio microphone | talk, music, news |
| front-talk-couch.png | host and guest on a couch | talk |
| front-late-host.png | late-show host at desk with mug | late show |
| front-quiz-host.png | game-show host with cue cards | contest, trivia |
| front-buzzers.png | contestants slamming buzzers | contest, trivia |
| front-trophy.png | big golden trophy | contest, sports |
| front-money.png | shower of cash and a prize cheque | contest, business |
| front-castaways.png | group of castaways in torn clothes | survival, reality |
| front-campfire.png | people around a campfire | survival, reality |
| front-date-bench.png | two people on a date bench | dating, reality |
| front-doctor.png | doctor with stethoscope | medical |
| front-medical-team.png | surgeon, nurse and doctor team | medical |
| front-detective.png | detective with magnifying glass | police, true crime |
| front-cops.png | two cops by a squad car | police |
| front-crime-tape.png | crime-scene tape and evidence | true crime, crime beat |
| front-family-sofa.png | family of four on a sofa | family, sitcom |
| front-coworkers.png | office coworkers group shot | workplace |
| front-roommates.png | three roommates laughing | sitcom, family |
| front-astronaut.png | astronaut floating | sci-fi |
| front-robot.png | friendly giant robot | sci-fi, animation |
| front-rocket.png | rocket launching | sci-fi |
| front-alien.png | cartoon alien | sci-fi, animation |
| front-knight.png | knight with raised sword | medieval |
| front-queen.png | queen on a throne with crown | medieval, history |
| front-dragon.png | dragon breathing fire | medieval, fantasy |
| front-lion.png | lion roaring | nature |
| front-owl.png | owl on a branch | nature |
| front-explorer.png | explorer with binoculars | documentary, travel |
| front-singer.png | singer at a stand mic | music, contest |
| front-band.png | rock band of three | music |
| front-dj.png | DJ at turntables | music |
| front-football.png | football player charging | sports |
| front-soccer.png | soccer player kicking | sports |
| front-basketball.png | basketball player dunking | sports |
| front-model.png | fashion model posing | fashion |
| front-red-carpet.png | star waving on the red carpet | celebrity |
| front-dog-cat.png | dog and cat together | pets |
| front-builder.png | builder with hammer and plans | home makeover |
| front-house.png | dream house with a big bow | home makeover |
| front-briefcase.png | businessperson with briefcase | business |
| front-handshake.png | two businesspeople shaking hands | business, politics |
| front-politician.png | politician at a podium | politics |
| front-pharaoh.png | pharaoh statue / explorer with torch | history |
| front-students.png | students with backpacks | high school |
| front-camera.png | vintage TV camera on a tripod | any (behind the scenes) |

### Effects — 10 (`art/posters/raw/effects/`)
| File | Effect |
|---|---|
| fx-spotlights.png | crossing stage spotlights from below |
| fx-notes.png | floating music notes |
| fx-sparkles.png | sparkles and stars |
| fx-confetti.png | falling confetti |
| fx-rain.png | rain streaks |
| fx-fog.png | low fog / smoke |
| fx-sparks.png | fire sparks and embers |
| fx-flare.png | bright light burst behind the centre |
| fx-hearts.png | floating hearts |
| fx-lightning.png | lightning bolts |

## Fonts (done in code, no images)

About 10 Google fonts grouped by mood: blocky action, elegant drama, fun comedy, news,
retro script, horror, sci-fi, western, handwritten, classic serif.
