# HCAI principles catalogue

Every principle the code may cite with an `@hcai <ID>` tag. Written in our own
words from the HS26 Human-Centered AI course (lecturer Chat Wacharamanotham)
and its assigned readings. No slide text is copied here, the repo is public.

Format of each entry:

- `### ID Name` (the script parses this line, keep it exact)
- What it means.
- *In our app:* one concrete way it shows up in Restaurant Tinder.
- Source pointer (lecture number and PDF page, or the paper).

IDs are stable. Never renumber. Add new principles at the end of a section
with the next free number.

Lecture shorthands: L04 = Design Principles for HCAI Systems, L06 = Fairness
and HCAI, L07 = Explainability (title slide says Lecture 7, file is week 8).

## Amershi et al. 2019, Guidelines for Human-AI Interaction (L04 p.66)

18 guidelines grouped by when they apply. The lecture notes they predate LLMs.

### AMR-01 Make clear what the system can do
Tell users up front what the AI does and what it does not do.
*In our app:* onboarding card "We learn your taste from swipes and rank places for the whole group."

### AMR-02 Make clear how well the system can do what it can do
Be honest about how often it will be wrong.
*In our app:* hedged copy ("likely a hit") and a weaker confidence hint while a member has few swipes.

### AMR-03 Time services based on context
Act or interrupt when it fits what the user is doing.
*In our app:* show the group ranking when everyone finished swiping, never mid-deck.

### AMR-04 Show contextually relevant information
Show what matters for the current task and situation.
*In our app:* cards show open-now, distance from the hotel or group midpoint, price level.

### AMR-05 Match relevant social norms
Behave the way users socially expect.
*In our app:* never reveal who vetoed a place unless the group opted in. Casual, friendly tone.

### AMR-06 Mitigate social biases
Make sure language and behaviour do not reinforce unfair stereotypes.
*In our app:* do not let photo quality bury cheap or non-Western places, do not let the most active swiper dominate.

### AMR-07 Support efficient invocation
Make it easy to call the AI when wanted.
*In our app:* a visible "Pick for us" button.

### AMR-08 Support efficient dismissal
Make it easy to ignore or close AI output.
*In our app:* swipe away the AI top pick, suggestions never block the plain list.

### AMR-09 Support efficient correction
Make it easy to fix the AI when it is wrong.
*In our app:* undo last swipe, edit "the app thinks I like spicy, I don't".

### AMR-10 Scope services when in doubt
When unsure, ask or do less instead of guessing big.
*In our app:* with few swipes or a split group, show three options and ask "which vibe tonight?".

### AMR-11 Make clear why the system did what it did
Offer an explanation of the AI's behaviour.
*In our app:* "Ranked #1 because 4 of 5 of you liked similar Thai places, 600 m away."

### AMR-12 Remember recent interactions
Keep short-term memory the user can refer back to.
*In our app:* recently swiped strip, session filters persist.

### AMR-13 Learn from user behavior
Personalise over time from what users do.
*In our app:* the per-member preference model trained on swipes.

### AMR-14 Update and adapt cautiously
Avoid jarring changes when the model adapts.
*In our app:* the visible list does not reshuffle while open, new picks appear on refresh.

### AMR-15 Encourage granular feedback
Let users express preferences in normal use, beyond yes and no.
*In our app:* "love it", "not tonight", "too pricey" in addition to like and nope.

### AMR-16 Convey the consequences of user actions
Show how an action changes future AI behaviour.
*In our app:* after a nope, "You'll see fewer burger places."

### AMR-17 Provide global controls
Let users set overall what the AI watches and how it behaves.
*In our app:* settings to pause learning, turn off location, set dietary constraints.

### AMR-18 Notify users about changes
Tell users when the AI gains or changes capabilities.
*In our app:* "New: ranking now considers opening hours."

## Mental models and the model of the user (L04 p.4 to 19)

### MM-01 Three models must line up
The designer's conceptual model, the user's mental model and, for AI, the system's model of the user. The design (system image) is the only channel between designer and user.
*In our app:* if the UI never shows that one person's nope lowers a place for everyone, users invent "majority vote" or "random". (L04 p.5, p.9, Norman 2013)

### MM-02 Mental models are incomplete and sticky
People's understanding is partial, often wrong, and revised reluctantly, so first impressions persist.
*In our app:* get the onboarding explanation right the first time. (L04 p.5)

### MM-03 Make the AI's model of the user visible
The system's picture of the user should be inspectable so the user's mental model can match it.
*In our app:* a "what the app thinks you like" screen per member. (L04 p.9)

### MM-04 The model of the user is always incomplete
Mood, budget tonight, allergies, what they ate yesterday are invisible to the AI, and users may refuse to share data.
*In our app:* session overrides like "tonight: cheap, veggie, close". (L04 p.14)

### MM-05 Design for overlooked user groups
One optimisation target ignores people with different needs (the Google Maps "fastest route" example).
*In our app:* wheelchair access, halal, vegan act as hard group filters separate from taste. (L04 p.15)

### MM-06 Encourage safe experimentation, do not learn from first use
Tell users when personalisation starts so exploring is safe.
*In our app:* "Your first 10 swipes are warm-up." (L04 p.16, PAIR Guidebook)

### MM-07 Make privacy verifiable, not "trust me"
Users need real control and visible signals over data capture, not reassuring text only.
*In our app:* opt-in swipe learning, view and delete my profile. (L04 p.17 to 18)

## Errors and AI failure modes (L04 p.28 to 64)

### ERR-01 Feedforward and feedback across the seven stages of action
Help users before acting (what can I do, how) and after (what happened, is it ok). Norman's seven stages.
*In our app:* hint "swipe right = I'd go here" (feedforward), "Got it, more ramen coming" (feedback). (L04 p.29)

### ERR-02 Slips vs. mistakes
A slip is the right intention executed wrongly (attention). A mistake is the wrong goal or plan (understanding). Slips need undo, mistakes need a clearer conceptual model.
*In our app:* accidental left swipe gets undo. Thinking left means "later" gets fixed by clearer onboarding. (L04 p.29 to 30)

### ERR-03 Consistency enables habituation
Skill-based use only forms when mappings never change. Inconsistent UIs cause slips (swapped confirm buttons on game consoles).
*In our app:* right = like on every screen, never flipped. (L04 p.30 to 31)

### ERR-04 Separate unpredictable AI suggestions from the predictable UI
Adaptive UIs that reorder things turn habits back into decisions. Keep the AI in its own marked area, and prefer predictable over smart for high-stakes tasks.
*In our app:* "AI top pick" box above a stable list sortable by distance or price. (L04 p.32, Fisher "Predictably Smart")

### ERR-05 Correcting the AI must cost no more than not using it
If fixing an AI error is more work than doing the task by hand, the AI is a net loss.
*In our app:* overriding the AI pick is one tap. (L04 p.32)

### ERR-06 Gulf of envisioning
With open natural-language input, users struggle to imagine what to ask and what they will get.
*In our app:* if we add "what are you craving?", give example prompts and chips. (L04 p.33 to 34, Subramonyam et al. 2024)

### ERR-07 Failures beyond the users
Individually rational AI choices can harm third parties collectively (Los Gatos gridlock from navigation apps).
*In our app:* if every group in town gets the same 7pm top pick, that place is overrun. Consider capacity and diversity. (L04 p.41 to 44)

### ERR-08 Reward hacking and Goodhart's law
Optimising an easy proxy gets satisfied in unintended ways. A measure that becomes a target stops measuring.
*In our app:* do not optimise right-swipe count or time in app. Optimise "we went and liked it". (L04 p.48 to 50)

### ERR-09 Goal misgeneralization
A model that works in training pursues the wrong thing in new conditions (cows not recognised on beaches).
*In our app:* the model may learn "warm lighting" instead of "likes Italian". Test with varied photo styles. (L04 p.45 to 47)

### ERR-10 Training data errors: let users correct data
Capability is capped by the data. Let users fix labels and feed fixes back.
*In our app:* "wrong cuisine tag" and "photo isn't from here" flags. (L04 p.52, PAIR)

### ERR-11 Input errors: check inputs against expectations
Users expect to be understood. Offer "did you mean" and explain how input maps to output.
*In our app:* "sushi near uni" with no hits suggests "Japanese within 2 km?". (L04 p.53 to 54, PAIR)

### ERR-12 Context errors: explain no-result and offer alternatives
The output does not fit the moment (wrong time, place, format).
*In our app:* never suggest closed places. If nothing fits, say why and offer to widen the radius. (L04 p.55, PAIR)

### ERR-13 System hierarchy errors: show which sources drive the result
Several AI systems interacting without coordination distort each other (Google Flu Trends).
*In our app:* show whether "our taste" or "public ratings" drives a rank and let the group weight them. (L04 p.56, PAIR)

### ERR-14 Error audit
List failures, who notices them, the stakes, and the design response. Monitor after launch.
*In our app:* an error-audit table in docs, override logging. (L04 p.57, PAIR)

## Norman's design principles (self-study week, Norman 2013)

The course set Norman's principles as self-study. These entries come from Norman (2013), The Design of Everyday Things, not from lecture slides.

### NOR-01 Affordances
What actions an object physically allows.
*In our app:* cards look draggable, so swiping is possible.

### NOR-02 Signifiers
Visible cues that show where and how to act.
*In our app:* like and nope icons at the card edges, a hint on the first card.

### NOR-03 Mapping
The relation between a control and its effect should feel natural.
*In our app:* swipe right moves the card right and means yes.

### NOR-04 Feedback
Immediate, informative response to every action.
*In our app:* card animates away, counter updates instantly.

### NOR-05 Constraints
Limit possible actions to prevent errors.
*In our app:* the "Let's go here" button is disabled until at least one member has swiped.

### NOR-06 Conceptual model
A simple, correct story of how the system works, conveyed by the design.
*In our app:* "Everyone swipes, the app blends your tastes into one list."

## Fairness, accountability, ethics (L06)

### FAIR-01 Accountability
It is clear who or what produced each decision.
*In our app:* record whether a result came from the AI ranking, dictatorship mode (and who) or a filter. (L06 p.13)

### FAIR-02 Consistency
A tiny input change must not cause a huge output swing.
*In our app:* one extra swipe must not flip the whole top 5. (L06 p.13)

### FAIR-03 Corrigibility
There is an appeal path and a clear final say.
*In our app:* members can reject the ranking and re-vote. Spell out whether a pin or the group has the last word. (L06 p.13)

### FAIR-04 Procedural vs. distributive justice: equality or equity
Fair process vs. fair outcomes. On the slides, equality means equal weight for everyone, equity means more input earns more output.
*In our app:* decide and show whether heavy swipers get more influence. Default to equal weight per member. (L06 p.12)

### FAIR-05 Pick a fairness notion deliberately
Individual, group and subgroup fairness, demographic parity, equal opportunity, equalized odds and others cannot all hold at once (impossibility of fairness). The choice is a design decision.
*In our app:* document whether we equalise member satisfaction or restaurant exposure. (L06 p.15)

### FAIR-06 Unawareness is not enough
Leaving out protected attributes does not help when proxies (photos, location, tastes) encode them.
*In our app:* no age or gender input to the ranker, and still check results per member type. (L06 p.15)

### FAIR-07 Historical bias
Even perfect data mirrors past inequities. Mirroring reality is a social choice, not a technical one.
*In our app:* "the average demographic that likes this place" reproduces existing social patterns. (L06 p.20 to 22)

### FAIR-08 Representation bias
The sample under-covers part of the population.
*In our app:* early users are young urban students, and well-marketed places have the best photos. (L06 p.23 to 24)

### FAIR-09 Measurement bias
Data records a proxy for what we care about, unevenly, sometimes with feedback loops.
*In our app:* a right swipe on a photo is a proxy for "would enjoy eating there", and shown places get more swipes. (L06 p.26)

### FAIR-10 Aggregation bias
One model for everyone can serve subgroups badly.
*In our app:* averaging members can produce a compromise nobody likes. Use per-member models plus an explicit rule (for example least misery, veto for hard constraints). (L06 p.27)

### FAIR-11 Evaluation bias
One headline metric hides subgroup failures.
*In our app:* report satisfaction per member (outvoted, dietary-restricted, new), not only the average. (L06 p.28)

### FAIR-12 Deployment bias
Harm from a gap between designed use and actual use.
*In our app:* the demographic label could be read as "this place is for X", and dictatorship mode can be used to dominate. (L06 p.29)

### FAIR-13 Harm types
Allocation, quality of service, stereotyping, denigration, over- or under-representation (AI Fairness Checklist).
*In our app:* name which harm each risky feature could cause. (L06 p.35, Madaio et al. 2020)

### FAIR-14 Recourse
A person can act to get a different outcome.
*In our app:* "swipe more to improve your picks", hard constraints like "no meat". (L06 p.16)

### FAIR-15 Contestability
Users can challenge an output.
*In our app:* reject a top pick and trigger re-ranking. (L06 p.16)

### FAIR-16 User auditing
Users can probe the system for unfairness themselves.
*In our app:* the filter-by-member view shows whose taste dominates. (L06 p.16)

### FAIR-17 Privacy: consent, control, erasure
People keep a say over collection, use, correction and deletion of their data (Principled AI themes).
*In our app:* opt-in for any demographic data, erase my swipe profile. (L06 p.5 to 6, Fjeld et al. 2020)

### FAIR-18 Confidence is not accuracy, calibrate it
A model can be very confident and wrong. Stated confidence should match real hit rates.
*In our app:* no "100% match", low confidence for members with few swipes. (L06 p.8 to 11)

### FAIR-19 Model card
Ship a short document with intended use, out-of-scope use, per-group performance and known biases.
*In our app:* docs/model-card.md for the preference model. (L06 p.37, Mitchell et al. 2019)

### FAIR-20 Envision first: should this feature exist?
The fairness checklist starts by asking whether a feature, or AI at all, is needed.
*In our app:* question the demographic display before building it. (L06 p.35, Madaio et al. 2020)

## Explainability and trust (L07)

### XAI-01 Calibrated trust
Over-trust leads to misuse (complacency), under-trust to disuse. Aim for trust that matches real performance.
*In our app:* show confidence with the ranking, "low confidence, only 6 swipes from Ben". (L07 p.7, Parasuraman and Riley 1997)

### XAI-02 One unforgivable error
A single costly error can destroy trust built over many successes.
*In our app:* hard-filter closed places and dietary conflicts instead of soft-scoring them. (L07 p.9)

### XAI-03 Trust factors: competence, intention, understandability, directability
Users trust systems they know work, that act in their interest, that they understand, and that they can steer quickly.
*In our app:* "not sponsored" note, status line "based on 42 swipes from 4 of 5 members", veto and pin. (L07 p.12)

### XAI-04 Negative trust is a design smell
Predictable failures breed workarounds and inefficiency.
*In our app:* if groups keep picking from the bottom of the list, treat it as a miscalibration signal. (L07 p.13)

### XAI-05 Automation creates invisible work
Real use adds coordination the planned flow does not show (the hospital robot case).
*In our app:* design for members who never swipe, and for ties. (L07 p.10 to 11)

### XAI-06 Know the audience
Affected users, domain users, developers, regulators and managers need different explanations.
*In our app:* plain fairness-oriented reasons for members, a debug view with raw weights for us. (L07 p.20, Arrieta et al. 2020)

### XAI-07 Causal over correlational explanations
People prefer explanations of causes, which transfer to new situations.
*In our app:* "because you liked 5 ramen spots", not "users like you also liked". (L07 p.21)

### XAI-08 Simple but not oversimplified
Detail should fit expertise and task. One headline reason, more on demand.
*In our app:* one-line reason with a "more" expander. (L07 p.21)

### XAI-09 Choose the explanation format on purpose
Visual, verbal, interactive and narrative formats work differently.
*In our app:* per-member fit bars plus one sentence. (L07 p.21)

### XAI-10 Unwarranted faith in numbers
Raw numbers look intelligent and invite unearned trust, especially from non-experts. Reasons work better for lay users.
*In our app:* never show "0.8734" to members, numbers only in the developer view. (L07 p.24, Ehsan et al. 2024)

### XAI-11 Local vs. global explanations
Local explains one prediction, global describes overall behaviour.
*In our app:* "why is Pho 88 #1?" vs. "what the app thinks our group likes". (L07 p.22 to 23, Speith 2022)

### XAI-12 Prefer ante-hoc (interpretable) models where possible
Explainability built into the model beats explaining a black box after the fact.
*In our app:* a linear or small tree preference model whose weights are the explanation. (L07 p.18 to 23)

### XAI-13 Accuracy vs. interpretability, use interpretable features
More accurate model families tend to be less interpretable. Interpretable features soften the trade-off.
*In our app:* rank on cuisine, price, distance, vibe tags rather than raw photo embeddings. (L07 p.19, Arrieta et al. 2020)

### XAI-14 Example-based explanations
Justify a prediction with the examples that shaped it. It also exposes mistakes.
*In our app:* "because it looks like these places you liked", with the member's own liked photos. (L07 p.31)

### XAI-15 Counterfactual explanations
The smallest input change that would change the result. They also reveal bias.
*In our app:* "would be #1 if it were 5 CHF cheaper". (L07 p.32)

### XAI-16 Feature attribution (SHAP)
Each feature's contribution to a prediction, summing to the gap from the baseline. Direction matters.
*In our app:* treat members as players, so each member's Shapley value is their share of influence on the group pick. (L07 p.35 to 41, Lundberg and Lee 2017)

### XAI-17 Local surrogates are only locally faithful (LIME)
A local explanation can misrepresent the model's global behaviour.
*In our app:* label per-restaurant reasons as about that restaurant only. (L07 p.36 to 37, Ribeiro et al. 2016)

### XAI-18 Explainability tools can be weaponised
Methods that reveal model internals can also steer models, for example for covert advertising.
*In our app:* no commercial influence on rankings or explanations, disclose any sponsorship. (L07 p.29)

## Human-Centered AI framework (Shneiderman 2022, in L06 and L07)

### HCAI-01 Augment, do not replace
The AI supports the human decision rather than making it.
*In our app:* the app suggests, the group decides. (L07 p.50)

### HCAI-02 High control and high automation together
Control and automation are not one slider. Aim for "reliable, safe, trustworthy": strong automation that users can still steer.
*In our app:* automatic ranking plus veto, pin and re-weight. (L07 p.46 to 49)

### HCAI-03 Pick the level of automation deliberately
Ten levels from "no help" to "acts ignoring the human" (Sheridan and Verplank).
*In our app:* levels 3 to 5 (shortlist, suggest one, act only with approval). Never auto-book without a veto window. (L07 p.45)

### HCAI-04 HCAI is a process
User observation, stakeholder engagement, usability testing, iteration, continuing evaluation.
*In our app:* test the ranking and explanations with real friend groups and iterate. (L07 p.50)

### HCAI-05 Guard against the three threats
Bias, flawed software, malicious actors.
*In our app:* rate-limit swipes and block fake accounts gaming the group ranking. (L06 p.33, L07 p.51)

## Horvitz 1999, Principles of mixed-initiative user interfaces (reading, week 4)

### HOR-01 Automate only where it adds real value
Use AI where it clearly beats what users could easily do by hand.
*In our app:* AI merges five people's swipes, not trivial sorting by distance.

### HOR-02 Represent uncertainty about the user's goals
Never treat the best guess as certain.
*In our app:* store `{score, confidence, nSwipes}`, never a bare score.

### HOR-03 Time services to the user's attention
When an action arrives matters as much as what it is.
*In our app:* queue "ranking changed" until the end of a deck.

### HOR-04 Weigh costs, benefits and uncertainty before acting
Choose actions by expected value, not habit.
*In our app:* background re-ranking is cheap if wrong, auto-booking is not. Gate each by its cost of error.

### HOR-05 Use dialog to resolve key uncertainties
Ask when unsure, but weigh the answer's value against the interruption.
*In our app:* a dismissible chip "Not into curry tonight?", never a blocking modal.

### HOR-06 Efficient direct invocation and termination
Users can start or stop the service themselves, quickly.
*In our app:* one-tap "Rank now" and "sort manually" toggle.

### HOR-07 Minimise the cost of poor guesses
Wrong guesses should be cheap: offers time out, declining is a natural gesture.
*In our app:* prompts fade on their own, one-tap undo, nothing irreversible on a guess.

### HOR-08 Scope precision to match uncertainty
When unsure, do less but do it right.
*In our app:* low data gives a top-3 shortlist, high confidence gives an exact order.

### HOR-09 Support collaboration to refine results
Assume users will finish or adjust what the AI produces.
*In our app:* the AI ranking is a draggable draft the group refines.

### HOR-10 Socially appropriate behaviour
The agent behaves like a polite, considerate assistant.
*In our app:* no nagging, never single out a member's veto publicly.

### HOR-11 Working memory of recent interactions
Remember shared recent context.
*In our app:* "show the one with the terrace again", undo my last 3 swipes.

### HOR-12 Keep learning by observing
Use ongoing behaviour as training signal.
*In our app:* re-ranks, pins and the place actually chosen are stronger signals than swipes.

### HOR-13 Act, ask or stay silent by probability thresholds
Expected utility gives two thresholds. Below the first do nothing, between them ask, above the second act. Thresholds shift with context.
*In our app:* `decide(p) -> 'none' | 'ask' | 'act'` per AI feature, bolder when the group is in a hurry.

### HOR-14 Degrade gracefully to a scoped view
If the exact answer is uncertain, show the right neighbourhood instead of a wrong point.
*In our app:* conflicting tastes show "Italian or Thai, under 30 CHF, within 1 km" instead of one forced winner.

### HOR-15 Offer modes from manual to automatic
Manual, hint-only and automatic modes let users choose how much the agent does.
*In our app:* AI suggestions "off / hint / auto-rank".

## Shneiderman and Maes 1997, Direct manipulation vs. interface agents (reading, week 4)

### DM-01 Direct manipulation
Visible objects, rapid small reversible actions, immediate feedback (about 100 ms).
*In our app:* swipes, drags and pins update instantly and can be undone.

### DM-02 Overview first, zoom and filter, details on demand
Show the whole option space, let users narrow it, then open details.
*In our app:* ranked overview or map, live filters, detail card on tap.

### DM-03 Dynamic queries
Sliders and buttons that reshape the display live.
*In our app:* price, distance and diet filters instantly reshape the list.

### DM-04 Users keep responsibility
Comprehensible, predictable, controllable systems let users take responsibility for outcomes.
*In our app:* the final "Let's go here" is always an explicit human tap.

### DM-05 Adaptive algorithms below a predictable surface
Adaptation is fine underneath as long as the visible UI stays predictable.
*In our app:* pinned items never move, user re-ranks are never silently undone.

### DM-06 Avoid anthropomorphism
Human-like agents mislead, raise anxiety and weaken control and responsibility.
*In our app:* "Your group's ranking", not "I picked this for you". No mascot.

### DM-07 Visible, editable user model
The agent's model of the user should be visible and explanations available (Maes and Shneiderman agree).
*In our app:* per-member taste profile the member can edit or reset.

### DM-08 Delegate details, keep goals
Users hand over the how, not the what.
*In our app:* users set likes, pins and hard constraints, the app does the weighting math.

### DM-09 The agent must be bypassable
A complete manual path must work with the AI off.
*In our app:* browse, search and sort fully usable without the ranking.

### DM-10 Show what the agent is focusing on
Users must see what automation latched onto (the autofocus camera anecdote).
*In our app:* "ranked mainly on price, Thai, distance".

### DM-11 Accessible alternatives to gestures
Visual DM needs non-visual and non-gesture equivalents.
*In our app:* like, nope and pin buttons with keyboard and screen-reader labels next to the swipe.

### DM-12 Measure with real users
Judge designs by learning time, task speed, errors and retention, not by claims of friendliness.
*In our app:* log time to group decision and number of overrides in user tests.

## Process (L04 task analysis and mental-model elicitation)

### PROC-01 Ground features in task analysis
Observe and interview real people doing the task, then derive sequence, physical and artifact models before designing UI.
*In our app:* each feature traces back to a breakdown from our interviews. (L04 p.20 to 27, Holtzblatt et al. 2005)

### PROC-02 Elicit mental models in tests
Prediction tasks, teach-back, think-aloud and similar methods reveal what users believe.
*In our app:* ask testers to predict where five restaurants land in the group ranking and why. (L04 p.6 to 7, Hoffman et al. 2023)

## References

- Amershi, S., et al. (2019). Guidelines for Human-AI Interaction. CHI 2019.
- Arrieta, A. B., et al. (2020). Explainable Artificial Intelligence (XAI): Concepts, taxonomies, opportunities and challenges toward responsible AI. Information Fusion, 58.
- Ehsan, U., et al. (2024). The Who in XAI: How AI Background Shapes Perceptions of AI Explanations. CHI 2024.
- Fisher, K. (2018). Predictably Smart. Google Design.
- Fjeld, J., et al. (2020). Principled Artificial Intelligence. Berkman Klein Center.
- Google PAIR. People + AI Guidebook. pair.withgoogle.com/guidebook
- Hoffman, R. R., et al. (2023). Measures for explainable AI. Frontiers in Computer Science, 5.
- Holtzblatt, K., Wendell, J. B., and Wood, S. (2005). Rapid Contextual Design. Morgan Kaufmann.
- Horvitz, E. (1999). Principles of mixed-initiative user interfaces. CHI 1999, 159 to 166.
- Lundberg, S. M., and Lee, S.-I. (2017). A unified approach to interpreting model predictions. NIPS 2017.
- Madaio, M., et al. (2020). Co-Designing Checklists to Understand Organizational Challenges and Opportunities around Fairness in AI. CHI 2020.
- Mehrabi, N., et al. (2021). A Survey on Bias and Fairness in Machine Learning. ACM Computing Surveys.
- Mitchell, M., et al. (2019). Model Cards for Model Reporting. FAT* 2019.
- Norman, D. A. (2013). The Design of Everyday Things, revised edition. Basic Books.
- Parasuraman, R., and Riley, V. (1997). Humans and automation: Use, misuse, disuse, abuse. Human Factors, 39(2).
- Ribeiro, M. T., Singh, S., and Guestrin, C. (2016). "Why Should I Trust You?" KDD 2016.
- Shneiderman, B. (2022). Human-Centered AI. Oxford University Press.
- Shneiderman, B., and Maes, P. (1997). Direct manipulation vs. interface agents. interactions, 4(6), 42 to 61.
- Speith, T. (2022). A Review of Taxonomies of Explainable Artificial Intelligence (XAI) Methods. FAccT 2022.
- Subramonyam, H., et al. (2024). Bridging the Gulf of Envisioning. CHI 2024.
- Suresh, H., and Guttag, J. (2021). A Framework for Understanding Sources of Harm throughout the Machine Learning Life Cycle. EAAMO 2021.

Verify each reference (DOI or library entry) before citing it in the report, the course requires verifiable citations.
