Clarity / design direction
Lamp
Leaf
Your whole app lives
in seven shades.
The colours aren't wrong. The distance between them is. Every surface in Clarity — sidebar, canvas, card, border — sits inside a seven-point band at the very top of the lightness scale. Your eye has nothing to anchor on, so it keeps hunting. Ten minutes in, that reads as pain.

Clarity today
L* 91 → 98   spread of 7
What a readable ramp looks like
L* 12 → 98   spread of 86
What's actually happening

Three findings
No dark anchor
There is no dark element anywhere in Clarity. A large field of warm, slightly saturated cream at 95% lightness behaves like a soft glare source — your eye keeps trying to white-balance against it and never settles. Counterintuitively, pure white would strain less, because it has no chroma to fight.

You opened this app at 22:25. That's the strongest signal in all five screenshots. A night-first palette isn't a nice-to-have for Clarity; it's the primary one.

One accent, seven jobs
logo
active nav
Add Task
today's date
progress bar
84%
section dots
Your terracotta marks the primary action and marks Tuesday. When one saturated colour means both "press this" and "you are here" and "this is a number", it stops carrying meaning and becomes texture. Give it exactly one job — primary action and current selection — and hand every other job to a neutral or a second hue.

The palette isn't yours
This is the part Gemini won't tell you. Warm cream near #F4F1EA, a high-contrast serif display, and a clay accent near #D97757 is the single most common look AI models generate right now. Ask any model for a "minimalist, warm, premium" UI and you get this within a few percent.

So it's not that your execution is off — it's that you're looking at the house style, and some part of you recognises it. Unique won't come from nudging the hue. It comes from picking a world the app actually belongs to.

The proposal

A ledger, not a mood board
Clarity is a diary, a ledger and a calendar. That's a bahi khata — the bound account book: cloth spine, ruled leaves, blue-black ink, a vermilion rule down the margin, figures in a column that line up. Sharp edges, not 16px corners. Rules, not drop shadows. Tabular numerals that stack.

Two palettes, one identity. Lamp is the default because that's when you use it. Leaf is for daylight. The toggle at the top of this page is live — the whole page is built in these tokens, so you're reading the proposal in the proposal.

ground
#121519
App shell. Blue-black, never warm-black.
leaf
#1A1E24
The writing surface. Sits on ground.
raised
#232830
Hover, selection, active row.
rule
#2F353E
Every border. Replaces all shadows.
ink
#E6E3D8
Body text. Faint paper warmth.
ink-soft
#98A0AA
Labels, secondary, metadata.
vermilion
#E2604F
Primary action and current selection. Nothing else.
indigo
#7FA5CE
Links, info, diary mood accent.
moss
#8FB070
Done, under budget, streak alive.
brass
#D6A63F
Approaching a cap, due soon.
Daylight values: ground #E3E0D6, leaf #F2F0E8, raised #FBFAF5, rule #C8C3B4, ink #1B1F24, ink-soft #5A6169, vermilion #B3322B, indigo #2F4A6B, moss #4F6B3F, brass #8A6210. Note the ground is a full six points darker than your current canvas — paper, not a lightbox.

Type

Two families, three jobs
Your current serif reads as Playfair, which carries the same problem as the cream — it's the default display face of every generated interface. Newsreader has the same warmth with optical sizing and far less baggage. Plex Sans and Plex Mono were drawn for technical and institutional work, which is exactly what a ledger is.

Newsreader
September, and the rain finally stopped.
Diary body and dates only. Serif is for reading, never for UI chrome.

Plex Sans
Log expense  ·  Set a reminder  ·  Board settings
All interface text. Sentence case — drop the tracked-out capitals on MONTHLY BUDGET ALLOCATION and friends; they slow reading and they're another generated-UI tell.

Plex Mono
₹1,240.00   ₹96.50   ₹20,000.00
Figures only, with font-variant-numeric: tabular-nums so columns align. Right now mono is on labels too, which dilutes it.

Applied

Expenses, reworked
Your current screen shows ₹0.00 four times in four identical cards. Four nulls dressed as four insights. The rework has one number, a budget track you can read at a glance, and an empty state that asks for something instead of reporting a failure.

today
Expenses & Ledger
SEPTEMBER 2026 · SPENDING TRACKING
MONTH TOTAL
₹0.00
0 entries in Sep 2026
TODAY'S SPENDING
₹0.00
No expenses yet today
DAILY AVERAGE
₹0.00
Paced across 20 days
proposed
Ledger
Sep 2026
₹7,540 of ₹20,000
₹377/day
day 20 of 30
Chai, canteen
₹30
Metro card top-up
₹200
PG rent
₹6,500
Nothing logged today. Add the first one
The vermilion tick on the track is where your spend should be on day 20. Green bar behind it means you're under pace. One glance, no arithmetic. That single line replaces all three cards.

Why tabs feel flat

Give each section its own rhythm
Calendar, Expenses and Projects are architecturally identical right now: sidebar, serif title, subtitle, row of cards. Switching tabs doesn't feel like going anywhere, which is the real source of "it isn't dynamic". Same tokens everywhere — but let density and structure change per section.

Section	Archetype	What changes
Calendar	Dense grid	Cells half their current height. Year view as a 365-cell heat grid — you already have /api/calendar/year/{year} and it's the best hero in the app.
Diary	Single column	No cards at all. Serif body, ~66 characters, wide margins, the mood row shrunk to small ink marks. It should feel like a page, not a form.
Expenses	Ruled ledger	Tabular figures, thin rules, no rounded corners, running balance down the right edge.
Tasks	Tight list	28px rows, no card per task, strikethrough on done instead of a status pill.
Projects	Board	Columns sized to content, not to the viewport. Empty columns collapse instead of holding 600px of nothing.
The one memorable thing

You already invented it
Bottom-left of your sidebar, at about 11px, ignored: Notebook Vol. I — 168 of 200 pages — 84%. That is the most charming idea in the entire app and it's the only thing in five screenshots that isn't a generic productivity pattern. A diary that fills up, gets bound, and starts a Volume II.

Notebook Vol. I
168 / 200 pages · 32 left
Each diary entry is a page. Fill 200 and the volume closes — you get a spread showing the months it covered, your most-used mood, total words — and Vol. II opens. Expenses and tasks stay ordinary; only the diary gets this.

Spend your boldness here and keep everything else disciplined. One memorable idea, executed properly, beats five clever ones competing for attention — which is what makes an app feel designed rather than decorated.

Tailwind 4

Drop-in tokens
You're on Tailwind 4, so this is CSS-first. Put the semantic variables in :root, swap them on a data-theme attribute, then expose them to Tailwind with @theme inline so bg-leaf, text-ink-soft and border-rule all work.

/* app.css */
@import "tailwindcss";

:root {
  /* lamp — default */
  --c-ground: #121519;   --c-leaf:     #1A1E24;
  --c-raised: #232830;   --c-rule:     #2F353E;
  --c-ink:    #E6E3D8;   --c-ink-soft: #98A0AA;
  --c-ink-faint: #646C76;
  --c-vermilion: #E2604F; --c-indigo: #7FA5CE;
  --c-moss:  #8FB070;   --c-brass:  #D6A63F;
}

[data-theme="leaf"] {
  --c-ground: #E3E0D6;   --c-leaf:     #F2F0E8;
  --c-raised: #FBFAF5;   --c-rule:     #C8C3B4;
  --c-ink:    #1B1F24;   --c-ink-soft: #5A6169;
  --c-ink-faint: #8C939B;
  --c-vermilion: #B3322B; --c-indigo: #2F4A6B;
  --c-moss:  #4F6B3F;   --c-brass:  #8A6210;
}

@theme inline {
  --color-ground:    var(--c-ground);
  --color-leaf:      var(--c-leaf);
  --color-raised:    var(--c-raised);
  --color-rule:      var(--c-rule);
  --color-ink:       var(--c-ink);
  --color-ink-soft:  var(--c-ink-soft);
  --color-ink-faint: var(--c-ink-faint);
  --color-vermilion: var(--c-vermilion);
  --color-indigo:    var(--c-indigo);
  --color-moss:      var(--c-moss);
  --color-brass:     var(--c-brass);

  --font-sans:  "IBM Plex Sans", system-ui, sans-serif;
  --font-serif: "Newsreader", Georgia, serif;
  --font-mono:  "IBM Plex Mono", ui-monospace, monospace;

  /* ledgers don't have rounded corners */
  --radius-sm: 0px;  --radius-md: 2px;  --radius-lg: 2px;
}
Tauri can read the OS theme — getCurrentWindow().theme() plus onThemeChanged — so Clarity can follow your system and still let you force Lamp at night. Migration order that'll show results fastest: tokens and the data-theme swap, then kill every box-shadow in favour of a 1px rule, then drop border-radius, then rebuild Expenses as the pilot screen. One screen proves the direction before you touch the other four.

One direction, not the only one. Take the diagnosis as read and the palette as a starting argument.