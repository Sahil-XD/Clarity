Sahil, got you — no changes, only suggestions. I read the whole desktop/src Morning UI system. Here's what's actually happening and how to fix it end-to-end.
Why it looks good at first, then hurts eyes
1. Every tab is a different colour. TasksPage.tsx = sage, ExpensesPage.tsx = rose, ProjectsPage.tsx = sky/honey/dusk gradients, CalendarPage.tsx = mixed. Your eye has to re-adapt on every switch. That's the pain.
desktop/src/pages/* + desktop/src/styles.css:81-113 — 5 chassis tints + 5 gradient cards.
2. Too many textures stacked. morning-bg graph paper + morning-chassis double-bevel gradient + morning-core inset shadow + clay-card + notebook-ruled lines. Cozy for 30 sec, noisy for 30 min.
desktop/src/styles.css:56-65, 69-79, 115-122, 332-341
3. Warm-on-warm low contrast. Stone #827A72 / Muted #A39B92 text on Clay #FAF8F5, 11-13px everywhere. At 1am with full brightness this vibrates.
desktop/src/components/Layout.tsx:62-66
4. No night mode. You're up late in parchment #F5F2EC at full blast. You need dim.
5. Same motion everywhere. All pages opacity 0 + y 6, 0.16s. No signature, so it feels template-y, not alive. Aarnav said "slick" about first look — Het/Samina ghosting = no stickiness.
Fix principle: one calm canvas, one accent, dynamic light
Keep paper soul, kill rainbow:
- One chassis everywhere, not per-tab tint. Colour should signal meaning (mood, due, done), not page.
- Max 1 accent at a time: Terracotta #C87467 day, softer #D98A7E night. Everything else monochrome ink.
- Add time-aware theme: Morning / Day / Dusk / Late. Late = true dim paper #1E1B18 + warm text, not pure black.
- You need both light + dark, so build tokens, not hardcoded hex. Move all bg-[#FAF8F5], text-[#24211E] to CSS vars.
End-to-end suggestions, no code yet
0. Get Started / onboarding (doesn't exist now — add it)
App.tsx:11-16 goes straight to AuthPage. Add a 3-screen intro:
Your day, one page. / Write locked. / See time pass. with big Newsreader serif + one animated paper sheet. Skip button. This is what makes people want to use it.
1. Auth / Login AuthPage.tsx
Now: centered elevated card on graph paper. Good, but static.
Do: same card, dim backdrop, slow breathing glow on logo, caps-lock + PIN hint, Good evening, it's 1:12am microcopy. Diary PIN and login PIN should feel like same vault language.
2. Sidebar Layout.tsx:41-155
Now: best part — magnetic glider is nice. But footer Notebook Vol I 84% is fake static data, kills trust.
Do: keep glider, drop fake progress. Replace with real Today: 3 tasks · 1 note live count. Collapse to 72px icon rail option for focus. Night toggle (sun/moon) right next to mute button :48-53.
3. Calendar CalendarPage.tsx
Your CLAUDE.md idea — notes/tasks switch — is right, keep it.
Do: Year heatmap in single ink colour (GitHub-style but terracotta), month = minimal grid, day = timeline with now-line. No chassis colour change per view. morning-today halo styles.css:172-178 is too strong — make it 1px ring only.
4. Diary DiaryPage.tsx:38- lock screen
This should be the most unique screen, currently heaviest (3D tilt + springs + glare + ripples).
Do: invert it — lock = dead calm, pitch dark + single wax seal + 4 dots + physical keyboard only. Unlock = paper fades in, prompt of day in serif italic, mood picks tint the editor background 4% only, not whole app. Add Zen mode: sidebar + topbar fade out, just ruled lines + word count.
5. Tasks TasksPage.tsx:261-285
Now: good density, but progress bar + quick add + pills + list all compete.
Do: one hero: 3 remaining huge serif. Quick add becomes command bar Ctrl+K style. Checkbox pop is good, keep. Overdue = only place that uses red #BE1239, everything else stays calm.
6. Expenses ExpensesPage.tsx:15-80
Biggest clash: 11 pastel category colours vs Morning palette.
Do: keep icons, kill 11 bg colours. All rows monochrome, only amount coloured (sage in / terracotta out). One monthly total hero with thin sparkline. Categories get dot, not full badge.
7. Projects ProjectsPage.tsx:15-30
Kanban TODO sky / IN_PROGRESS honey / DONE sage = 3 gradients side-by-side = visual noise.
Do: single column colour, status = small dot + label. Project colour strip 3px left edge only. Drag with spring, drop with soft thud (you already have sound).
System-wide to feel dynamic + unique:
- Mood glow: diary mood sets --glow var app-wide at 6% opacity. Subtle, personal, changes daily. Unique without rainbow.
- Motion signature: page in 180ms rise, modal spring 320/30, checkbox pop, nothing else. Delete all other animations.
- Typography: Newsreader 28-32px for page titles + dates, Jakarta 13px for UI. Right now both fight at same size.
- Dark tokens draft:
Light: bg #F6F4EF, surface #FAF8F5, ink #24211E, line rgba(60,50,40,0.08)
Late: bg #1C1917, surface #26211E, ink #EDE8E1, line rgba(255,255,255,0.08), accent #D98A7E
- Eye-comfort rules: min 13px body, muted text min #6E6862 light / #A8A29E dark, remove fixed graph-paper background-attachment: fixed, reduce chassis shadow 0 20px 48px → 0 8px 24px.
Tell the team: "v1 was stationery maximalism, v2 is calm paper + late mode, which day feels better?" Ship 2 screenshots (day/late diary) — that's what gets replies, not repo link.
When you want, I can turn this into a step plan: tokens → Layout → Diary → Tasks → rest. Sleep first though, it's late.