# Feedback round 1 (16 Nov 2026)

Walkthrough of prototype 1 by a team member, page by page. Each item: the
feedback, what we decided, and why. Principle IDs refer to
`.claude/skills/hcai-principles/principles.md`.

Status: **do** = implement now, **keep** = no change, **later** = parked for a
team discussion.

## Kept as they are

Avatars, the Mine vs Group switch, dictator mode, the bill, the "It's a match"
moment, the clean style of setup steps 1 and 2.

## Welcome

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| A1 | Give it a name | Name the app **Forkcast** (forecast for food) | do | |
| A2 | "It only guesses" makes no sense | Tagline: "Learns your taste. Guides your group." | do | AMR-01, HCAI-01 |
| A3 | "One table wins" is wrong, you get a list | "One ranked list for the whole group" | do | MM-01 |
| A4 | Say that it helps with ad-hoc and reservation chaos | "No more group-chat chaos or last-minute booking stress." | do | AMR-01, PROC-01 |
| A5 | "Get started" can sit below the fold on short phones | Fix the layout | do | |

## Setup step 1, profile

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| B1 | Custom diet and allergy entries? | Keep the fixed lists for now | later | MM-05 |
| B2 | Hiding places you cannot eat at is too drastic | Keep hard filtering for now, discuss soft ranking | later | XAI-02 vs. HCAI-02 |
| B3 | "Never by whom" is obvious | Keep, the group could work it out anyway | keep | |
| B4 | Say that restrictions can change per trip | Hint at the top of the step | do | AMR-17 |

## Setup step 3, trip details

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| D1 | Who would not want "Top rated"? | Remove the option, ratings are on every card | do | HOR-01 |
| D2 | Make clear these are your own preferences | "Only you see this" hint | do | AMR-05, MM-07 |
| D3 | Personal mood and the group's hotel are mixed | Split: trip starter sets hotel, area, dates. Joiners see them filled in. Step 3 keeps only personal preferences | do | MM-01 |
| D4 | What if someone already set the hotel? | Covered by D3 | do | |
| D5 | Custom option for preferences | Free-text "add your own" | do | FAIR-14 |
| D6 | Custom location, even a hotel | Custom address and a tap on the map | do | MM-05 |

## New: overview dashboard

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| E1 | Show an overview first, not straight into swiping | Dashboard after setup: map of the stay with places around it, group progress, next step. A "Swipe now" button at the bottom the first time | do | DM-02, AMR-01 |

## Swipe

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| F1 | Show the hottest comment from Maps | One top review quote per card, labelled as sample | do | AMR-04 |
| F2 | Seeing others' votes creates pressure | Anonymous count only ("2 friends liked this"), after your own swipe | do | AMR-05, HOR-10 |
| F3 | Map of the location as the second picture | Mini map slide: the place, your hotel for reference, other places faintly | do | AMR-04, DM-02 |
| F4 | More about the vibe (local, posh) | Vibe tags on the card | do | AMR-04, XAI-13 |

## Ranking

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| G1 | Front-runner needs a bigger picture | Big photo card with a gold border | do | |
| G2 | "Clear picture X of Y" belongs at the top | Progress at the top, full list below in one go | do | |
| G3 | Adjusting people should be a main feature | Tap avatars around the table to switch members on or off, with a clear signifier | do | DM-01, FAIR-16 |
| G4, G6 | Where is the booking feature? Ad-hoc, day before, or before the trip | Booking is a main, always visible control: when do you want to eat (now, tomorrow, before the trip). Each place shows how it can be booked, ad-hoc mode sorts by free now | do | PROC-01, AMR-04, ERR-12 |
| G5 | Personal "important for this trip" | Private must-haves per person per trip (dish, budget) that feed the ranking. Budget moves here from the group prefs | do | FAIR-14, MM-04, AMR-05 |
| G7 | Review findings: bill privacy, veto under filters, pin vs. veto, counterfactual, bar scaling | Not now | later | |
| G8 | Average demographic display | Leave as is, decide before the report | later | FAIR-07, FAIR-13, FAIR-20 |

## Round 1b (16 Nov 2026)

Second pass on the same prototype after trying round 1. Some round 1
decisions are replaced: E1 (overview dashboard), G1 (big front-runner card),
G3 hint wording and G4/G6 (booking modes).

| # | Feedback | Decision | Status | Why |
|---|---|---|---|---|
| H1 | The Overview tab is one tab too many | Overview tab and dashboard removed. Its map of the stay and the places around it moves to the Group tab, renamed **Our trip**. "Clear picture" progress stays only on Ranking, so it is not shown twice. Replaces E1 | do | DM-02, ERR-03 |
| H2 | After setup, let me choose: look around or swipe | Setup step 4 of 4: "You're all set! Ready to swipe?" with "Start swiping" (Swipe) and "Group overview" (Our trip). The first-visit "Swipe now" logic is gone | do | AMR-01, HCAI-02 |
| H3 | The front-runner card is too big | Number one is a list row of the same size as the others, with a gold border and a small gold "Front-runner" marker on the border. Replaces G1 | do | DM-04, ERR-04 |
| H4 | Booking modes and picking nights are too much | No more "When do you want to eat?" and no dates or nights anywhere. Every place says how early to reserve: "Walk in", "Book the same day", "Book a day ahead", "Book before you go", the same words on the card, row, sheet and bill. One switch on Ranking, "Book early first": groups the list by lead time, earliest first, keeps the group order inside each group with a small header per group. Rows keep their group rank number, the front-runner marker stays on the overall number one, a pin stays on top. Replaces G4/G6 | do | AMR-04, ERR-04, DM-03 |
| H5 | Trip wishes do not belong in Profile | Mood, own words, must-haves and budget move to Our trip, "Just for you", still "Only you see this". Profile keeps the person (name, avatar, diet, allergies, settings, data) and gets "Your trips": the current trip and past ones (stay and dates only). "Start a new trip" asks first, keeps the profile, and runs the trip setup again. Swipes, wishes, pin and fairness rule start fresh because the deck is per trip | do | MM-01, AMR-05, FAIR-17 |
| H6 | "Tap a friend to leave them out" is not clear | Heading "Who counts in this ranking", copy "Everyone counts. Tap a person to leave them out, tap again to bring them back." Every seat has a badge: a green check when the person counts, a dark cross when left out, plus a small legend | do | DM-01, NOR-02, FAIR-16 |

Model and data: `BookingMode`, nights and the busy-night rule are gone.
`leadOf()` and `byLead()` in `src/model/booking.ts` replace them. Saved
state moves to version 4: old `when`, `night` and `seenDashboard` fields
are dropped on load, `pastTrips` and `bookEarly` are new.

## Not pursued

Sample-data mismatches (photo labels, addresses) and the confidence label on a
small deck. Prototype data, out of scope.
