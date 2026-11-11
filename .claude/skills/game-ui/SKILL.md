---
name: game-ui
description: UI/UX audit and design checklist for this mobile-first card management game - navigation, hierarchy, game feel, motion, color and accessibility. Use when reviewing or restyling screens. Pair with the frontend-design skill for visual direction.
---

# Game UI audit

For a menu-and-card management game played mostly on phones (Kairosoft-style
loop, Football GM / card-collection presentation). Use together with
`.claude/skills/frontend-design` for aesthetic direction; this file covers the
game-specific parts. Adapted in part from the UX-review skill in Claude Code
Game Studios (github.com/Donchitos/Claude-Code-Game-Studios).

## 1. Navigation and flow
- [ ] The weekly loop (plan → make → air → react) is obvious from any screen; the main action is always one tap away.
- [ ] Every screen answers "what should I do next?" (to-do list, badges, empty states).
- [ ] No more than one modal at a time; modal order is predictable (pack → results → ceremony → event → finished show).
- [ ] Back/close always works; nothing traps the player.
- [ ] Deep screens (schedule picker, wizard) keep context: what slot, what show, what it costs.

## 2. Information hierarchy
- [ ] One primary number per card (grade, OVR, viewers); secondary info is quieter.
- [ ] Cards of the same family look the same everywhere (collection, pack reveal, pickers).
- [ ] Money, reputation and date are always visible.
- [ ] Long lists are scannable: sorting, grouping, or filters where they grow past ~12 items.

## 3. Game feel ("juice")
- [ ] Big moments get one orchestrated reveal: pack flip, ratings reveal, show grade, awards, tier upgrade.
- [ ] Every player action gets immediate feedback (press state, toast, number change).
- [ ] Rarity is felt: legend/epic cards look and animate differently from commons.
- [ ] Numbers that change (cash, viewers) animate or flash so the change is noticed.
- [ ] Routine taps stay fast: no long animations on things the player does every week.

## 4. Visual system
- [ ] Colors, radii, shadows and spacing come from tokens; one accent for the primary action.
- [ ] Color meaning is consistent (good / bad / warning / rarity / format colors) and never the only signal.
- [ ] Type scale with 2 families at most; numbers use the display face.
- [ ] Depth and shading are deliberate: what is on top, what is pressable.
- [ ] Avoid the generic AI-design tells listed in frontend-design.

## 5. Mobile and accessibility
- [ ] Touch targets ≥ 44px; nothing important sits under the thumb-zone floating button.
- [ ] Works at 360px wide with no horizontal page scroll (inner scrollers allowed and visible).
- [ ] Text contrast ≥ 4.5:1 for body, 3:1 for large text.
- [ ] Visible keyboard focus; `prefers-reduced-motion` turns big animations into fades.
- [ ] Safe-area insets respected on notched phones.

## Output
Screenshot each main screen at phone and desktop width, then write
`docs/audits/<date>-ui.md` with findings by severity and before/after shots.
