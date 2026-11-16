# HCAI study guide

Which course principles Restaurant Tinder applies, where in the code, and how.
Use it to prepare for the oral exam and to write the "Design choices and
justification" section of the report.

- Definitions of every principle: `.claude/skills/hcai-principles/principles.md`
- The part below the marker is generated from `@hcai` tags in the code by
  `scripts/study-guide.sh`. Do not edit it by hand.

## Key design features for the report

Pick 3 to 5 features. For each, name the principles behind it and the task
analysis finding it answers. Edit this section by hand.

| Feature | Principles | Task analysis finding |
|---|---|---|
| | | |

## Where we applied each principle

<!-- BEGIN GENERATED: do not edit by hand, run scripts/study-guide.sh -->

29 of 117 principles applied, 31 tags in the code.

### Amershi et al. 2019, Guidelines for Human-AI Interaction (L04 p.66)

#### AMR-01 Make clear what the system can do

- `src/screens/Welcome.tsx:56` The first screen says what the app does (learns each taste, ranks one list for the group) and that it guides the group rather than deciding, before any data is asked for

#### AMR-02 Make clear how well the system can do what it can do

- `src/screens/Swipe.tsx:115` The header always shows how sure the app is, in words, next to the swipe count

#### AMR-04 Show contextually relevant information

- `src/screens/Ranking.tsx:135` Booking is a main control: now, tomorrow or before the trip, and every place then says how the group gets a table

#### AMR-05 Match relevant social norms

- `src/model/explain.ts:82` Other members' reasons are counted without names ("two people prefer cheaper places") unless they chose to share them
- `src/screens/JoinTrip.tsx:414` Mood, own words, must-haves and budget sit apart from the shared trip under "Only you see this", and the group only ever sees the combined ranking
- `src/screens/Swipe.tsx:79` Others' likes show only after my own like and only as a count ("2 friends liked this"), never as faces or names, so nobody feels watched

#### AMR-09 Support efficient correction

- `src/model/learn.ts:68` A taste the member removed in "What the app thinks you like" is forgotten, whatever the swipes said

#### AMR-10 Scope services when in doubt

- `src/screens/Ranking.tsx:71` Until everyone at the table has 8 swipes, or has seen every place they can eat at, there is no front-runner, only an unordered shortlist of three

#### AMR-11 Make clear why the system did what it did

- `src/components/WhySheet.tsx:101` Every place explains its rank per member: a match word for everyone, and one tap shows the two reasons that mattered most

#### AMR-15 Encourage granular feedback

- `src/screens/Swipe.tsx:87` One optional tap after a swipe says what it was about (food, vibe, price or location), beyond like and skip

#### AMR-16 Convey the consequences of user actions

- `src/screens/Swipe.tsx:84` After each swipe one line names what got stronger in the member's taste, in the same words as the chips in Profile

### Mental models and the model of the user (L04 p.4 to 19)

#### MM-01 Three models must line up

- `src/state.ts:6` The trip (stay, dates) is shared and set once by its starter, personal mood and must-haves live per member, so nobody mistakes their own wishes for group settings

#### MM-03 Make the AI's model of the user visible

- `src/screens/Profile.tsx:156` The app's picture of the member is on screen as chips, and each chip can be removed

### Errors and AI failure modes (L04 p.28 to 64)

#### ERR-12 Context errors: explain no-result and offer alternatives

- `src/model/rank.ts:111` A place with no table in the chosen mode is sorted down and marked, never hidden, and ad-hoc mode puts places free tonight first

### Fairness, accountability, ethics (L06)

#### FAIR-01 Accountability

- `src/components/WhySheet.tsx:73` A pinned place carries the name of who pinned it and says that it overrides the ranking

#### FAIR-03 Corrigibility

- `src/components/WhySheet.tsx:81` Anyone in the group can undo a pin with one tap, so the group keeps the last word

#### FAIR-04 Procedural vs. distributive justice: equality or equity

- `src/model/rank.ts:105` (trade-off) One member one vote under both rules: someone with 40 swipes counts the same as someone with 5

#### FAIR-05 Pick a fairness notion deliberately

- `src/model/rank.ts:106` The group picks its fairness rule: best on average, or nobody left unhappy (the lowest score counts)

#### FAIR-10 Aggregation bias

- `src/model/rank.ts:86` Diets and allergies are a veto, not a taste: one member who cannot eat there removes the place for the group

#### FAIR-13 Harm types

- `src/screens/Profile.tsx:212` "Popular with" uses taste groups, not age or gender, and stays off until a member turns it on

#### FAIR-14 Recourse

- `src/model/musthave.ts:107` Private must-haves in a member's own words ("paella") feed the ranking through a simple keyword match the member can predict

#### FAIR-16 User auditing

- `src/screens/Ranking.tsx:159` Anyone can switch members off and see whose taste shapes the list, with each member's swipe count on their seat

#### FAIR-17 Privacy: consent, control, erasure

- `src/screens/Profile.tsx:220` Showing my reasons to the group by name is my choice, off by default, and can be switched back any time

### Explainability and trust (L07)

#### XAI-09 Choose the explanation format on purpose

- `src/components/WhySheet.tsx:86` The explanation is a receipt: one line per person, a dashed rule, the group result as the total

#### XAI-10 Unwarranted faith in numbers

- `src/model/explain.ts:46` Scores are shown as words and bar lengths, the raw number never reaches the screen

#### XAI-13 Accuracy vs. interpretability, use interpretable features

- `src/model/features.ts:15` The model only sees features a person can name (cuisine, vibe, price, distance, rating), no image embeddings

### Human-Centered AI framework (Shneiderman 2022, in L06 and L07)

#### HCAI-02 High control and high automation together

- `src/screens/Ranking.tsx:56` The ranking is automatic, and people steer it three ways: filter members, re-rank for yourself, or pin a place

### Horvitz 1999, Principles of mixed-initiative user interfaces (reading, week 4)

#### HOR-02 Represent uncertainty about the user's goals

- `src/model/rank.ts:98` A real swipe beats the guess: a place the member liked counts as a match for them and a skipped one does not, the guess only orders the rest

### Shneiderman and Maes 1997, Direct manipulation vs. interface agents (reading, week 4)

#### DM-01 Direct manipulation

- `src/screens/Ranking.tsx:153` The people filter is the table itself: tap a friend's seat to leave them out, the list re-ranks at once, tap again to undo

#### DM-02 Overview first, zoom and filter, details on demand

- `src/screens/Dashboard.tsx:29` After setup the app opens on an overview (map of the stay and places, group progress, next step) before any swiping

#### DM-04 Users keep responsibility

- `src/components/FrontRunner.tsx:61` The card names a front-runner and how many it suits, not a decision: choosing stays with the group

### Not applied yet

- AMR-03 Time services based on context
- AMR-06 Mitigate social biases
- AMR-07 Support efficient invocation
- AMR-08 Support efficient dismissal
- AMR-12 Remember recent interactions
- AMR-13 Learn from user behavior
- AMR-14 Update and adapt cautiously
- AMR-17 Provide global controls
- AMR-18 Notify users about changes
- MM-02 Mental models are incomplete and sticky
- MM-04 The model of the user is always incomplete
- MM-05 Design for overlooked user groups
- MM-06 Encourage safe experimentation, do not learn from first use
- MM-07 Make privacy verifiable, not "trust me"
- ERR-01 Feedforward and feedback across the seven stages of action
- ERR-02 Slips vs. mistakes
- ERR-03 Consistency enables habituation
- ERR-04 Separate unpredictable AI suggestions from the predictable UI
- ERR-05 Correcting the AI must cost no more than not using it
- ERR-06 Gulf of envisioning
- ERR-07 Failures beyond the users
- ERR-08 Reward hacking and Goodhart's law
- ERR-09 Goal misgeneralization
- ERR-10 Training data errors: let users correct data
- ERR-11 Input errors: check inputs against expectations
- ERR-13 System hierarchy errors: show which sources drive the result
- ERR-14 Error audit
- NOR-01 Affordances
- NOR-02 Signifiers
- NOR-03 Mapping
- NOR-04 Feedback
- NOR-05 Constraints
- NOR-06 Conceptual model
- FAIR-02 Consistency
- FAIR-06 Unawareness is not enough
- FAIR-07 Historical bias
- FAIR-08 Representation bias
- FAIR-09 Measurement bias
- FAIR-11 Evaluation bias
- FAIR-12 Deployment bias
- FAIR-15 Contestability
- FAIR-18 Confidence is not accuracy, calibrate it
- FAIR-19 Model card
- FAIR-20 Envision first: should this feature exist?
- XAI-01 Calibrated trust
- XAI-02 One unforgivable error
- XAI-03 Trust factors: competence, intention, understandability, directability
- XAI-04 Negative trust is a design smell
- XAI-05 Automation creates invisible work
- XAI-06 Know the audience
- XAI-07 Causal over correlational explanations
- XAI-08 Simple but not oversimplified
- XAI-11 Local vs. global explanations
- XAI-12 Prefer ante-hoc (interpretable) models where possible
- XAI-14 Example-based explanations
- XAI-15 Counterfactual explanations
- XAI-16 Feature attribution (SHAP)
- XAI-17 Local surrogates are only locally faithful (LIME)
- XAI-18 Explainability tools can be weaponised
- HCAI-01 Augment, do not replace
- HCAI-03 Pick the level of automation deliberately
- HCAI-04 HCAI is a process
- HCAI-05 Guard against the three threats
- HOR-01 Automate only where it adds real value
- HOR-03 Time services to the user's attention
- HOR-04 Weigh costs, benefits and uncertainty before acting
- HOR-05 Use dialog to resolve key uncertainties
- HOR-06 Efficient direct invocation and termination
- HOR-07 Minimise the cost of poor guesses
- HOR-08 Scope precision to match uncertainty
- HOR-09 Support collaboration to refine results
- HOR-10 Socially appropriate behaviour
- HOR-11 Working memory of recent interactions
- HOR-12 Keep learning by observing
- HOR-13 Act, ask or stay silent by probability thresholds
- HOR-14 Degrade gracefully to a scoped view
- HOR-15 Offer modes from manual to automatic
- DM-03 Dynamic queries
- DM-05 Adaptive algorithms below a predictable surface
- DM-06 Avoid anthropomorphism
- DM-07 Visible, editable user model
- DM-08 Delegate details, keep goals
- DM-09 The agent must be bypassable
- DM-10 Show what the agent is focusing on
- DM-11 Accessible alternatives to gestures
- DM-12 Measure with real users
- PROC-01 Ground features in task analysis
- PROC-02 Elicit mental models in tests

<!-- END GENERATED -->
