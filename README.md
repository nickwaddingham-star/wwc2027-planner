# Women's World Cup 2027 trip planner (prototype)

**This is a prototype, not an official FIFA product.** Matches, prices and routes are sample data.
FIFA, Qatar Airways and Airbnb names and logos belong to their owners, and this repository grants no right
to reuse them. See `brand/SOURCES.md`.

Live prototype: https://wwc2027-planner.vercel.app (public, hosted by Vercel).

## Open it

Double-click `index.html`. No installation is needed. An internet connection loads the fonts and the partner searches.

To run it as a local web server instead:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Then visit http://localhost:8765/. The bypass applies to that one process only.

## Saved trips and the demo sign-in

Visitors can sign in with a display name to save, open, update, rename and delete several trips.
It is a demonstration, not FIFA ID: there is no password or security, and trips are kept only in that
browser. Anyone using the same browser can open them by entering the same name. Trips saved on one web
address (for example your computer) do not appear on another (the live site).

To connect FIFA ID later, replace `js/account.js` with a version offering the same functions.

## What is sample data

- **Matches:** invented pairings and times on the real tournament dates and stadiums (`js/data.js`).
- **Prices:** flight, stay and activity figures are estimates, not live prices.
- **Routes:** compiled by hand as services that usually operate (`js/airports.js`). Not verified schedules.
- **Qatar Airways destinations:** from Wikipedia's destination list, read 26 November 2026.
- **Currency rates:** rough figures set on 26 November 2026.
- **Neighbourhood and activity notes:** general descriptions that need checking by an editor.
- **"FIFA Approved" labels:** examples only. FIFA has not approved any of these activities.
- **Activity websites:** opened and checked on 26 November 2026. Activities without one link to a tour search.

## Where to change things

| Change | File |
|---|---|
| Matches, neighbourhoods, activities, rates | `js/data.js` |
| Airports, routes, home cities | `js/airports.js` |
| Screen text | `js/strings.js` |
| Logo files | `js/brand.js` |
| Sign-in and trip storage | `js/account.js` |
| What a saved trip contains and how it is checked | `js/trips.js` |
| FIFA Approved list and activity websites | `js/approved.js` |
| Colours and type | top of `styles.css` |
| Ranking, Qatar rule, dates, search links | `js/planner.js` |

The ranking counts each hour of travel like £14 and each change of plane like £40, per person.
Qatar Airways moves to the top only when its journey is no more than 25% longer than the best balanced option.

## Test

| Page | What it tests |
|---|---|
| `tests.html` | Data, trip dates, flight ranking, activities, search links and saved trips |
| `screens.html` | Screens loading, the full journey, booking links, required labels, safety of typed names and missing files |

Open each through the local web server (double-clicking does not work for `screens.html`).
Every line should say "Pass".

GitHub runs both pages, plus a check for private data and missing files (`.github/scripts/check-files.mjs`),
on every pull request and every change to `main`. A pull request can't be merged until the `tests` check passes.
Vercel publishes `main` on its own, so this rule on merging is what keeps failing changes off the live site.

## Search links, checked 26 November 2026

| Link | Result |
|---|---|
| Google Flights | Pass: route and date filled in (London, New York, Sydney and a Brazil flight). Passenger count is not passed |
| Google Flights naming an airline | Fail: search not filled in, so no airline is named |
| Skyscanner | Not verified: it showed a robot check. Open one yourself |
| Qatar Airways | Opens the home page only. The planner shows what to enter |
| Airbnb stays | Pass: area, dates and entire-home filter filled in, and guests where checked |
| Airbnb Experiences | Pass: opens the city. No dates |
| Booking.com stays | Pass: area, dates, guests and rooms filled in |
| Booking.com flights | Pass: London to São Paulo filled in with date and travellers. Children are left out because ages are needed |
| GetYourGuide search address | Fail: ignored the query. Replaced with a Google search of its pages, which passed |
| Google Maps | Pass |
| Coach search (Google) | Pass |

## Before an official release

See `PLAN.md`.
