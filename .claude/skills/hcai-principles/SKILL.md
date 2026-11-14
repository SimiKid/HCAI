---
name: hcai-principles
description: Use when designing or changing a key design decision of Restaurant Tinder, such as how the AI learns from swipes, how the group ranking works, how results are explained, how users override the AI, or what personal data is used, and when drafting the project report. Not for routine UI work, styling, refactors, or bug fixes.
---

# HCAI principles

This repo is a course project for Human-Centered AI (UZH, HS26). The report
asks for 3 to 5 key design features justified with course principles, and in
the oral exam any team member can be asked about them. This skill keeps those
few important decisions principled, marked in the code, and listed in
`docs/hcai-study-guide.md`.

Less is more. The study guide should read like a short list of the decisions
we would defend in the exam, not an inventory of every button.

## Is this a key design decision?

Tag only if at least one is true:

- It shapes how the **AI behaves** toward users: what it learns, when it acts,
  how confident it claims to be, how it explains itself.
- It decides **who has control**: overriding, pinning, vetoing, turning the AI off.
- It affects **fairness or privacy**: how members are weighted, what data is
  collected or shown about people.
- We **chose between real alternatives** for a reason from class, and would
  mention it in the report or the oral exam.

Do not tag routine work that any decent app has anyway: button hover
states, loading spinners, standard layout, styling, form validation, refactors,
bug fixes, tests. If in doubt, do not tag.

Rough budget: one feature gets 1 to 3 tags. The whole app should end up with
about 15 to 30 tags, not hundreds.

## Workflow

1. **Before a key decision, look it up.** Read the catalogue sections that fit
   (table below) in `principles.md`. Skip this for routine work.
2. **Apply.** Let the principle shape the design. When two principles conflict,
   pick one and mark the trade-off.
3. **Tag once, at the place that best shows the decision.** One comment in the
   file's own comment syntax:

   ```
   // @hcai AMR-11 Each card shows one "why" line built from the member's own swipes
   # @hcai FAIR-04 (trade-off) Equal weight per member, heavy swipers get no extra say
   ```

   - Format is `@hcai <ID> <how it is applied here>` on one line, in English,
     no em-dashes. Concrete: "shows top 2 factors as chips", not "applies explainability".
   - Put the tag where the decision lives (the ranking function, the
     explanation component), not on every file that touches it.
   - Do not repeat the same principle for the same decision in several places.
4. **Regenerate the guide** with `scripts/study-guide.sh` and commit
   `docs/hcai-study-guide.md` together with the code. The script fails on an
   unknown ID.
5. **Mention it.** If you added tags, list the IDs in one line in your reply.

## Which sections to read

| Decision about | Read |
|---|---|
| Learning from swipes | HOR-02, HOR-12, AMR-13 to AMR-16, ERR-08, FAIR-09 |
| Group ranking, aggregation | FAIR-04, FAIR-05, FAIR-10, HOR-08, AMR-10 |
| Explanations, "why this?" | XAI-07 to XAI-11, XAI-14 to XAI-16, AMR-11, DM-10 |
| Override, pin, dictatorship mode, filters | HCAI-02, DM-04, DM-05, FAIR-01, FAIR-03, HOR-09 |
| When the AI acts or asks | HOR-03, HOR-05, HOR-13, AMR-03, HCAI-03 |
| Confidence, trust | XAI-01, XAI-02, XAI-10, FAIR-18, AMR-02 |
| Personal data, demographics | FAIR-07, FAIR-12, FAIR-13, FAIR-17, FAIR-20, MM-07 |
| Onboarding, first impression | AMR-01, MM-02, MM-06, NOR-06 |
| Report, evaluation, model card | FAIR-11, FAIR-19, ERR-14, DM-12, PROC |

## Rules

- Never invent an ID. If a course principle is missing, add it to
  `principles.md` (own words, source pointer, next free number in its
  section), then tag it.
- Never paste slide text or lecture PDFs into the repo. It is public.
- If a requested feature conflicts with a principle, say so before building
  and propose an alternative. Known conflicts in the product idea:
  - "Average demographic that likes each restaurant" clashes with FAIR-07,
    FAIR-12, FAIR-13 (stereotyping) and FAIR-17. Suggest taste clusters
    ("people who like spicy food") instead, opt-in only.
  - Dictatorship mode supports HCAI-02 and FAIR-03 but shifts power. Show who pinned (FAIR-01).
  - The people filter supports FAIR-16 but exposes individual preferences (AMR-05).
  - Photo swipes are a proxy with feedback loops (FAIR-09).
- Do not hand-edit the generated part of `docs/hcai-study-guide.md`.
