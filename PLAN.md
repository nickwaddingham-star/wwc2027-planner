# Women's World Cup 2027 trip planner: plan

Approved 26 November 2026

## Context

Fans pick matches, and those set their cities, dates, flights, stays and free time. This is a public, worldwide website (later run and hosted by FIFA) that turns "I live here and want these matches" into one continuous trip. The first release runs on your own computer.

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

## Assumptions

- English first, with screen text in one file for later translation.
- Trip saved in the browser. No accounts or personal data.
- A "prototype" label and the sample schedule notice stay on every screen.
- Group size is entered as adults and children. Very large groups get a notice to split searches.
- The website isn't hosted online. Its source code is in a public GitHub repository, chosen by the owner on 26 November 2026.

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

## Before handing to FIFA (later)

- Official fixtures and partner-approved links or data.
- Approved brand files and guidelines in place of website copies, with written permission from FIFA and each partner.
- Portuguese, Spanish and other languages.
- Privacy, cookie and advertising-disclosure review.
- Accessibility, security and traffic testing.
- A way to edit content without code.
