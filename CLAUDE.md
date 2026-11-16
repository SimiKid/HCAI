## Product

Name: Forkcast (working title was Restaurant Tinder). A group picks a restaurant by swiping on
restaurant pictures. The app ranks restaurants for the whole group.

### User journey

Each step has a core flow and the prototype features that belong to it.
All listed features are in scope for the prototype.

1. Create a profile
   - Questions about the user.
   - Core person information: allergies, diets.
   - The profile belongs to the person and outlives a trip. Profile lists
     "Your trips": the current one and past ones (stay and dates only). "Start
     a new trip" keeps the profile and runs the trip setup again. One active
     trip at a time.

2. Join a group or trip
   - Three ways in: accept an invitation, type a trip code, or start a new
     trip.
   - Whoever starts a trip gets a trip code and an invite link to share, and
     sees who has joined. More people can be invited later from Our trip.
   - Opening an invite link fills in the trip code.
   - Whoever starts the trip sets where the group stays (a preset area or a
     custom place on the map) and the dates. Joiners see them filled in.
   - Personal, private preferences per trip: mood ("eat traditionally",
     "trendy areas"), own free-text preferences, must-haves ("paella, no
     negotiation") and a budget. Only the member sees them, editable later
     in Our trip under "Just for you".
   - Setup has four steps. Step 4: "You're all set! Ready to swipe?" with
     "Start swiping" (lands on Swipe) and "Group overview" (lands on Our
     trip).
   - The Our trip tab: the trip (stay, dates, people), a map of the stay with
     the places around it, "Just for you", the members and the invite.

3. Swipe pictures
   - The user swipes on restaurant pictures. Swipe as much as you want.
   - The app needs as little data as possible to work.
   - Each swipe trains the algorithm on the user's preferences.
   - Each card shows: location, price level (dollar signs), walking time
     from where the group stays, reviews including numbers, vibe tags, one
     sample review quote, and how early to reserve. The second slide
     is a mini map with the place and the group's stay.
   - The deck only has places that every group member can eat at. It ends
     after one pass and does not repeat.
   - Table match: after your own like, a full-screen moment shows when at
     least two others liked the same place and nobody skipped it. Others'
     likes are only ever a count, never names or faces.

4. Ranked list of restaurants for the group
   - One ranked list for the whole group, all places in one go.
   - Booking: every place shows how early to reserve ("Walk in", "Book the
     same day", "Book a day ahead", "Book before you go"). One switch, "Book
     early first", groups the list by that, earliest first, and keeps the
     group order inside each group.
   - Group progress: who the app has a clear picture of (20 swipes), and a
     nudge for the others.
   - The user can re-rank the list with their own preferences.
   - Map view of the results.
   - Shows the average demographic that likes each restaurant.
   - Dictatorship mode: one user pins a restaurant to the top of the list.
   - People filter: "Who counts in this ranking". Every seat at the table has
     a check or a cross, a tap leaves that person out, a second tap brings
     them back.

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
- Table times are sample values, shown in the bill with the largest party
  per time. There is no busy-night rule any more.
- A nudge makes a simulated friend swipe 12 more places. A table match only
  counts real swipes, never a predicted score.
- The full note on sample data is in Group, "About this data". Cards and
  sheets stay short and keep the photo credits.
- Booking data per place is a sample: walk-in chance and lead time. Easy
  walk-in reads "Walk in", otherwise the lead time. No dates or nights to
  pick anywhere. "Book early first" is a second sort on top of the group
  ranking, never a change to it: rows keep their group rank number, the
  front-runner marker stays on the overall number one and a pinned place
  stays on top. Off by default, saved per phone.
- Starting a new trip keeps name, avatar, diet, allergies, settings and
  forgotten tastes. Swipes, private wishes, the pin and the fairness rule
  belong to the trip and start fresh, since the deck is per trip.
- Must-haves only change the guess for that member (a real swipe still wins)
  and are never shown to anyone else.
- Feedback round 1 and 1b and their decisions: `docs/feedback-round-1.md`.

### Look and feel

- Palette and base type follow the crimson and lavender reference. Headlines
  use Bricolage Grotesque, the bill uses DM Mono.
- Signature: the group's table. Avatars sit around a round table seen from
  above. On Ranking, the table is the people filter, with a check or a cross
  badge on every seat.
- On Ranking, group progress comes first, then the table, then "Book early
  first" and the full list. Number one is a row of the same size as the
  others, with a gold border and a small gold "Front-runner" marker on it.
- Four tabs: Swipe, Ranking, Our trip, Profile. Our trip holds the map of the
  stay; group progress ("clear picture") lives only on Ranking.
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
