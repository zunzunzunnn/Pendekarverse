# Gimmy 0.3.0 — implementation and verification

1 October 2026.

## Delivered

- Supplied Play, Bug Guide, Info, Settings, level, Sleep Chain and Forest card artwork, with transparent padding removed in runtime copies. Original Drive files unchanged.
- Forest card displays a dynamic active label; illustration viewport excludes the original baked Lv.8 condition. No false unlock label is displayed.
- Slackey headings (Apache 2.0), Sniglet Regular body/numbers (SIL OFL 1.1), both served locally with license files.
- New bg-1/map1.png landscape scene; responsive camera/model anchor follows the same background transform. No separately moving tree layer is claimed because the source is flattened.
- Saved points above Sleep Chain; Sleep Meter at bottom. Desktop, portrait and landscape layouts.
- Point thresholds 0/40/100/180/280; immutable run level; level selection and replay; maximum Level 5.
- Countdown 120/90/60/30/30 seconds, success/failure, preparation and resume cues, pause/settings/hidden-tab freeze.
- Four proportional milestones worth 5 each. Fatal impacts take priority over rewards at an equal timestamp. Waking never grants points.
- Separate level configuration, countdown simulation, obstacle director and progress storage modules. Obstacle deadlines are resolved in time order; rendering quality does not change countdown speed.
- Progressive threat intervals, travel speed, active caps, lane rotation, deadline separation, frog exclusivity and staggered leaf pairs on Levels 4–5. Food has a separate schedule.
- Touch tap/drag, keyboard, two-step leaf clearing alternative, drag camera lock, reduced motion.
- v1 save migration retains XP, collected bugs, settings, old best and legacy Rainforest entitlement; computes available levels from points.

## Verification

- TypeScript + Vite production build passed.
- 27 unit tests passed: countdown for five durations, simultaneous fatal damage/checkpoint rules, 30/60 FPS parity, migration, idempotent receipts, thresholds, camera and director rules, plus retained collision/rules tests.
- 100 seeds per level tested with both idle and perfect input (1,000 simulated runs): idle failed, perfect input succeeded. No active-cap violation or overlapping threat deadlines below configured separation. Perfect input is an idealized logic check, not a human usability claim.
- 66 Chrome browser checks passed: real touch feeding, leaf tap/choice, frog distraction, drag camera lock, settings pause/resume, point unlock during a fixed-level session, failure retaining points, reload migration, all five successful countdowns and rewards, maximum level, repeated clean restarts.
- Layout screenshots reviewed at 360×640, 390×844, 844×390 and 1440×900. Checked control visibility, overflow, bottom meter and points above chain. Screenshot artifacts live under ignored tests/*.png.

## Limits and follow-up

No physical-device FPS certification or human success-rate study has been performed. Initial level tuning needs real player feedback. Supplied body texture and closed eyelid expression remain pending as agreed; the real supplied mesh/animations use temporary body colors. Insect/obstacle SVGs remain prototype illustrations. This release uses Forest; other maps, new beds, shop, accounts and monetization are not introduced.

## Source assets

Source folder: https://drive.google.com/drive/folders/1fT7Wp-fwMBoYKAq6GvHsfaF27TZqNZug

Runtime assets in public/gimmy/ui use the selected latest lowercase sleep-chain.png and level.png. UI font ZIPs and original PNGs remain in ignored .tools/improvement-review. Only runtime assets and font licenses are shipped.
