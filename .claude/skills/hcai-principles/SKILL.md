---
name: hcai-principles
description: Use for any UI, feature, ranking or recommendation logic, data handling, user-facing copy, or onboarding work in this repo, and when drafting the project report. Applies the Human-Centered AI course design principles, tags the code where each one is applied with @hcai IDs, and regenerates the study guide in docs/hcai-study-guide.md.
---

# HCAI principles

This repo is a course project for Human-Centered AI (UZH, HS26). The grade
depends on justifying design choices with principles from class, and in the
oral exam any team member can be asked about any feature. So every piece of
user-facing or AI behaviour has to (1) follow the course principles, (2) say
in the code which principle it follows, and (3) show up in the study guide.

The catalogue is `principles.md` in this folder. It is the only valid source
of principle IDs.

## Workflow

1. **Look up before you build.** Before designing a feature, read the
   catalogue sections that fit the task (table below). Use `grep` on
   `principles.md` for a keyword if unsure.
2. **Apply.** Let the principles shape the design, not decorate it
   afterwards. When two principles pull in different directions, pick one
   and record the trade-off (step 3).
3. **Tag.** At the place in the code where a principle is realised, add one
   comment in the file's own comment syntax:

   ```
   // @hcai AMR-11 Each card shows one "why" line built from the member's own swipes
   {/* @hcai DM-04 "Let's go here" is a human tap, the AI never commits a choice */}
   # @hcai HOR-13 decide() returns none, ask or act from two probability thresholds
   // @hcai FAIR-04 (trade-off) Equal weight per member, heavy swipers get no extra say
   ```

   - Format is `@hcai <ID> <how it is applied here>` on one line.
   - The "how" is concrete and specific to this code, in English, no em-dashes.
     "Applies explainability" is useless. "Shows top 2 SHAP factors as chips" is good.
   - Tag where a reviewer would see the principle in action: the component,
     the function, the copy string. One tag per principle per place, not per line.
   - Several principles at one place get several tags.
   - Mark deliberate compromises with `(trade-off)` right after the ID.
4. **Regenerate the guide.** Run `scripts/study-guide.sh`. It fails on an
   unknown ID, so fix typos or add the principle first. Commit the updated
   `docs/hcai-study-guide.md` together with the code.
5. **Report back.** In your reply, list the principle IDs you applied and any
   trade-offs, in one or two lines.

## Which sections to read

| Working on | Read |
|---|---|
| Swipe deck, gestures, cards | DM, NOR, ERR-01 to ERR-05, AMR-07 to AMR-09, DM-11 |
| Onboarding, first run, copy | AMR-01, AMR-02, MM, NOR-06, DM-06 |
| Preference model, learning from swipes | HOR, AMR-13 to AMR-16, ERR-08, ERR-09, XAI-12, XAI-13, FAIR-09 |
| Group ranking, aggregation | FAIR-04, FAIR-05, FAIR-10, FAIR-11, HCAI-02, HOR-08, HOR-14, AMR-10 |
| Explanations, "why this?" | XAI, AMR-11, MM-03, DM-07, DM-10 |
| Re-rank, pin, dictatorship mode, filters | HOR-09, DM-04, DM-05, FAIR-01, FAIR-03, FAIR-15, FAIR-16, AMR-14 |
| Notifications, prompts, timing | AMR-03, HOR-03, HOR-05, HOR-07, HOR-13 |
| Profile, personal data, demographics | FAIR-06, FAIR-07, FAIR-12, FAIR-17, FAIR-20, MM-07, AMR-17 |
| Empty states, errors, no results | ERR-10 to ERR-13, XAI-02 |
| Map and results views | DM-02, DM-03, AMR-04, ERR-07 |
| Report, model card, evaluation | FAIR-11, FAIR-13, FAIR-19, ERR-14, DM-12, HCAI-04, PROC |

## Rules

- Never invent an ID. If a course principle is missing, add an entry to
  `principles.md` (own words, source pointer, next free number in its
  section), then tag it.
- Never paste slide text or copy lecture PDFs into the repo. It is public.
  Summaries in our own words with a source pointer only.
- If a requested feature conflicts with a principle, say so before building
  and propose an alternative. Known conflicts in the current product idea:
  - "Average demographic that likes each restaurant" clashes with FAIR-07,
    FAIR-08, FAIR-12, FAIR-13 (stereotyping) and FAIR-17. Suggest taste
    clusters ("people who like spicy food") instead, opt-in only.
  - Dictatorship mode is good for HCAI-02 and FAIR-03 but shifts power.
    Show who pinned (FAIR-01).
  - Filter by member supports FAIR-16 but exposes individual preferences to
    the group (AMR-05).
  - Photo swipes are a proxy with feedback loops (FAIR-09, ERR-09).
- Do not hand-edit the generated part of `docs/hcai-study-guide.md`. The
  hand-written sections above the marker are fine to edit.
