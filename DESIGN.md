---
name: Cause Compass
description: A field notebook for nonprofits worth caring about.
colors:
  paper: "#f0e6f5"
  paper-deep: "#e1d2eb"
  card: "#ffffff"
  card-hover: "#f1e9f4"
  ink: "#1a0f2c"
  ink-soft: "#3d2d57"
  ink-mute: "#7c6f9a"
  rule: "#d3c0df"
  rule-strong: "#b89cc9"
  accent: "#c8266e"
  accent-soft: "#f9d8e6"
  accent-2: "#5b4b9e"
  category-arts: "#c58f5a"
  category-education: "#5a7a8e"
  category-health: "#8e5c4a"
  category-environment: "#5c7a5e"
  category-global: "#5e5470"
  category-community: "#8e6f4f"
typography:
  display:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(2.4rem, 5vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(1.75rem, 2.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.32em"
    lineHeight: 1
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  card: "20px"
  card-lg: "24px"
  hero: "32px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-ghost-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  input-search:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 56px"
    height: "64px"
  card-paper:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "32px"
  card-loupe:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  card-cardstock:
    backgroundColor: "{colors.category-arts}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card-lg}"
    padding: "24px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Cause Compass

## 1. Overview

**Creative North Star: "The Field Notebook"**

Cause Compass is a quiet personal record of nonprofits worth noticing. Plum ink on heliotrope paper. Italic pull-quotes that read like transcribed observations. Hairline rules where margins would be. Margin-Note Magenta where the writer underlined something by hand. Pill buttons sized like rubber-stamp marks. The user is not browsing a database; they are keeping a notebook of causes that matter to them, building it page by page over time.

The system rejects the antiquated, bureaucratic aesthetic of nonprofit software — Charity Navigator's spreadsheets, GuideStar's data graveyard, GoFundMe's urgency, the generic SaaS dashboard, and the magazine-of-record affectations (volume numbers, week IDs, kickers like "On the cultural calendar") that perform a curatorial rigor we haven't earned. We earn opinion later by doing editorial work; for now, we present discovery as discovery.

The system is built to grow into community signals — letters from organizations, neighborhood activity, a friend's saved cause — without breaking. Those land in the notebook the same way: as marginalia, not as feed chrome. Future patterns inherit the same vocabulary (paper, hairlines, margin-note magenta, pull-quotes) before they earn new ones.

**Key Characteristics:**
- Plum-on-paper palette, committed and unusual
- Editorial typography (Bitter display + Archivo body) without the magazine-institution voice
- Two-layer elevation: paper canvas + glass loupe, no third layer
- Color-tinted shadows used as atmosphere, never as structure
- Cardstock category tabs as the only place the system gets drenched and saturated
- Calm motion: state changes only, no choreography, reduced-motion respected by default

## 2. Colors: The Plum-on-Paper Palette

The palette is **plum on paper**: a pale heliotrope ground, deep plum ink, hot magenta as the writer's hand, and a small set of cardstock colors that live only on category tabs.

### Primary
- **Margin-Note Magenta** (`#c8266e`): The mark the writer made by hand. Used on focus rings, primary CTAs on hover, the left rule next to a pull-quote, and the underline that fills in beneath an active chip. Rare. The page should read more plum than magenta in any given view.

### Secondary
- **Iris** (`#5b4b9e`): Muted purple. Used for small structural marks (geo glyphs, atmospheric backdrops, hairline tints). Never a primary action color; it does the quiet work of suggesting hierarchy without raising volume.

### Tertiary — Cardstock
The six saturated tones used **only on category tabs** (Browse by Cause). These are the colored dividers in the notebook. They never appear on body text, buttons, or surfaces outside the category mosaic. Adding a seventh requires an explicit naming and a ratified place for it to live.

- **Terracotta** (`#c58f5a`): Arts & Culture
- **Slate Blue** (`#5a7a8e`): Education & Learning
- **Brick** (`#8e5c4a`): Health Care
- **Fern** (`#5c7a5e`): Environment
- **Plum-Iris** (`#5e5470`): Making Global Impact
- **Walnut** (`#8e6f4f`): Your Local Community

### Neutral
- **Heliotrope Paper** (`#f0e6f5`): The page. Page background; never used for text.
- **Pressed Heliotrope** (`#e1d2eb`): A slightly deeper page used for muted backgrounds and section seams.
- **Page White** (`#ffffff`): The card surface. Where a paper card or the glass loupe sits on the page.
- **Page Wash** (`#f1e9f4`): Card hover state. Almost imperceptible; the lift is in the shadow, not the fill.
- **Plum Ink** (`#1a0f2c`): Primary text and primary button fill. The deepest mark on the page.
- **Soft Plum** (`#3d2d57`): Secondary text. Body copy when the headline is already plum ink.
- **Faded Plum** (`#7c6f9a`): Tertiary / caption text. Borderline on body-text contrast against Heliotrope Paper; reserve for label-sized type and confirm AA in audit.
- **Hairline Lilac** (`#d3c0df`): Default border and divider. The ruled line on the page.
- **Ruled Mauve** (`#b89cc9`): A stronger rule for emphasis — under search inputs at rest, under hover-revealed dividers.
- **Blush Wash** (`#f9d8e6`): Soft pink wash. The active fill behind a saved chip and the atmospheric halo at the top of long pages.

### Named Rules

**The Plum-First Rule.** The page should always read more plum than magenta. Magenta is the writer's hand — sparing, deliberate. If the eye lands on pink first, redistribute.

**The Tab-Color Rule.** The cardstock palette appears only on category tabs (Browse by Cause). It does not bleed into other surfaces. Category color does not flavor the content underneath the category — once a user clicks into Arts & Culture, the page returns to plum on paper.

## 3. Typography

**Display Font:** Bitter (loaded via `next/font/google`, fallback Georgia, serif)
**Body Font:** Archivo (loaded via `next/font/google`, fallback system-ui, sans-serif)

**Character:** A serif of the page and a sans of the field. Bitter is a slab serif: confident without being decorative, comfortable at very large display sizes for hero quotes, comfortable enough at 22px for card titles. Archivo is a humanist sans: readable at small sizes, neutral but not generic, the right tone for "make this 13px caption legible at arm's length."

### Hierarchy
- **Display** (Bitter, 600, `clamp(2.4rem, 5vw, 4.25rem)`, leading 0.98): Hero headlines on the home page and on featured causes. Used once per view.
- **Headline** (Bitter, 600, `clamp(1.75rem, 2.5vw, 2.5rem)`, leading 1.05): Section titles. Always paired with a small label kicker.
- **Title** (Bitter, 600, 22px, leading 1.1): Card titles inside the loupe and inside cardstock tabs.
- **Body** (Archivo, 400, 15px, leading 1.5): Paragraphs, descriptions, summary lines on cards. Cap line length at ~70ch.
- **Label** (Archivo, 600, 11px, `letter-spacing: 0.32em`, uppercase): Kickers, scope tags, "Browse:", "Currently serving". The small caps that mark what *kind* of thing follows.

### Named Rules

**The Pull-Quote Rule.** When a tagline or summary is the most important sentence on a card, render it in Bitter italic with a 2px Margin-Note Magenta left rule, indented from the text column. This is the system's signature treatment for "this is the cause's own voice." Use it sparingly and never twice on one screen.

**The No-Volume Rule.** Editorial labels never imply a publication cadence. No "Vol. X", no week numbers, no "On the cultural calendar"-style affectations. Kickers describe section *kind* ("Browse by cause", "Cause of the week"), not editorial calendars.

## 4. Elevation

The system is two-layer. **Paper** is the ground. The **glass loupe** is the only thing that sits on top of it. The metaphor is the flat sliding bar magnifier you slide over a page to enlarge the words underneath. Most surfaces are paper. The loupe is rare and emphatic — it appears over the featured cause to say "look at this one."

There is no third elevation. Cards do not stack. Modals are a last resort. If a surface needs to feel important, it earns the loupe; if it doesn't, it stays paper. Shadows are color-tinted (purple under the loupe, magenta under action elements that have been reached toward) and function as **atmosphere**, not structure — they suggest soft contact with the page below, not levitation above it.

### Shadow Vocabulary
- **Loupe-rest** (`box-shadow: 0 30px 70px -40px rgba(91, 75, 158, 0.45)`): Soft purple cast under the featured loupe card.
- **Loupe-hover** (`box-shadow: 0 22px 50px -28px rgba(91, 75, 158, 0.45)`): Tightens on hover — the loupe presses down toward the page.
- **Action-bloom** (`box-shadow: 0 18px 40px -20px rgba(200, 38, 110, 0.55)`): Magenta, blooms under buttons and CTAs on hover.
- **Input-glow** (`box-shadow: 0 18px 50px -30px rgba(200, 38, 110, 0.45)`): Magenta, search input only, on focus. Paired with a 4px ring at 12% accent.

### Named Rules

**The Loupe Rule.** Glass surfaces are emphasis, not decoration. One loupe per view, two at most. The loupe must sit over a paper surface; rendering it on an empty viewport breaks the metaphor. If you find yourself reaching for a third loupe, switch them all to paper and start over.

**The No-Float Rule.** Cards do not stack. Surfaces are either paper or loupe; nothing is a third elevated layer. Decorative AI-style background patterns (radial-dot paper-grain, topographic line backdrops, abstract gradient meshes) are forbidden — they were the gradient era's attempt at depth and have no place in a paper system.

## 5. Components

Buttons, cards, inputs, and chips share one philosophy: **confidently quiet**. Pill shapes, hairline borders, color-tinted shadows that bloom only on reach. Nothing demands attention until you move toward it.

### Buttons
- **Shape:** Pill (`rounded-full` / 9999px). Always. The system has no rectangular buttons.
- **Primary:** Plum Ink fill, Heliotrope Paper text, Label typography. Padding `12px 24px`. On hover: fill shifts to Margin-Note Magenta, paper text remains, Action-bloom shadow appears beneath.
- **Ghost / secondary:** Page White at ~70% opacity, Soft Plum text, Ruled Mauve 1px border. On hover: fills to Page White, border shifts to Margin-Note Magenta at 40%, text shifts to Margin-Note Magenta. Used for tertiary actions and the "Add to My Causes" save toggle in its inactive state.
- **Active save state:** Blush Wash fill, Margin-Note Magenta text, Margin-Note Magenta border at 50%. Heart icon fills.

### Inputs
- **Search:** Pill shape, 64px tall, Page White at 80% with backdrop-blur, Bitter italic placeholder, 16px input text. On focus: fill goes to full Page White, border shifts to Margin-Note Magenta at 50%, Input-glow shadow appears, plus a 4px ring at 12% accent. The search bar is the largest pill on the page; it acts as the system's invitation to wander.

### Cards

#### Paper Card
The default surface for content. Page White fill on Heliotrope Paper ground, Hairline Lilac 1px border, hero radius (32px) for featured paper cards or card radius (20px) for grid cards. A 1px hairline gradient at the top (transparent → Margin-Note Magenta at 60% → transparent) appears on featured paper cards as a visual seam. Loupe-rest shadow for hero cards; no shadow at rest for grid cards.

#### Loupe Card (glass)
Used for emphasis only. Page White at 60% opacity over Heliotrope Paper, `backdrop-filter: blur(18px)`, 1px Iris-tinted border (`rgba(91, 75, 158, 0.22)`), card radius (20px). On hover: opacity rises to 85%, border shifts toward Margin-Note Magenta at 45%, Loupe-hover shadow strengthens. Used for the featured Cause of the Week and for the search-result spotlight, never on routine grid cards.

#### Cardstock Tab
Used only in the Browse by Cause mosaic. Drenched cardstock background (one of the six category tones), Plum Ink title, Soft Plum body, Faded Plum index numerals (e.g. "01"–"06"). A diagonal hatch pattern at low opacity (~6%, line spacing ~6px, line angle 135°) overlays the fill to give it a printed-cardstock texture. On hover: Loupe-rest shadow appears, the glyph rotates 12° and scales 1.1×, the bottom rule fills in left-to-right.

### Chips
Keyword tags on cards and category filters in the masthead. Page White fill with Hairline Lilac 1px border by default; Blush Wash fill with Margin-Note Magenta border and text when active. Pill shape. Body-size type (13–14px). Used for keywords, filters, and small metadata flags — never for primary actions.

### Geo Glyphs
The four-glyph set (◐ Global, ◈ National, ◇ Regional, ◉ Local) appears as small unicode marks colored Iris on cards, always paired with a human-readable scope label. Decorative-only; always `aria-hidden`.

### Section Headers
Three-row vertical structure. (1) Label kicker in Margin-Note Magenta with a 28px Margin-Note Magenta hairline prefix. (2) Headline in Plum Ink. (3) Optional subtitle in Faded Plum at body size. The hairline prefix is the system's "this is a section" mark; it appears nowhere else.

## 6. Do's and Don'ts

### Do:
- **Do** lead cards with story (tagline, hook, one-sentence summary), not metadata. EIN, NTEE, deductibility, and tax codes have no place on a card.
- **Do** use the loupe (glass card) sparingly — once or twice per view, only over paper, only for emphasis.
- **Do** restrict the cardstock palette to category tabs. Drench is a Tab-Color signal; using saturation elsewhere dilutes it.
- **Do** treat Margin-Note Magenta as the writer's hand: focus rings, hover blooms, pull-quote rules. Never a default surface color.
- **Do** keep the page reading more plum than magenta. If the eye lands on pink first, redistribute.
- **Do** honor `prefers-reduced-motion: reduce` on every motion you add. Carousel scrolls, fade-ups, hover transforms — all must resolve to no motion.
- **Do** keep keyboard focus visible at all times. Hover-revealed save buttons must remain reachable on keyboard focus.

### Don't:
- **Don't** add decorative background patterns (radial-dot paper-grain, topographic line backdrops, AI-style abstract shapes, gradient meshes). They are the gradient era's failed attempt at depth and are explicitly out of the system.
- **Don't** use the magazine-of-record voice — no "Vol. X", no week IDs, no kickers that imply an editorial cadence we don't have ("On the cultural calendar", "Investing in minds", "On the front lines"). Kickers describe section kind; they do not perform curation.
- **Don't** stack glass cards or place a loupe over a non-paper surface. Loupe over loupe is forbidden. Loupe over empty viewport breaks the metaphor.
- **Don't** wrap every cause in a glass card "to make them feel premium." Most causes deserve paper. Premium is rarity, not chrome.
- **Don't** fall back to nonprofit-software conventions: rating scores (Charity Navigator), EIN-first identity (GuideStar / Candid), urgent donation language (GoFundMe), or KPI-grid SaaS dashboards. Each of these breaks the Field Notebook metaphor at the root.
- **Don't** use `#000` or `#fff` for text or icons. The system has no pure black or white. Plum Ink stands in for black; Page White stands in for white.
- **Don't** apply gradient text (`background-clip: text`). Color emphasis is achieved with weight, italic, or a Margin-Note Magenta left rule, never with gradient fills.
- **Don't** introduce side-stripe borders (border-left greater than 1px as a colored accent on cards or list items). The 2px Margin-Note Magenta rule next to a pull-quote is the only exception, and it is a typographic treatment with its own context — not a generic alert/callout pattern.
