import json, os
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = json.load(open('art/posters/manifest.json'))

# id -> (stand-in emoji, tags). Tags are topic ids and format ids from the game data.
META = {
 # backgrounds
 'bg-castle': ('🏰', 'medieval history movie series'), 'bg-beach': ('🏖️', 'survival travel dating reality'),
 'bg-city-night': ('🌃', 'crime-beat police late-show local-news news true-crime'), 'bg-city-day': ('🏙️', 'local-life business sitcom local-news'),
 'bg-kitchen': ('🍳', 'cooking'), 'bg-studio': ('🎬', 'talk contest late-show celebrity music'),
 'bg-newsroom': ('📰', 'news local-news political-news business-news sports-news weather crime-beat'),
 'bg-gameshow': ('🎰', 'contest trivia'), 'bg-stadium': ('🏟️', 'sports sports-news'), 'bg-dojo': ('🥋', 'martial-arts'),
 'bg-hospital': ('🏥', 'medical wellness'), 'bg-precinct': ('🚨', 'police crime-beat true-crime'), 'bg-school': ('🏫', 'teen'),
 'bg-office': ('🏢', 'workplace business business-news'), 'bg-livingroom': ('🛋️', 'family sitcom talk'),
 'bg-suburb': ('🏡', 'family home'), 'bg-island': ('🏝️', 'survival reality nature'), 'bg-desert': ('🏜️', 'survival history movie'),
 'bg-mountains': ('🏔️', 'travel nature survival'), 'bg-underwater': ('🐠', 'nature documentary'), 'bg-forest': ('🌲', 'nature documentary'),
 'bg-space': ('🪐', 'scifi'), 'bg-spaceship': ('🛸', 'scifi animation'), 'bg-haunted': ('🏚️', 'true-crime movie'),
 'bg-courtroom': ('⚖️', 'politics true-crime political-news'), 'bg-capitol': ('🏛️', 'politics political-news'),
 'bg-concert': ('🎤', 'music'), 'bg-runway': ('👠', 'fashion celebrity'), 'bg-snowtown': ('🏘️', 'family romance movie'),
 'bg-ruins': ('🗿', 'history documentary travel'), 'bg-farm': ('🚜', 'family local-life pets'), 'bg-oldtown': ('🏮', 'romance travel dating'),
 # fronts
 'front-kiss-silhouette': ('💏', 'romance dating movie'), 'front-kiss-color': ('💏', 'romance dating series'),
 'front-couple-hands': ('👫', 'romance dating travel'), 'front-rose': ('🌹', 'romance dating'),
 'front-fighters': ('🤼', 'martial-arts reality'), 'front-boxer': ('🥊', 'sports martial-arts'), 'front-ninja': ('🥷', 'martial-arts movie'),
 'front-karate-kid': ('🥋', 'martial-arts family'), 'front-chef-pan': ('👨‍🍳', 'cooking'), 'front-dishes': ('🍱', 'cooking'),
 'front-cake': ('🎂', 'cooking family'), 'front-chefs-duel': ('🔪', 'cooking contest'), 'front-anchor': ('🧑‍💼', 'news local-news political-news business-news'),
 'front-weather': ('🌦️', 'weather news'), 'front-reporter': ('🎙️', 'news crime-beat local-news sports-news'), 'front-microphone': ('🎙️', 'talk music news'),
 'front-talk-couch': ('🛋️', 'talk celebrity'), 'front-late-host': ('☕', 'late-show talk'), 'front-quiz-host': ('🎤', 'contest trivia'),
 'front-buzzers': ('🔔', 'contest trivia'), 'front-trophy': ('🏆', 'contest sports'), 'front-money': ('💰', 'contest business'),
 'front-castaways': ('🧑‍🤝‍🧑', 'survival reality'), 'front-campfire': ('🔥', 'survival reality'), 'front-date-bench': ('💑', 'dating reality'),
 'front-doctor': ('🧑‍⚕️', 'medical wellness'), 'front-medical-team': ('🩺', 'medical'), 'front-detective': ('🕵️', 'police true-crime crime-beat'),
 'front-cops': ('👮', 'police crime-beat'), 'front-crime-tape': ('🚧', 'true-crime crime-beat'), 'front-family-sofa': ('👨‍👩‍👧‍👦', 'family sitcom'),
 'front-coworkers': ('👔', 'workplace business'), 'front-roommates': ('😂', 'sitcom family teen'), 'front-astronaut': ('👨‍🚀', 'scifi'),
 'front-robot': ('🤖', 'scifi animation'), 'front-rocket': ('🚀', 'scifi'), 'front-alien': ('👽', 'scifi animation'),
 'front-knight': ('🛡️', 'medieval'), 'front-queen': ('👑', 'medieval history'), 'front-dragon': ('🐉', 'medieval animation'),
 'front-lion': ('🦁', 'nature documentary'), 'front-owl': ('🦉', 'nature documentary'), 'front-explorer': ('🧭', 'documentary travel nature history'),
 'front-singer': ('🎤', 'music contest'), 'front-band': ('🎸', 'music'), 'front-dj': ('🎧', 'music'), 'front-football': ('🏈', 'sports sports-news'),
 'front-soccer': ('⚽', 'sports sports-news'), 'front-basketball': ('🏀', 'sports'), 'front-model': ('💃', 'fashion celebrity'),
 'front-red-carpet': ('⭐', 'celebrity fashion'), 'front-dog-cat': ('🐶', 'pets family'), 'front-builder': ('🔨', 'home'),
 'front-house': ('🏠', 'home'), 'front-briefcase': ('💼', 'business business-news workplace'), 'front-handshake': ('🤝', 'business politics'),
 'front-politician': ('🗳️', 'politics political-news'), 'front-pharaoh': ('🏺', 'history documentary'), 'front-students': ('🎒', 'teen'),
 'front-camera': ('🎥', 'magazine documentary local-life'), 'front-cowboy': ('🤠', 'history movie'), 'front-superhero': ('🦸', 'scifi animation movie'),
 'front-zombie': ('🧟', 'movie scifi'), 'front-judges': ('🧑‍⚖️', 'contest music fashion'),
 # effects
 'fx-spotlights': ('🔦', 'talk contest late-show music'), 'fx-notes': ('🎵', 'music'), 'fx-sparkles': ('✨', 'celebrity fashion'),
 'fx-confetti': ('🎉', 'contest'), 'fx-rain': ('🌧️', 'true-crime police'), 'fx-fog': ('🌫️', 'true-crime medieval'),
 'fx-sparks': ('🔥', 'cooking martial-arts'), 'fx-flare': ('💥', 'series movie'), 'fx-hearts': ('💖', 'romance dating'),
 'fx-lightning': ('⚡', 'scifi'), 'fx-snow': ('❄️', 'family'), 'fx-bubbles': ('🫧', 'nature'), 'fx-speedlines': ('💨', 'sports animation'),
 'fx-explosion': ('💥', 'movie scifi'), 'fx-money': ('💵', 'business contest'), 'fx-stars': ('🌠', 'scifi celebrity'),
 # icons (shown as stickers)
 'icon-basketball': ('🏀', 'sports'), 'icon-football': ('🏈', 'sports'), 'icon-soccer': ('⚽', 'sports'), 'icon-tennis': ('🎾', 'sports'),
 'icon-baseball': ('⚾', 'sports'), 'icon-golf': ('⛳', 'sports'), 'icon-volleyball': ('🏐', 'sports'), 'icon-hockey': ('🏒', 'sports'),
 'icon-glove': ('🥊', 'sports martial-arts'), 'icon-flag': ('🏁', 'sports'), 'icon-medal': ('🏅', 'sports contest'), 'icon-stopwatch': ('⏱️', 'sports contest'),
 'icon-dice': ('🎲', 'contest trivia'), 'icon-cards': ('🃏', 'contest'), 'icon-chess': ('♟️', 'trivia'), 'icon-bowling': ('🎳', 'sports'),
 'icon-pizza': ('🍕', 'cooking'), 'icon-burger': ('🍔', 'cooking'), 'icon-cupcake': ('🧁', 'cooking'), 'icon-coffee': ('☕', 'talk late-show'),
 'icon-guitar': ('🎸', 'music'), 'icon-note': ('🎵', 'music'), 'icon-mic': ('🎤', 'music talk'), 'icon-clapper': ('🎬', 'movie series'),
 'icon-popcorn': ('🍿', 'movie'), 'icon-reel': ('🎞️', 'movie documentary'), 'icon-star': ('⭐', 'celebrity'), 'icon-heart': ('❤️', 'romance dating'),
 'icon-moneybag': ('💰', 'business contest'), 'icon-crown': ('👑', 'medieval celebrity'), 'icon-bolt': ('⚡', 'scifi sports'), 'icon-bulb': ('💡', 'trivia magazine'),
}
groups = {}
for sh in spec['sheets']:
    for aid, desc in sh['items']:
        groups.setdefault(sh['group'], []).append((aid, desc))
missing = [a for g in groups.values() for a, _ in g if a not in META and not a.startswith('frame-')]
assert not missing, missing

def label(desc):
    return desc[0].upper() + desc[1:]

out = ["// Generated from art/posters/manifest.json by the poster tooling. Edit the manifest, not this file.",
       "export interface PosterAsset { id: string; label: string; emoji: string; tags: string[] }", ""]
for g, key in [('backgrounds', 'SCENES'), ('fronts', 'FRONTS'), ('effects', 'EFFECTS'), ('icons', 'ICONS')]:
    out.append(f"export const {key}: PosterAsset[] = [")
    for aid, desc in groups[g]:
        e, tags = META[aid]
        out.append(f"  {{ id: {json.dumps(aid, ensure_ascii=False)}, label: {json.dumps(label(desc), ensure_ascii=False)}, emoji: {json.dumps(e, ensure_ascii=False)}, tags: {json.dumps(tags.split())} }},")
    out.append("];\n")
out.append("export const FRAMES: { id: string; label: string }[] = [")
for aid, desc in groups['frames']:
    out.append(f"  {{ id: {json.dumps(aid, ensure_ascii=False)}, label: {json.dumps(label(desc), ensure_ascii=False)} }},")
out.append("];\n")
os.makedirs('src/ui/posters', exist_ok=True)
open('src/ui/posters/assets.gen.ts', 'w').write("\n".join(out))
print({g: len(v) for g, v in groups.items()})
