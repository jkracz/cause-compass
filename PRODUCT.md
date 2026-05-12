# Product

## Register

product

## Users

The primary user is **a casually curious person browsing for nonprofits that align with their values** — on a phone or laptop, with no fixed agenda and low initial intent. They aren't researching a donation, vetting a charity, or working through a giving plan. They want to wander, find a few causes that resonate, and start a small personal collection.

Their context is unhurried and exploratory. They are not in a workflow. They are not making a transaction. They are forming an interest, and the platform's job is to help that interest take shape into something they can return to.

Secondary use cases (logged-in users revisiting their saved causes, deeper profile reads, search) exist but are not the optimization target for the home surface. Home is the front door for the low-intent browser.

## Product Purpose

Cause Compass helps people **discover nonprofits that match their values, save the ones that resonate, and eventually build a connection with those causes that extends beyond the platform.**

The arc we care about is _discover → save → relationship_. The platform is the introduction; the relationship lives in the user's ongoing engagement with the cause itself (donations, volunteering, attention, advocacy). Success is not screen time, return visits, or transactions inside our walls. Success is that someone leaves with a few names they hadn't heard of and a reason to remember them.

**Primary success metric:** saves to "My Causes" per session.

**Secondary signal:** time on page, as a proxy for whether browsing actually feels worth doing.

We are not a rating service. We are not a giving platform. We are not a research tool. We are a place to _find something you might care about_ in a directory of 200,000+ vetted nonprofits, most of whom no one would ever encounter without help.

## Brand Personality

**Exploratory. Calm. Community.** With a quiet undercurrent of _discoverability_ — the sense that there is always more here than you can see at once, and you are welcome to wander.

**Voice and tone:**

- Confident but unhurried. Willing to write a real sentence. Doesn't fill every cell with metadata to look thorough.
- Anti-bureaucratic. We have NTEE codes, EINs, and tax classifications, and we will mostly hide them. Those are facts about a record, not reasons to care.
- Minimal performance. We don't pretend to curate what we haven't curated. If "Cause of the Week" is currently random, it's presented as a featured cause, not an editorial pick. We can earn a more opinionated voice later by doing the editorial work; we don't get to skip ahead by stamping a masthead on the directory.
- Respects the reader's casualness. No urgency, no donation pressure, no FOMO. The user can come back next week.

**Emotional goals:**

- A small spark of "oh, that's interesting"
- The feeling of being introduced to something, not sold to
- A budding sense of caring about a specific cause, even one the user would never have searched for
- Calm — never the rising adrenaline of a crisis-fundraising appeal

## Anti-references

We are reacting against **the antiquated, bureaucratic, transactional aesthetic of nonprofit software**. Specifically:

- **Charity Navigator** — Ratings, scores, efficiency percentages. Treats nonprofits as investment vehicles to be benchmarked. Spreadsheety.
- **GuideStar / Candid** — A data graveyard. EIN-first, Form-990-first, optimized for grantmakers and researchers. Forms, not stories.
- **GoFundMe** — Urgent, emotional, transactional. Designed to convert empathy into immediate dollars. The opposite of unhurried wandering.
- **Generic SaaS dashboards** — Cards-in-a-grid, KPIs at the top, sidebar nav. The tell of a tool that doesn't know what it's for. This is not a dashboard.
- **Magazine-as-institution affectations** — "Vol. X", week numbers in the header, kickers like "On the cultural calendar" that imply an editorial cadence we don't have. Performing curation we haven't earned is worse than presenting discovery honestly.

What unites these failures: they all treat a nonprofit as a _record_ (a row, a score, a transaction, a feature slot) instead of a _cause someone might care about_.

## Design Principles

1. **Show the cause, not the record.** Lead with story — tagline, hook, what they actually do, where they work, who they help. Hide the bureaucratic shell (EIN, NTEE code, deductibility, tax status) behind deeper interaction or omit it entirely. Every fact on screen has to earn its place by helping a casual browser care. Equal-and-opposite trap: don't compensate for sparse story by stuffing cards with metadata. If we don't have a hook, we say less.

2. **Don't perform curation we haven't done.** If a section is randomized, present it as featured, not edited. If we ever add real opinion, the typography and palette can carry that voice — but we earn the editorial register by doing the editorial work, not by stamping a magazine on a directory.

3. **The platform is an introduction, not the destination.** Optimize for the moment of "I'd like to remember this one" — the save. Don't trap, don't gamify, don't manufacture stickiness. A great session might be three minutes long and produce two saves. That's a win.

4. **Calm over loud.** No urgency, no high-contrast chrome shouting for attention, no donation-button maximization. The plum-on-paper palette, unhurried whitespace, and willingness to leave room around content all do work that loud product chrome would undo.

5. **A directory of 200,000 things should feel like a place, not a list.** Use rhythm, section variety, and editorial typography to make wandering feel rewarded. The same skeleton on every card is fine. The same energy on every section is not.

## Accessibility & Inclusion

**Floor:** WCAG 2.2 AA for color contrast, focus states, and keyboard navigation. The plum-on-paper palette generally clears this, but `--ink-mute` (#7c6f9a) on `--paper` (#f0e6f5) needs verification for body-text contexts. Today it is used on small caption-weight text where it likely passes only as Large Text. To be audited during DESIGN.md and `polish`.

**Reduced motion:** Decorative animations (carousel scroll, fade-up reveals) already honor `prefers-reduced-motion: reduce` and resolve to no motion. New motion added to the system must do the same by default.

**Keyboard and screen reader:** Save / "Add to My Causes" actions must be reachable and operable without hover, since hover-revealed UI is currently used for save buttons on cards. Decorative geo glyphs (◐ ◈ ◇ ◉) must remain `aria-hidden`, with the human-readable scope label always present.

**Known user needs:** None specifically identified yet. The absence of stated requirements is not the same as universal accessibility — this section should be revisited as real users surface specific needs.
