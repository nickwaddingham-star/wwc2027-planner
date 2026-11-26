# Women's World Cup 2027 trip planner: plan

Approved 26 November 2026

## Context

Fans pick matches, and those set their cities, dates, flights, stays and free time. This is a public, worldwide website (later run and hosted by FIFA) that turns "I live here and want these matches" into one continuous trip. The first release was built to run on your own computer and is now also online as a public prototype.

## Decisions

| Topic | Decision |
|---|---|
| Users | Public, worldwide; one continuous trip; any group size; matches picked individually |
| Flights | Estimates with search links, ranked for a balance of price and time |
| Qatar Airways | Listed first only if its journey takes at most 25% longer than the best balanced option. Otherwise it stays in its ranked place. Always labelled as a FIFA partner |
| Airbnb | Main button on every stay |
| Other sites | Smaller secondary links |
| Sample matches | Real team names, with a "sample schedule, not official" notice |
| Local testing | Small PowerShell server, execution-policy bypass for that one process only |
| Branding | FIFA logos and branding, on the owner's confirmation that they may be used. Taken from FIFA's public website |
| Partner logos | Qatar Airways and Airbnb logos included, on the owner's confirmation, obtained the same way |
| FIFA Approved activities | Promoted: labelled and listed first. A sample list, marked "Example", until FIFA's API exists |
| Booking from "Your trip" | Flights on Booking.com (Qatar choices also link to Qatar Airways), accommodation on Airbnb, activities on their own websites |
| Saved trips | Signed-in visitors save and retrieve several trips. Demo sign-in first, FIFA ID later |
| Design | FIFA.com style across the whole site ("Option B", chosen 26 November 2026), without story circles. The route map stays beside planning screens |
| Navigation | The same two-level bar as FIFA's tournament pages, linking to FIFA's own pages. The planning steps sit under the countdown, starting with "Start Trip" |

## FIFA Approved activities (future)

FIFA will eventually provide a list of approved activities through an API.

- **Now:** `js/approved.js` holds a sample list. FIFA has not approved any of these, so each label says "Example" and the page says so.
- **Later:** the site reads the list from FIFA's API and the "Example" marking is removed.
- **Needed from FIFA:** API address and access method, the fields returned (activity ID, city, name, booking website, price, dates available), how often the list changes, and terms for showing the "FIFA Approved" label.
- **To build then:** loading and error states, a stored copy for when the API is unavailable, and matching of FIFA's activities to cities and trip days. A private access key would need a server, which the current site doesn't have.

## Accounts and saved trips (demo version built 26 November 2026)

Visitors can save their travel plan and come back to it. When signed in, they can save several trips and retrieve them.

### First version: demo sign-in

| Topic | Plan |
|---|---|
| Sign-in | A "Demo sign-in" asking only for a display name. No password or email, and clearly marked as not FIFA ID |
| Where trips are kept | In the visitor's browser, listed under that name. They don't follow the visitor to another device, and clearing browser data removes them |
| Privacy | Not secure: anyone using the same browser can open the trips by entering the same name. The sign-in screen says so |
| Signed out | Planning works as it does now, and the current plan stays in the browser |
| Signing in | Offers to save the current plan, so nothing is lost |
| My trips | Save with a name, see a list (name, travel dates, cities, number of matches, last saved), open, update, rename and delete. Deleting asks first |
| What a trip stores | The visitor's choices: home city, group, matches, dates, flights, stays and activities |
| Reopening | Estimates are recalculated. The visitor is told if a saved match or activity no longer exists |
| Signing out | Clears the plan from the screen and keeps the saved trips |

Sign-in and trip storage sit behind one file (`js/account.js`), so FIFA ID can replace them without rewriting the screens.

Tests: save several trips, reopen each, rename, update, delete, sign out and back in, keep two names separate, and cope with damaged or out-of-date saved data. Check on phone and desktop, and by keyboard.

### Later: FIFA ID

- **Change:** FIFA ID replaces the demo sign-in, and trips are stored on a server so they follow the visitor across devices.
- **Needed from FIFA:** how sites connect to FIFA ID, technical documents and test accounts, which profile details are shared, and rules for storing and keeping data.
- **To build then:** a server and database (the current site has neither), secure sign-in sessions, consent and privacy notices (including GDPR and Brazil's LGPD), account deletion and data export, and a way to move browser-saved trips into the account.

## Assumptions

- English first, with screen text in one file for later translation.
- The current plan and saved trips stay in the browser. There are no real accounts and no data is sent to a server. The demo sign-in keeps a display name in the browser only.
- A "prototype" label and the sample schedule notice stay on every screen.
- Group size is entered as adults and children. Very large groups get a notice to split searches.
- The website is public at https://wwc2027-planner.vercel.app (hosted by Vercel), and its source code is in a public GitHub repository. The owner chose to keep both public on 26 November 2026. Changes merged into `main` are expected to publish to the live site.

## Build order

| Step | Work |
|---|---|
| 0 | Local server (`serve.ps1`), preview setup, browser tests (`tests.html`) |
| 1 | Data: airport and route tables, about 150 home cities, currencies, fixed sample schedule |
| 2 | Logic: one ranking for all flights, Qatar rule, home-city handling, dates, activity rules |
| 3 | Check every kind of search link in the browser |
| 4 | Logos and branding (ask before each download), then home, matches and itinerary screens |
| 5 | Flights, stays, activities and trip summary screens |
| 6 | End-to-end tests from five continents, phone and desktop, keyboard only |
| 7 | Demo sign-in and saved trips (built) |
| 8 | Automated tests on every pull request, required before merging into `main` (built) |
| Later | Tests for budget totals, countdown and headlines, phone width and keyboard use; a weekly check of external links |

## Before handing to FIFA (later)

- Official fixtures and partner-approved links or data.
- Replace the sample "FIFA Approved" list with FIFA's API.
- Replace the demo sign-in with FIFA ID and move saved trips to a server.
- Approved brand files and guidelines in place of website copies, with written permission from FIFA and each partner.
- Portuguese, Spanish and other languages.
- Privacy, cookie and advertising-disclosure review.
- Accessibility, security and traffic testing.
- A way to edit content without code.
