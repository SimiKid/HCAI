## Product

Name: Forkcast (working title was Restaurant Tinder). A group picks a restaurant by swiping on
restaurant pictures. The app ranks restaurants for the whole group.

### User journey

Each step has a core flow and the prototype features that belong to it.
All listed features are in scope for the prototype.

1. Create a profile
   - Questions about the user.
   - Core person information: allergies, diets.

2. Join a group or trip
   - Three ways in: accept an invitation, type a trip code, or start a new
     trip.
   - Whoever starts a trip gets a trip code and an invite link to share, and
     sees who has joined. More people can be invited later from the Group tab.
   - Opening an invite link fills in the trip code.
   - Whoever starts the trip sets where the group stays (a preset area or a
     custom place on the map) and the dates. Joiners see them filled in.
   - Personal, private preferences per trip: mood ("eat traditionally",
     "trendy areas"), own free-text preferences, must-haves ("paella, no
     negotiation") and a budget. Only the member sees them, editable later
     in Profile.
   - After setup the app opens on an Overview: a map of the stay with the
     places around it, group progress, and the next step.

3. Swipe pictures
   - The user swipes on restaurant pictures. Swipe as much as you want.
   - The app needs as little data as possible to work.
   - Each swipe trains the algorithm on the user's preferences.
   - Each card shows: location, price level (dollar signs), walking time
     from where the group stays, reviews including numbers, vibe tags, one
     sample review quote, and how the place can be booked. The second slide
     is a mini map with the place and the group's stay.
   - The deck only has places that every group member can eat at. It ends
     after one pass and does not repeat.
   - Table match: after your own like, a full-screen moment shows when at
     least two others liked the same place and nobody skipped it. Others'
     likes are only ever a count, never names or faces.

4. Ranked list of restaurants for the group
   - One ranked list for the whole group, all places in one go.
   - Booking is a main control: "When do you want to eat?" now (ad-hoc),
     tomorrow, or before the trip. Every place shows how the group gets a
     table in that mode.
   - Group progress: who the app has a clear picture of (20 swipes), and a
     nudge for the others.
   - The user can re-rank the list with their own preferences.
   - Map view of the results.
   - Shows the average demographic that likes each restaurant.
   - Dictatorship mode: one user pins a restaurant to the top of the list.
   - People filter: tap a friend at the table to leave them out of the ranking.

### Decisions

- Restaurant pictures and data: a fixed set of 40 real Barcelona restaurants
  stored in the repo, with free-licence photos. Ratings, review counts,
  reservation times and demographics are sample values and labelled as such.
  No scraping. All screens read through the `RestaurantSource` interface in
  `src/data/source.ts`, with field names that follow Google Places, so a
  Google Places source can replace the fixed file later.
- Prototype: mobile web app without a backend. One real user swipes, the other
  group members are simulated with seeded swipes.
- Group ranking: every member has equal weight. Under the people filter,
  each member's name shows the total number of swipes they have done.

- Privacy inside the group: each member sees their own reasons. Other
  members' reasons are only counted ("two people prefer cheaper places")
  unless they chose to share them by name. A place ruled out by a diet or
  allergy never says whose it was.
- No front-runner until every member at the table has 8 swipes. Before that
  the ranking shows an unordered shortlist of three. A member who has seen
  every place they can eat at is not waited for, so a short deck cannot block
  the ranking.
- After a swipe, one optional tap says what it was about (food, vibe, price,
  location). Then only that part of the card is learned, three times as
  strongly.
- A real swipe beats the guess: for a place a member liked or skipped, their
  own score comes from the swipe, and the guess only fills in unseen places.
  A heart always means a real like. A predicted fit is worded as "likely".
- The line after a swipe names what got stronger in the member's taste. It
  reads the same weights and threshold as the taste chips in Profile, so the
  two cannot disagree.
- The group chooses its fairness rule: "best on average" or "nobody left
  unhappy" (the lowest member score counts). Members are equal under both.
- Table times are sample values with one rule: on Friday and Saturday the two
  earliest times are taken and walk-ins only work for smaller parties.
- A nudge makes a simulated friend swipe 12 more places. A table match only
  counts real swipes, never a predicted score.
- The full note on sample data is in Group, "About this data". Cards and
  sheets stay short and keep the photo credits.
- Booking data per place is a sample: walk-in chance and lead time (same day,
  day before, before the trip). In ad-hoc mode no place is hidden: free now
  comes first, then maybes, then full places, each ordered by taste. A pinned
  place stays on top even when full.
- Must-haves only change the guess for that member (a real swipe still wins)
  and are never shown to anyone else.
- Feedback round 1 and its decisions: `docs/feedback-round-1.md`.

### Look and feel

- Palette and base type follow the crimson and lavender reference. Headlines
  use Bricolage Grotesque, the bill uses DM Mono.
- Signature: the group's table. Avatars sit around a round table seen from
  above. On Ranking, the table is the people filter, and number one is a big
  photo card with a gold border.
- On Ranking, group progress comes first, then the booking control and the
  table, then the front-runner and the full list.
- The explanation of a rank is "the bill": a receipt with one line per person
  and the group result as the total.

## HCAI design principles (required)

For key design decisions (how the AI learns, ranks, explains, who can override it, what personal data is used), use the `hcai-principles` skill in `.claude/skills/hcai-principles/`. Not for routine UI work.

- The catalogue of course principles with stable IDs is `.claude/skills/hcai-principles/principles.md`.
- Tag only those key decisions in the code, with a comment of the form `@hcai` + ID + how it is applied. Aim for about 15 to 30 tags in the whole app.
- Run `scripts/study-guide.sh` after tagging and commit the regenerated `docs/hcai-study-guide.md` with the code.

## Commits and contributions

- Never mention Claude, Claude Code, Anthropic or AI assistance in commit
  messages, pull requests, code comments, docs or any other contribution.
- No `Co-Authored-By` lines and no "Generated with" footers.
- Commits are authored only as the git user.
