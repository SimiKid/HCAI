## Product

Working title: Restaurant Tinder. A group picks a restaurant by swiping on
restaurant pictures. The app ranks restaurants for the whole group.

### User journey

Each step has a core flow and the prototype features that belong to it.
All listed features are in scope for the prototype.

1. Create a profile
   - Questions about the user.
   - Core person information: allergies, diets.

2. Join a group or trip
   - Questions about the user and the trip (hotel, area, dates).
   - Trip-specific preferences, for example "I want to eat traditionally"
     or "trendy areas".

3. Swipe pictures
   - The user swipes on restaurant pictures. Swipe as much as you want.
   - The app needs as little data as possible to work.
   - Each swipe trains the algorithm on the user's preferences.
   - Each card shows: location, price level (dollar signs), radius,
     reviews including numbers.

4. Ranked list of restaurants for the group
   - One ranked list for the whole group.
   - Shows the expected reservation time.
   - The user can re-rank the list with their own preferences.
   - Map view of the results.
   - Shows the average demographic that likes each restaurant.
   - Dictatorship mode: one user pins a restaurant to the top of the list.
   - People filter: dissect the ranking by group member.

### Decisions

- Restaurant pictures and data: scrape Google.
- Group ranking: every member has equal weight. Under the people filter,
  each member's name shows the total number of swipes they have done.
