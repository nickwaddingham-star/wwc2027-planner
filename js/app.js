/* Screens and interaction. Planning decisions live in planner.js. */
(function () {
  const P = WWC.planner;
  const T = WWC.t;
  const STORE = "wwc2027-trip-v1";
  const STEPS = ["start", "matches", "flights", "stays", "activities", "trip"];
  const VIEWS = STEPS.concat("account");
  const { fresh, whole } = WWC.trips;

  /* ---------- State ---------- */

  /* The plan being worked on. tripId links it to a saved trip, if it came from one. */
  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE)); } catch (e) { /* storage unavailable */ }
    const plan = WWC.trips.clean(saved).plan;
    plan.tripId = saved && typeof saved.tripId === "string" ? saved.tripId : null;
    return plan;
  }

  let state = load();
  const filters = { city: "", team: "", stage: "" };
  const ui = { confirmReset: false, copy: "", confirm: null, renaming: null, draft: {} };
  /* Who is signed in and their saved trips, as last read from the account. */
  const session = { user: null, trips: [] };

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Helpers ---------- */

  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dateFormat = new Intl.DateTimeFormat(T.locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const longDate = new Intl.DateTimeFormat(T.locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const day = d => dateFormat.format(new Date(d + "T00:00:00Z"));
  const dayLong = d => longDate.format(new Date(d + "T00:00:00Z"));

  const currentHome = () => P.home(state.home);
  const guests = () => state.adults + state.children;

  function currency() {
    if (state.currency) return state.currency;
    const own = currentHome() ? currentHome().currency : "GBP";
    return WWC.rates[own] ? own : "USD";
  }
  function money(pounds) {
    const code = currency();
    return new Intl.NumberFormat(T.locale, { style: "currency", currency: code, maximumFractionDigits: 0 })
      .format(pounds * WWC.rates[code]);
  }

  const trip = () => P.stops(state.matches, {
    homeId: state.home, arriveBefore: state.arriveBefore, stayAfter: state.stayAfter, moveStyle: state.moveStyle
  });

  const optionCache = new Map();
  function optionsFor(leg) {
    const key = leg.from.join() + ">" + leg.to.join();
    if (!optionCache.has(key)) optionCache.set(key, P.flightOptions(leg));
    return optionCache.get(key);
  }

  function journeys(stops) {
    return P.legs(state.home, stops).map(leg => {
      const options = optionsFor(leg);
      const chosen = options.find(o => o.id === state.flights[leg.id]) || options[0] || null;
      return { leg, options, chosen, dates: P.legDates(leg, chosen) };
    });
  }

  const areaFor = city => WWC.areas[city].find(a => a.id === state.areas[city]) || WWC.areas[city][0];
  const paidStops = stops => stops.filter(s => !s.atHome && s.nights > 0);

  function budget(stops, legs, plan) {
    const flights = legs.reduce((t, j) => t + (j.chosen ? P.groupFare(j.chosen, state.adults, state.children) : 0), 0);
    const stays = paidStops(stops).reduce((t, s) => t + s.nights * P.nightly(areaFor(s.city), state.roomType, guests()), 0);
    const activities = Object.values(plan).reduce((t, p) => t + (p.date ? p.item.cost * guests() : 0), 0);
    return { flights, stays, activities, total: flights + stays + activities };
  }

  const place = code => (P.airport(code) ? P.airport(code).city : code);

  function logo(name, extra) {
    const file = WWC.brand[name];
    return file
      ? `<img class="logo logo-${name} ${extra || ""}" src="${esc(file)}" alt="${esc(T.logos[name])}">`
      : `<span class="logo logo-${name} placeholder ${extra || ""}">${esc(T.logos[name])}<small> logo</small></span>`;
  }

  const link = (href, label, cls) =>
    `<a class="${cls || "textlink"}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span class="sr"> (${esc(T.newTab)})</span><span aria-hidden="true"> ↗</span></a>`;

  const isApproved = key => WWC.approved.list.includes(key);
  const approvedBadge = () =>
    `<span class="badge approved-badge">${esc(T.activities.approved)}${WWC.approved.sample ? `<small>${esc(T.activities.approvedSample)}</small>` : ""}</span>`;

  const nextButton = (view, label) => `<p class="next"><a class="button" href="#${view}">${esc(label)}</a></p>`;
  const heading = (title, lead) => `<h1 tabindex="-1">${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ""}`;

  function needs(needHome) {
    const missing = [];
    if (needHome && !currentHome()) missing.push(`<p>${esc(T.empty.needHome)}</p><p><a class="button" href="#start">${esc(T.empty.goHome)}</a></p>`);
    else if (!state.matches.length) missing.push(`<p>${esc(T.empty.needMatches)}</p><p><a class="button" href="#matches">${esc(T.empty.goMatches)}</a></p>`);
    return missing.length ? `<div class="empty">${missing.join("")}</div>` : "";
  }

  const select = (id, label, value, options) =>
    `<label class="field" for="${id}"><span>${esc(label)}</span><select id="${id}" data-setting="${id}">${options.map(([v, text]) =>
      `<option value="${esc(v)}"${String(v) === String(value) ? " selected" : ""}>${esc(text)}</option>`).join("")}</select></label>`;

  /* ---------- Screens ---------- */

  const homeLabel = h => `${h.city}, ${h.country}`;

  function homeStatus() {
    const h = currentHome();
    if (!h) return "";
    const host = P.hostCityOf(h);
    const fallback = !state.currency && !WWC.rates[h.currency] ? " " + T.start.currencyFallback(h.currency, currency()) : "";
    return T.start.homeChosen(h.city, h.country, h.airports.join(", ")) +
      (host ? " " + T.start.homeHost(WWC.cities[host].name) : "") + fallback;
  }

  function viewStart() {
    const h = currentHome();
    return `<div class="hero"><div>${heading(T.start.title, T.start.lead)}</div></div>
      <div class="panel form">
        <label class="field wide" for="home"><span>${esc(T.start.home)}</span>
          <input id="home" list="homes" autocomplete="off" placeholder="${esc(T.start.homePlaceholder)}" value="${h ? esc(homeLabel(h)) : ""}" aria-describedby="home-help home-status">
        </label>
        <datalist id="homes">${WWC.homes.map(x => `<option value="${esc(homeLabel(x))}"></option>`).join("")}</datalist>
        <p id="home-help" class="hint">${esc(T.start.homeHelp)}</p>
        <p id="home-status" class="status" role="status">${esc(homeStatus())}</p>
        <div class="row">
          <label class="field" for="adults"><span>${esc(T.start.adults)}</span><input id="adults" data-setting="adults" type="number" min="1" max="99" inputmode="numeric" value="${state.adults}"></label>
          <label class="field" for="children"><span>${esc(T.start.children)}</span><input id="children" data-setting="children" type="number" min="0" max="99" inputmode="numeric" value="${state.children}"></label>
          ${select("currency", T.start.currency, currency(), Object.keys(WWC.rates).sort().map(c => [c, c]))}
        </div>
        <p class="hint">${esc(T.start.currencyNote(WWC.ratesDate))}</p>
      </div>
      ${nextButton("matches", T.start.next)}`;
  }

  const matchName = m => `${m.a} ${T.matches.versus} ${m.b}`;

  function viewMatches() {
    const teams = Array.from(new Set(WWC.matches.filter(m => m.stage.startsWith("Group")).flatMap(m => [m.a, m.b]))).sort();
    const stages = Array.from(new Set(WWC.matches.map(m => m.stage).filter(s => !s.startsWith("Group"))));
    const shown = WWC.matches.filter(m =>
      (!filters.city || m.city === filters.city) &&
      (!filters.team || m.a === filters.team || m.b === filters.team) &&
      (!filters.stage || (filters.stage === "group" ? m.stage.startsWith("Group") : m.stage === filters.stage)));
    const dates = Array.from(new Set(shown.map(m => m.date)));

    const card = m => {
      const picked = state.matches.includes(m.id);
      const other = picked ? null : P.clash(m, state.matches);
      return `<li class="match${picked ? " picked" : ""}">
        <span class="time">${m.time}</span>
        <span class="who"><strong>${esc(matchName(m))}</strong><small>${esc(m.stage)} · ${esc(WWC.cities[m.city].name)}, ${esc(WWC.cities[m.city].stadium)}</small>
          ${other ? `<small class="warn" id="why-${m.id}">${esc(T.matches.clash(matchName(other)))}</small>` : ""}</span>
        <button type="button" class="toggle" data-action="match" data-id="${m.id}" data-focus="match-${m.id}" aria-pressed="${picked}"
          ${other ? `disabled aria-describedby="why-${m.id}"` : ""}>${esc(picked ? T.matches.added : T.matches.add)}<span class="sr"> ${esc(matchName(m))}</span></button>
      </li>`;
    };

    return `${heading(T.matches.title, T.matches.lead)}
      <div class="filters">
        ${select("filter-city", T.matches.city, filters.city, [["", T.matches.allCities]].concat(Object.entries(WWC.cities).map(([k, c]) => [k, c.name])))}
        ${select("filter-team", T.matches.team, filters.team, [["", T.matches.allTeams]].concat(teams.map(x => [x, x])))}
        ${select("filter-stage", T.matches.stage, filters.stage, [["", T.matches.allStages], ["group", T.matches.groupStage]].concat(stages.map(x => [x, x])))}
      </div>
      ${dates.length ? dates.map(d => `<section class="matchday"><h2>${esc(dayLong(d))}</h2><ul class="matches">${shown.filter(m => m.date === d).map(card).join("")}</ul></section>`).join("")
        : `<div class="empty"><p>${esc(T.matches.none)}</p><p><button type="button" class="button" data-action="clear-filters">${esc(T.matches.clear)}</button></p></div>`}
      <div class="stickybar"><span role="status">${esc(T.matches.count(state.matches.length))}</span><a class="button" href="#flights">${esc(T.matches.next)}</a></div>`;
  }

  const duration = hours => {
    const minutes = Math.round(hours * 12) * 5;
    return T.flights.duration(Math.floor(minutes / 60), minutes % 60);
  };

  function comparison(option, best) {
    const hours = Math.round(option.hours - best.hours);
    const price = option.price - best.price;
    return T.flights.compare(
      hours > 0 ? T.flights.longer(hours) : hours < 0 ? T.flights.shorter(-hours) : T.flights.same,
      price > 0 ? T.flights.dearer(money(price)) : price < 0 ? T.flights.cheaper(money(-price)) : T.flights.samePrice);
  }

  function optionRow(journey, option) {
    const { leg } = journey;
    const checked = journey.chosen === option;
    const best = journey.options.find(o => o.best);
    const middle = option.route.slice(1, -1).map(place);
    const kind = option.coach ? T.flights.coach : option.connections ? `${T.flights.changes(option.connections)} ${T.flights.via(middle.join(", "))}` : T.flights.direct;
    const name = `leg-${leg.id}`;
    return `<li class="option${checked ? " chosen" : ""}${option.partner ? " partner" : ""}">
      <label>
        <input type="radio" name="${esc(name)}" value="${esc(option.id)}" data-leg="${esc(leg.id)}" data-focus="${esc(name + option.id)}"${checked ? " checked" : ""}>
        <span class="what">
          <span class="badges">${option.best ? `<span class="badge best">${esc(T.flights.best)}</span>` : ""}${option.partner ? `<span class="badge partnerbadge">${logo("qatar")}<span>${esc(T.flights.partner)}</span></span>` : ""}</span>
          <strong class="route">${esc(option.route.join(" → "))}</strong>
          <span>${esc(kind)}, ${esc(duration(option.hours))}</span>
          ${option.partner && !option.best ? `<span class="hint">${esc(comparison(option, best))}</span>` : ""}
        </span>
        <span class="price"><strong>${esc(money(option.price))}</strong><small>${esc(T.flights.perAdult)}</small><small>${esc(T.flights.group(money(P.groupFare(option, state.adults, state.children))))}</small></span>
      </label>
    </li>`;
  }

  function searchLinks(journey) {
    const { chosen, dates } = journey;
    if (!chosen) return "";
    const from = chosen.route[0], to = chosen.route[chosen.route.length - 1];
    if (chosen.coach) return `<div class="search">${link(P.links.coach(place(from), place(to)), T.flights.coachSearch, "button")}</div>`;
    const google = P.links.googleFlights(from, to, dates.depart);
    const sky = P.links.skyscanner(from, to, dates.depart, state.adults);
    if (chosen.partner) {
      /* The part Qatar Airways is expected to fly: everything up to São Paulo, or from it on the way home. */
      const gru = chosen.route.indexOf("GRU");
      const homeward = journey.leg.kind === "back";
      const mainFrom = homeward ? "GRU" : from, mainTo = homeward ? to : "GRU";
      const onward = homeward ? (gru > 0 ? [from, "GRU"] : null) : (gru < chosen.route.length - 1 ? ["GRU", to] : null);
      return `<div class="search">${link(P.links.qatar(), T.flights.qatarButton, "button")}
        <p class="hint">${esc(T.flights.qatarEnter(mainFrom, mainTo, day(dates.depart)))}${onward ? " " + esc(T.flights.qatarOnward(onward[0], onward[1])) : ""}</p>
        <p class="others">${esc(T.flights.alsoCompare)} ${link(google, T.flights.google)} ${link(sky, T.flights.skyscanner)}</p></div>`;
    }
    return `<div class="search">${link(google, T.flights.primarySearch, "button")}<p class="others">${esc(T.flights.alsoCompare)} ${link(sky, T.flights.skyscanner)}</p></div>`;
  }

  function viewFlights() {
    const blocked = needs(true);
    if (blocked) return heading(T.flights.title) + blocked;
    const stops = trip();
    const legs = journeys(stops);
    const range = (n, from) => Array.from({ length: n }, (_, i) => [i + from, T.flights.days(i + from)]);
    const out = legs.find(j => j.leg.kind === "out"), back = legs.find(j => j.leg.kind === "back");
    const arrival = out ? out.leg.to[0] : null, departure = back ? back.leg.from[0] : null;

    return `${heading(T.flights.title, T.flights.lead)}
      <fieldset class="panel row"><legend>${esc(T.flights.settings)}</legend>
        ${select("arriveBefore", T.flights.arrive, state.arriveBefore, range(7, 1))}
        ${select("stayAfter", T.flights.stay, state.stayAfter, range(14, 1))}
        ${stops.length > 1 ? select("moveStyle", T.flights.move, state.moveStyle, [["early", T.flights.moveEarly], ["late", T.flights.moveLate]]) : ""}
      </fieldset>
      ${guests() > 9 ? `<p class="callout">${esc(T.flights.bigGroup)}</p>` : ""}
      ${state.children ? `<p class="hint">${esc(T.flights.children)}</p>` : ""}
      ${arrival && departure && arrival !== departure ? `<p class="callout">${esc(T.flights.openJaw(place(arrival), place(departure)))}</p>` : ""}
      ${legs.length ? legs.map(j => {
        const from = j.chosen ? j.chosen.route[0] : j.leg.from[0];
        const to = j.chosen ? j.chosen.route[j.chosen.route.length - 1] : j.leg.to[0];
        const when = T.flights.leave(day(j.dates.depart)) + (j.dates.arrive !== j.dates.depart ? ", " + T.flights.land(day(j.dates.arrive)) : "");
        return `<section class="leg"><p class="kind">${esc(T.flights.kinds[j.leg.kind])}</p><h2>${esc(T.flights.route(place(from), place(to)))}</h2><p>${esc(when)}</p>
          ${j.leg.tight ? `<p class="callout warn">${esc(T.flights.tight)}</p>` : j.leg.matchDay ? `<p class="callout">${esc(T.flights.matchDay)}</p>` : ""}
          ${j.options.length ? `<ul class="options">${j.options.map(o => optionRow(j, o)).join("")}</ul>${searchLinks(j)}`
            : `<p>${esc(T.flights.noOptions)}</p>${link(P.links.googleFlights(from, to, j.dates.depart), T.flights.primarySearch, "button")}`}
        </section>`;
      }).join("") : `<div class="empty"><p>${esc(T.flights.noFlights)}</p></div>`}
      <p class="fine">${esc(T.flights.disclaimer)}</p>
      ${nextButton("stays", T.flights.next)}`;
  }

  function viewStays() {
    const blocked = needs(true);
    if (blocked) return heading(T.stays.title) + blocked;
    const stops = trip();
    return `${heading(T.stays.title, T.stays.lead)}
      <div class="partnerline">${logo("airbnb")}<span>${esc(T.stays.supporter)}</span></div>
      <fieldset class="segmented"><legend>${esc(T.stays.type)}</legend>${["entire", "room"].map(v =>
        `<label><input type="radio" name="roomType" value="${v}" data-focus="room-${v}"${state.roomType === v ? " checked" : ""}><span>${esc(T.stays[v])}</span></label>`).join("")}</fieldset>
      ${state.adults > 16 ? `<p class="callout">${esc(T.stays.bigGroup)}</p>` : ""}
      ${stops.map((s, index) => {
        const city = WWC.cities[s.city];
        if (s.atHome || !s.nights) return `<section class="stop"><h2>${esc(city.name)}</h2><p>${esc(T.stays.atHome(city.name))}</p></section>`;
        return `<section class="stop"><h2>${esc(city.name)}</h2><p>${esc(T.stays.dates(day(s.arrive), day(s.depart), s.nights))}</p>
          <ul class="areas">${WWC.areas[s.city].map(a => {
            const where = a.place || `${a.name}, ${city.name}`;
            const rate = P.nightly(a, state.roomType, guests());
            const chosen = areaFor(s.city) === a;
            return `<li class="area${chosen ? " chosen" : ""}">
              <h3>${esc(a.name)}</h3><p>${esc(a.why)}</p>
              <p class="price"><strong>${esc(money(rate))}</strong> <small>${esc(T.stays.perNight)}</small><br><small>${esc(T.stays.total(money(rate * s.nights)))}</small></p>
              ${link(P.links.airbnb(where, s.arrive, s.depart, state.adults, state.children, state.roomType), T.stays.airbnb, "button airbnb")}
              <p class="others">${link(P.links.booking(where, s.arrive, s.depart, state.adults, state.children), T.stays.booking)}</p>
              <label class="pick"><input type="radio" name="area-${index}" value="${a.id}" data-city="${s.city}" data-focus="area-${index}-${a.id}"${chosen ? " checked" : ""}> ${esc(T.stays.budget)}<span class="sr">: ${esc(a.name)}</span></label>
            </li>`;
          }).join("")}</ul></section>`;
      }).join("")}
      ${nextButton("activities", T.stays.next)}`;
  }

  function viewActivities() {
    const blocked = needs(false);
    if (blocked) return heading(T.activities.title) + blocked;
    const stops = trip();
    const plan = P.schedule(stops, state.picks);
    const cities = Array.from(new Set(stops.map(s => s.city)));
    const matchesInterest = a => a.tags.filter(t => state.interests.includes(t)).length;

    return `${heading(T.activities.title, T.activities.lead)}
      <p class="callout">${esc(T.activities.approvedNote)}</p>
      <fieldset class="chips"><legend>${esc(T.activities.interests)}</legend>${Object.entries(T.activities.tags).map(([k, label]) =>
        `<button type="button" class="chip" data-action="interest" data-id="${k}" data-focus="interest-${k}" aria-pressed="${state.interests.includes(k)}">${esc(label)}</button>`).join("")}</fieldset>
      ${cities.map(key => {
        const city = WWC.cities[key];
        const visits = stops.filter(s => s.city === key);
        /* FIFA Approved first, then the closest fit with the visitor's interests. */
        const promoted = a => (isApproved(`${key}:${a.id}`) ? 1 : 0);
        const items = WWC.activities[key].slice().sort((a, b) => promoted(b) - promoted(a) || matchesInterest(b) - matchesInterest(a));
        return `<section class="stop"><h2>${esc(city.name)}</h2>
          <p>${visits.map(s => esc(`${day(s.arrive)} to ${day(s.depart)}`)).join(" · ")}</p>
          <p class="hint">${esc(city.weather)} ${esc(city.matchday)}</p>
          <p>${link(P.links.experiences(city.name), T.activities.experiencesCity(city.name), "button airbnb")}</p>
          <ul class="activities">${items.map(a => {
            const id = `${key}:${a.id}`;
            const added = id in state.picks;
            const placed = plan[id];
            const possible = added || P.fits(stops, key, a);
            const roomLeft = added || !possible ? true : !!P.schedule(stops, Object.assign({}, state.picks, { [id]: "" }))[id].date;
            const why = !possible ? (a.kind === "full" ? T.activities.needs(a.days) : T.activities.noEvening) : !roomLeft || (added && !placed.date) ? T.activities.noRoom : "";
            const dayLabel = d => {
              const stop = visits.find(s => d >= s.arrive && d <= s.depart);
              const tag = stop && stop.matches.some(m => m.date === d) ? T.activities.matchDay : stop && !stop.atHome && (d === stop.arrive || d === stop.depart) ? T.activities.travelDay : "";
              return day(d) + (tag ? ` (${tag})` : "");
            };
            const site = WWC.activitySites[id];
            return `<li class="activity${added ? " chosen" : ""}${isApproved(id) ? " approved" : ""}${state.interests.length && matchesInterest(a) ? " liked" : ""}">
              ${isApproved(id) ? approvedBadge() : ""}
              <h3>${esc(a.name)}</h3>
              <p class="tags">${a.tags.map(t => `<span>${esc(T.activities.tags[t])}</span>`).join("")}</p>
              <p>${esc(a.time)}, ${esc(T.activities.cost(a.cost ? money(a.cost) : ""))}. ${esc(a.note)}</p>
              ${a.days > 1 ? `<p class="hint">${esc(T.activities.overnight)}</p>` : ""}
              ${why ? `<p class="warn" id="why-${key}-${a.id}">${esc(why)}</p>` : ""}
              ${added && placed.date ? `<label class="field" for="day-${key}-${a.id}"><span>${esc(T.activities.day)}</span><select id="day-${key}-${a.id}" data-pick="${id}">${placed.starts.map(d =>
                `<option value="${d}"${d === placed.date ? " selected" : ""}>${esc(dayLabel(d))}</option>`).join("")}</select></label>` : ""}
              <button type="button" class="toggle" data-action="activity" data-id="${id}" data-focus="act-${id}" aria-pressed="${added}"
                ${!added && (!possible || !roomLeft) ? `disabled aria-describedby="why-${key}-${a.id}"` : ""}>${esc(added ? T.activities.remove : T.activities.add)}<span class="sr">: ${esc(a.name)}</span></button>
              <p class="others">${link(P.links.experiences(city.name), T.activities.experiences)} ${site ? link(site.url, T.activities.website(site.name)) : ""} ${link(P.links.tours(`${a.name} ${city.name}`), T.activities.tours)}${link(P.links.map(`${a.name} ${city.name}`), T.activities.map)}</p>
            </li>`;
          }).join("")}</ul></section>`;
      }).join("")}
      ${nextButton("trip", T.activities.next)}`;
  }

  /* One entry for each date from leaving home to getting back. */
  function itinerary(stops, legs, plan) {
    if (!stops.length) return [];
    let first = stops[0].arrive, last = stops[stops.length - 1].depart;
    legs.forEach(j => {
      if (j.dates.depart < first) first = j.dates.depart;
      if (j.dates.arrive > last) last = j.dates.arrive;
    });
    return P.range(first, last).map(date => {
      const lines = [];
      legs.forEach(j => {
        if (!j.chosen) return;
        const from = place(j.chosen.route[0]), to = place(j.chosen.route[j.chosen.route.length - 1]);
        if (j.leg.kind === "out" && j.dates.depart === date) lines.push({ type: "travel", text: `${T.trip.leaveHome(from, to)} (${j.chosen.route.join(" → ")})` });
        if (j.leg.kind === "between" && j.dates.depart === date) lines.push({ type: "travel", text: `${T.trip.travel(from, to)} (${j.chosen.coach ? T.flights.coach : j.chosen.route.join(" → ")})` });
        if (j.leg.kind === "back" && j.dates.depart === date) lines.push({ type: "travel", text: `${T.trip.travel(from, to)} (${j.chosen.route.join(" → ")})` });
        if (j.leg.kind === "back" && j.dates.arrive === date) lines.push({ type: "travel", text: T.trip.arriveHome(to) });
      });
      /* The latest stop covering a date is where the traveller sleeps. */
      const here = stops.filter(s => date >= s.arrive && date <= s.depart).pop() || null;
      stops.forEach(s => s.matches.filter(m => m.date === date).forEach(m =>
        lines.push({ type: "match", text: `${matchName(m)}, ${T.trip.kickoff(m.time, WWC.cities[m.city].stadium)}` })));
      Object.values(plan).filter(p => p.date === date).forEach(p => lines.push({ type: "activity", text: `${p.item.name} (${p.item.time})` }));
      if (here && date < here.depart && !here.atHome) lines.push({ type: "stay", text: T.trip.stayIn(areaFor(here.city).name, WWC.cities[here.city].name) });
      if (!lines.length) lines.push({ type: "free", text: here ? `${T.trip.free}. ${T.trip.inCity(WWC.cities[here.city].name)}` : T.trip.free });
      return { date, lines };
    });
  }

  /* ---------- Your trip: banner and booking cards ---------- */

  const art = (index, content, text) =>
    `<div class="art art-${"abcd"[index % 4]}"${content ? "" : ' aria-hidden="true"'}>${text
      ? `<svg viewBox="0 0 200 150" aria-hidden="true"><polygon points="100,8 167,75 100,142 33,75"></polygon><text x="100" y="82" text-anchor="middle" font-size="19">${esc(text)}</text></svg>`
      : ""}${content || ""}</div>`;

  const sectionHead = (title, extra, more) =>
    `<div class="section-head"><h2>${esc(title)}</h2>${extra || ""}${more ? `<a class="more" href="#${more[0]}">${esc(more[1])} <span aria-hidden="true">→</span></a>` : ""}</div>`;

  /* A team playing in every chosen match, if there is one. */
  const commonTeam = matches => [matches[0].a, matches[0].b].find(team => matches.every(m => m.a === team || m.b === team)) || null;

  function heroTitle(stops) {
    const matches = P.selected(state.matches);
    const cities = planCities(state);
    const first = WWC.cities[stops[0].city].name, last = WWC.cities[stops[stops.length - 1].city].name;
    if (matches.length === 1) return T.trip.heroOne(matchName(matches[0]), first);
    const team = commonTeam(matches);
    if (cities.length === 1) return team ? T.trip.heroFollowIn(team, first) : T.trip.heroIn(matches.length, first);
    if (first === last) return team ? T.trip.heroFollowThrough(team, cities.length) : T.trip.heroThrough(matches.length, cities.length);
    return team ? T.trip.heroFollow(team, first, last) : T.trip.heroAcross(matches.length, first, last);
  }

  function tripHero(stops, days, totals) {
    const lead = T.trip.heroLead(currentHome().city, T.trip.party(state.adults, state.children),
      day(days[0].date), day(days[days.length - 1].date), money(totals.total), money(totals.total / guests()));
    return `<div class="triphero">
      <div class="triphero-text"><p class="triphero-eyebrow">${esc(T.trip.title)}</p><h1 tabindex="-1">${esc(heroTitle(stops))}</h1><p>${esc(lead)}</p>
        <button type="button" class="button cta" data-action="to-save" data-focus="to-save">${esc(T.account.saveTitle)}</button></div>
      <div class="triphero-map">${map(stops, false)}</div></div>`;
  }

  function tripMatches() {
    return `<section>${sectionHead(T.trip.matches, "", ["matches", T.trip.editMatches])}
      <ul class="fixtures">${P.selected(state.matches).map(m => `<li><span class="when">${esc(day(m.date))}, ${m.time}</span><span class="teams">${esc(matchName(m))}</span><span class="venue">${esc(WWC.cities[m.city].stadium)}, ${esc(WWC.cities[m.city].name)}</span></li>`).join("")}</ul></section>`;
  }

  function tripFlights(legs) {
    const cards = legs.filter(j => j.chosen).map((j, index) => {
      const { chosen, dates } = j;
      const from = chosen.route[0], to = chosen.route[chosen.route.length - 1];
      const actions = chosen.coach
        ? link(P.links.coach(place(from), place(to)), T.trip.coach, "button")
        : link(P.links.bookingFlights(from, to, dates.depart, state.adults), T.trip.bookingCom, "button") +
          (chosen.partner ? link(P.links.qatar(), T.trip.orQatar) : "");
      return `<li>${art(index, "", chosen.coach ? T.trip.coachShort : `${from} → ${to}`)}
        <span class="when">${esc(day(dates.depart))}</span>
        <span class="title">${esc(T.flights.route(place(from), place(to)))}</span>
        <small>${esc(chosen.coach ? T.flights.coach : T.trip.bookingRoute(chosen.route.join(" → ")))}</small>
        <span>${esc(T.flights.group(money(P.groupFare(chosen, state.adults, state.children))))}</span>
        ${actions}</li>`;
    });
    /* Point to the Qatar Airways option on the way out, if it isn't the one chosen. */
    const out = legs.find(j => j.leg.kind === "out");
    const qatar = out && out.options.find(o => o.partner);
    const banner = qatar ? `<div class="partnerline">${logo("qatar")}<span>${esc(T.flights.partner)}${out.chosen !== qatar
      ? `. ${esc(T.trip.qatarOption(duration(qatar.hours), money(qatar.price)))}` : ""}</span></div>` : "";
    const notes = [state.children ? T.trip.bookingChildren : "", state.adults > 9 ? T.trip.bookingGroup : ""].filter(Boolean);
    return `<section>${sectionHead(T.trip.bookFlights, banner, ["flights", T.trip.compareFlights])}
      <p class="hint">${esc(T.trip.bookLead)}</p>
      ${notes.map(n => `<p class="callout">${esc(n)}</p>`).join("")}
      ${cards.length ? `<ul class="cards">${cards.join("")}</ul>` : `<p class="empty">${esc(T.trip.noFlights)}</p>`}</section>`;
  }

  function tripStays(stops) {
    const cards = paidStops(stops).map(s => {
      const city = WWC.cities[s.city], area = areaFor(s.city);
      const total = s.nights * P.nightly(area, state.roomType, guests());
      return `<li><span class="when">${esc(T.stays.dates(day(s.arrive), day(s.depart), s.nights))}</span>
        <span class="title">${esc(`${area.name}, ${city.name}`)}</span>
        <span>${esc(T.trip.estimate(money(total)))}</span>
        ${link(P.links.airbnb(area.place || `${area.name}, ${city.name}`, s.arrive, s.depart, state.adults, state.children, state.roomType), T.trip.airbnb, "button")}</li>`;
    });
    const banner = `<div class="partnerline">${logo("airbnb")}<span>${esc(T.stays.supporter)}</span></div>`;
    return `<section>${sectionHead(T.trip.staysTitle, banner, ["stays", T.trip.changeStays])}
      ${cards.length ? `<ul class="cards boxed">${cards.join("")}</ul>` : `<p class="empty">${esc(T.trip.noStays)}</p>`}</section>`;
  }

  function tripActivities(plan) {
    const cards = Object.entries(plan).filter(([, p]) => p.date)
      .sort((a, b) => a[1].date.localeCompare(b[1].date))
      .map(([key, p], index) => {
        const site = WWC.activitySites[key];
        const city = WWC.cities[p.city].name;
        return `<li>${art(index + 1, isApproved(key) ? approvedBadge() : "")}
          <span class="when">${esc(`${day(p.date)}, ${city}`)}</span>
          <span class="title">${esc(p.item.name)}</span>
          <span>${esc(T.activities.cost(p.item.cost ? money(p.item.cost) : ""))}</span>
          ${site ? link(site.url, T.activities.website(site.name))
            : `<small>${esc(T.trip.noWebsite)}</small>${link(P.links.tours(`${p.item.name} ${city}`), T.trip.findTour)}`}</li>`;
      });
    return `<section>${sectionHead(T.trip.activitiesTitle, "", ["activities", T.trip.addActivities])}
      ${cards.length ? `<ul class="cards">${cards.join("")}</ul>` : `<p class="empty">${esc(T.trip.noActivities)}</p>`}</section>`;
  }

  function tripText(days, totals) {
    return [T.tournament + ": " + T.trip.title, T.notice, ""]
      .concat(days.flatMap(d => [dayLong(d.date)].concat(d.lines.map(l => "  - " + l.text))))
      .concat(["", `${T.trip.budget}: ${money(totals.total)} (${currency()})`, T.trip.excludes])
      .join("\n");
  }

  function viewTrip() {
    const blocked = needs(true);
    if (blocked) return heading(T.trip.title) + blocked;
    const stops = trip();
    const legs = journeys(stops);
    const plan = P.schedule(stops, state.picks);
    const totals = budget(stops, legs, plan);
    const days = itinerary(stops, legs, plan);
    return `<div class="trip">${tripHero(stops, days, totals)}
      ${tripMatches()}
      <div class="summary">
        <section class="panel"><h2>${esc(T.trip.budget)}</h2>
          <table class="budget"><tbody>
            ${["flights", "stays", "activities"].map(k => `<tr><th scope="row">${esc(T.trip[k])}</th><td>${esc(money(totals[k]))}</td></tr>`).join("")}
            <tr class="total"><th scope="row">${esc(T.trip.total)}</th><td>${esc(money(totals.total))}</td></tr>
          </tbody></table>
          <p>${esc(T.trip.perPerson(money(totals.total / guests())))}</p><p class="hint">${esc(T.trip.excludes)}</p></section>
        ${savePanel()}
      </div>
      ${tripFlights(legs)}
      ${tripStays(stops)}
      ${tripActivities(plan)}
      <section><h2>${esc(T.trip.days)}</h2><ol class="timeline">${days.map(d =>
        `<li><h3>${esc(dayLong(d.date))}</h3><ul>${d.lines.map(l => `<li class="line-${l.type}">${esc(l.text)}</li>`).join("")}</ul></li>`).join("")}</ol></section>
      <section class="faq"><h2>${esc(T.trip.before)}</h2>${T.trip.faq.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</section>
      <div class="actions">
        <button type="button" class="button" data-action="copy" data-focus="copy">${esc(T.trip.copy)}</button>
        ${ui.confirmReset
          ? `<span>${esc(T.trip.resetAsk)}</span> <button type="button" class="toggle" data-action="reset-yes" data-focus="reset-yes">${esc(T.trip.resetYes)}</button> <button type="button" class="toggle" data-action="reset-no" data-focus="reset-no">${esc(T.trip.resetNo)}</button>`
          : `<button type="button" class="toggle" data-action="reset" data-focus="reset">${esc(T.trip.reset)}</button>`}
        <span role="status">${esc(ui.copy === "ok" ? T.trip.copied : ui.copy ? T.trip.copyFailed : "")}</span>
      </div>
      ${ui.copy === "failed" ? `<textarea class="copytext" rows="12" readonly aria-label="${esc(T.trip.title)}">${esc(tripText(days, totals))}</textarea>` : ""}</div>`;
  }

  /* ---------- Sign-in and saved trips ---------- */

  const A = T.account;
  const savedWhen = new Intl.DateTimeFormat(T.locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const openTrip = () => session.trips.find(t => t.id === state.tripId) || null;

  /* True when leaving the current plan would lose something. */
  function unsaved() {
    if (!state.matches.length) return false;
    const trip = openTrip();
    return !trip || !WWC.trips.same(trip.data, state);
  }

  const planCities = plan => Array.from(new Set(P.stops(plan.matches, { homeId: plan.home }).map(s => WWC.cities[s.city].name)));

  const button = (action, label, cls, id, name) =>
    `<button type="button" class="${cls || "toggle"}" data-action="${action}"${id ? ` data-id="${esc(id)}"` : ""} data-focus="${action}${id ? "-" + esc(id) : ""}">${esc(label)}${name ? `<span class="sr">: ${esc(name)}</span>` : ""}</button>`;

  function nameForm(kind, label, value, submit, id) {
    const field = `${kind}-name`;
    return `<form class="nameform" data-form="${kind}"${id ? ` data-id="${esc(id)}"` : ""}>
      <label class="field" for="${field}"><span>${esc(label)}</span><input id="${field}" data-draft="${kind}" maxlength="60" autocomplete="off" value="${esc(value)}"></label>
      <button type="submit" class="button" data-focus="submit-${kind}">${esc(submit)}</button></form>`;
  }

  function confirmBox(question, yes, no) {
    return `<div class="confirm" role="group" aria-label="${esc(question)}"><p>${esc(question)}</p>${button("confirm-yes", yes, "button")} ${button("confirm-no", no)}</div>`;
  }

  /* Saving the current plan, shown on "Your trip" and "My trips". */
  function savePanel() {
    if (!session.user) {
      return `<section class="panel save" id="save-panel" tabindex="-1"><h2>${esc(A.saveTitle)}</h2><p>${esc(A.signInToSave)}</p><p><a class="button" href="#account">${esc(A.linkOut)}</a></p></section>`;
    }
    const trip = openTrip();
    const suggestion = ui.draft.save !== undefined ? ui.draft.save : A.defaultName(planCities(state));
    let body;
    if (!state.matches.length && !trip) body = `<p>${esc(A.needMatch)}</p>`;
    else if (trip) {
      const dirty = !WWC.trips.same(trip.data, state);
      body = `<p>${esc(A.linked(trip.name))} <strong>${esc(dirty ? A.dirty : A.upToDate)}</strong></p>
        ${dirty && state.matches.length ? `<p>${button("update", A.saveChanges, "button")}</p>` : ""}
        ${state.matches.length ? nameForm("save", A.tripName, suggestion, A.saveNew) : `<p>${esc(A.needMatch)}</p>`}`;
    } else body = `<p>${esc(A.unsaved)}</p>${nameForm("save", A.tripName, suggestion, A.save)}`;
    return `<section class="panel save" id="save-panel" tabindex="-1"><h2>${esc(A.saveTitle)}</h2>${body}</section>`;
  }

  function tripCard(trip) {
    const { plan, missing } = WWC.trips.clean(trip.data);
    const stops = P.stops(plan.matches, { homeId: plan.home, arriveBefore: plan.arriveBefore, stayAfter: plan.stayAfter, moveStyle: plan.moveStyle });
    const summary = stops.length
      ? `${A.dates(day(stops[0].arrive), day(stops[stops.length - 1].depart))} · ${planCities(plan).join(", ")} · ${T.plural(plan.matches.length, "match", "matches")}`
      : A.noMatches;
    const when = new Date(trip.saved);
    const confirming = ui.confirm && ui.confirm.id === trip.id;
    let actions;
    if (ui.renaming === trip.id) {
      actions = nameForm("rename", A.newName, ui.draft.rename !== undefined ? ui.draft.rename : trip.name, A.saveName, trip.id) + button("rename-cancel", A.cancel, "toggle", trip.id);
    } else if (confirming && ui.confirm.type === "delete") actions = confirmBox(A.askDelete(trip.name), A.yesDelete, A.keep);
    else if (confirming && ui.confirm.type === "open") actions = confirmBox(A.askDiscard, A.discard, A.back);
    else {
      actions = `${button("open", A.open, "button", trip.id, trip.name)} ${button("rename", A.rename, "toggle", trip.id, trip.name)} ${button("delete", A.remove, "toggle", trip.id, trip.name)}`;
    }
    return `<li class="savedtrip${trip.id === state.tripId ? " current" : ""}">
      <h3>${esc(trip.name)}${trip.id === state.tripId ? ` <span class="badge best">${esc(A.openNow)}</span>` : ""}</h3>
      <p>${esc(summary)}</p>
      ${isNaN(when) ? "" : `<p class="hint">${esc(A.savedAt(savedWhen.format(when)))}</p>`}
      ${missing ? `<p class="warn">${esc(A.missing(missing))}</p>` : ""}
      <div class="actions">${actions}</div></li>`;
  }

  function viewAccount() {
    if (!session.user) {
      return `${heading(A.signInTitle, A.signInLead)}
        <p class="callout">${esc(A.demo)}</p>
        <div class="panel">
          <form data-form="signin">
            <label class="field wide" for="signin-name"><span>${esc(A.nameLabel)}</span><input id="signin-name" data-draft="signin" maxlength="40" autocomplete="off" aria-describedby="signin-help" value="${esc(ui.draft.signin || "")}"></label>
            <p id="signin-help" class="hint">${esc(A.nameHelp)}</p>
            <button type="submit" class="button" data-focus="submit-signin">${esc(A.signIn)}</button>
          </form>
        </div>
        <p class="hint">${esc(A.privacy)}</p>`;
    }
    const asking = ui.confirm && (ui.confirm.type === "new" || ui.confirm.type === "signout");
    return `${heading(A.title)}
      <p>${esc(A.signedInAs(session.user.name))}</p>
      ${asking ? confirmBox(A.askDiscard, A.discard, A.back)
        : `<div class="actions toolbar">${button("new-trip", A.newTrip)} ${button("signout", A.signOut)}</div>`}
      ${unsaved() ? savePanel() : ""}
      <section><h2>${esc(A.list)}</h2>
        ${session.trips.length ? `<ul class="savedtrips">${session.trips.map(tripCard).join("")}</ul>` : `<div class="empty"><p>${esc(A.none)}</p></div>`}
      </section>
      <p class="fine">${esc(A.demo)} ${esc(A.privacy)}</p>`;
  }

  function accountLink() {
    el("account").innerHTML = `<a href="#account"${currentView() === "account" ? ' aria-current="page"' : ""}>${esc(session.user ? A.linkIn(session.user.name) : A.linkOut)}</a>`;
  }

  /* A message that stays until the visitor moves to another screen. */
  function say(text, isError) {
    const box = el("flash");
    box.textContent = text;
    box.classList.toggle("error", !!isError);
  }

  async function refresh() {
    session.user = await WWC.account.user();
    session.trips = await WWC.account.list();
  }

  /* Run an account change, re-read the account, then redraw. Reports any failure on screen. */
  async function change(work, focus) {
    try {
      const message = await work();
      await refresh();
      render(false);
      say(message || "");
    } catch (error) {
      await refresh();
      render(false);
      say(A.errors[error.code] || A.errors.storage, true);
      return;
    }
    const target = focus && document.querySelector(focus);
    if (target) target.focus();
  }

  const HEADING = "#main h1";

  function startNewPlan() {
    state = Object.assign(fresh(), { tripId: null });
    save();
  }

  /* Move to a screen and show a message once it has been drawn. */
  let pendingMessage = "";
  function go(view, message) {
    pendingMessage = message || "";
    if (currentView() === view) { render(true); say(pendingMessage); pendingMessage = ""; } else location.hash = view;
  }

  function loadTrip(id) {
    const trip = session.trips.find(t => t.id === id);
    if (!trip) return change(async () => A.errors.missing, HEADING);
    const { plan, missing } = WWC.trips.clean(trip.data);
    state = Object.assign(plan, { tripId: trip.id });
    save();
    go("trip", [A.opened(trip.name), missing ? A.missing(missing) : ""].join(" ").trim());
  }

  function signOut() {
    return change(async () => {
      await WWC.account.signOut();
      startNewPlan();
      return A.signedOut;
    }, HEADING);
  }

  function accountAction(action, id) {
    const focusOn = selector => { const target = document.querySelector(selector); if (target) target.focus(); };
    const ask = (type, tripId) => { ui.confirm = { type, id: tripId }; ui.renaming = null; render(false); focusOn('[data-focus="confirm-no"]'); };

    if (action === "update") {
      return change(async () => {
        await WWC.account.update(state.tripId, WWC.trips.forStorage(state));
        return A.updated;
      }, HEADING);
    }
    if (action === "open") return unsaved() ? ask("open", id) : loadTrip(id);
    if (action === "delete") return ask("delete", id);
    if (action === "new-trip") {
      if (unsaved()) return ask("new");
      startNewPlan();
      return go("start");
    }
    if (action === "signout") return unsaved() ? ask("signout") : signOut();
    if (action === "rename") {
      ui.renaming = id; ui.confirm = null; delete ui.draft.rename;
      render(false);
      return focusOn("#rename-name");
    }
    if (action === "rename-cancel") {
      ui.renaming = null;
      render(false);
      return focusOn(`[data-focus="rename-${CSS.escape(id)}"]`);
    }
    if (action === "confirm-no") {
      const { type, id: tripId } = ui.confirm;
      const back = { open: `open-${tripId}`, delete: `delete-${tripId}`, new: "new-trip", signout: "signout" }[type];
      ui.confirm = null;
      render(false);
      return focusOn(`[data-focus="${CSS.escape(back)}"]`);
    }
    if (action === "confirm-yes") {
      const { type, id: tripId } = ui.confirm;
      ui.confirm = null;
      if (type === "open") return loadTrip(tripId);
      if (type === "new") { startNewPlan(); return go("start"); }
      if (type === "signout") return signOut();
      return change(async () => {
        await WWC.account.remove(tripId);
        if (state.tripId === tripId) { state.tripId = null; save(); }
        return A.deleted;
      }, HEADING);
    }
  }

  function submitForm(kind, id) {
    const text = el(`${kind}-name`).value;
    if (kind === "signin") {
      return change(async () => {
        const user = await WWC.account.signIn(text);
        delete ui.draft.signin;
        /* A plan linked to someone else's saved trip becomes an unsaved plan. */
        if (state.tripId && !(await WWC.account.list()).some(t => t.id === state.tripId)) { state.tripId = null; save(); }
        return A.signedInAs(user.name);
      }, HEADING);
    }
    if (kind === "save") {
      return change(async () => {
        const trip = await WWC.account.save(text, WWC.trips.forStorage(state));
        state.tripId = trip.id;
        delete ui.draft.save;
        save();
        return A.saved;
      }, HEADING);
    }
    return change(async () => {
      await WWC.account.rename(id, text);
      ui.renaming = null;
      delete ui.draft.rename;
      return A.renamed;
    }, HEADING);
  }

  /* ---------- Route map and summary ---------- */

  /*
   * Simplified Brazil flag with the country name, placed in the empty corner of the map.
   * Drawn on the flag's own 20 by 14 grid; the motto and most stars are too small to show here.
   */
  function flagAndLabel() {
    const stars = [[88, 78], [97, 90], [108, 84], [115, 94], [100, 100], [84, 92], [120, 80], [106, 52]];
    return `<g class="country">
      <g class="flag" transform="translate(22 292) scale(0.5)">
        <clipPath id="flag-globe"><circle cx="100" cy="70" r="35"></circle></clipPath>
        <rect class="flag-field" width="200" height="140"></rect>
        <polygon class="flag-rhombus" points="17,70 100,17 183,70 100,123"></polygon>
        <circle class="flag-globe" cx="100" cy="70" r="35"></circle>
        <circle class="flag-band" cx="80" cy="140" r="82.5" clip-path="url(#flag-globe)"></circle>
        ${stars.map(([cx, cy]) => `<circle class="flag-star" cx="${cx}" cy="${cy}" r="1.8"></circle>`).join("")}
      </g>
      <text class="country-name" x="72" y="390" text-anchor="middle">${esc(T.side.country)}</text>
    </g>`;
  }

  function map(stops, withFlag) {
    const x = lon => ((lon + 75) * 10).toFixed(1);
    const y = lat => ((6 - lat) * 10).toFixed(1);
    const at = key => `${x(WWC.cities[key].lon)},${y(WWC.cities[key].lat)}`;
    const labels = {
      RIO: [9, 14, "start"], SAO: [-9, 14, "end"], BHZ: [9, -4, "start"], BSB: [-9, -6, "end"],
      SSA: [-9, 0, "end"], REC: [-9, 12, "end"], FOR: [-9, -6, "end"], POA: [-9, 4, "end"]
    };
    const visits = {};
    stops.forEach((s, i) => (visits[s.city] = visits[s.city] || []).push(i + 1));
    return `<svg class="map" viewBox="0 0 420 405" role="img" aria-label="${esc(T.side.map)}">
      <polygon class="land" points="${WWC.outline.map(([lon, lat]) => `${x(lon)},${y(lat)}`).join(" ")}"></polygon>
      ${withFlag ? flagAndLabel() : ""}
      ${stops.length > 1 ? `<polyline class="path" points="${stops.map(s => at(s.city)).join(" ")}"></polyline>` : ""}
      ${Object.entries(WWC.cities).map(([key, c]) => {
        const [dx, dy, anchor] = labels[key];
        const on = visits[key];
        return `<g class="city${on ? " on" : ""}"><circle cx="${x(c.lon)}" cy="${y(c.lat)}" r="${on ? 8 : 4}"></circle>
          ${on ? `<text class="order" x="${x(c.lon)}" y="${(Number(y(c.lat)) + 3.5).toFixed(1)}">${on[0]}</text>` : ""}
          <text class="name" x="${(Number(x(c.lon)) + dx).toFixed(1)}" y="${(Number(y(c.lat)) + dy).toFixed(1)}" text-anchor="${anchor}">${esc(c.name)}</text></g>`;
      }).join("")}
    </svg>`;
  }

  function side() {
    const stops = trip();
    const legs = currentHome() ? journeys(stops) : [];
    const totals = budget(stops, legs, P.schedule(stops, state.picks));
    const nights = paidStops(stops).reduce((t, s) => t + s.nights, 0);
    return `<h2>${esc(T.side.title)}</h2>${map(stops, true)}
      ${stops.length ? `<dl class="stats">
        <div><dt>${esc(T.side.matches)}</dt><dd>${state.matches.length}</dd></div>
        <div><dt>${esc(T.side.cities)}</dt><dd>${stops.length}</dd></div>
        <div><dt>${esc(T.side.nights)}</dt><dd>${nights}</dd></div>
        ${currentHome() ? `<div><dt>${esc(T.side.estimate)}</dt><dd>${esc(money(totals.total))}</dd></div>` : ""}
      </dl>
      <ol class="chosenlist">${P.selected(state.matches).map(m => `<li><span><strong>${esc(day(m.date))}</strong> ${esc(matchName(m))}<small>${esc(WWC.cities[m.city].name)}</small></span>
        <button type="button" class="remove" data-action="match" data-id="${m.id}" data-focus="side-${m.id}">${esc(T.matches.remove)}<span class="sr"> ${esc(matchName(m))}</span></button></li>`).join("")}</ol>`
      : `<p class="hint">${esc(T.side.empty)}</p>`}`;
  }

  /* Counts down to the start of the opening day, Brasília time. */
  const OPENING = Date.parse("2027-06-24T00:00:00-03:00");

  function countdown() {
    const stops = trip();
    const days = Math.floor((OPENING - Date.now()) / 86400000);
    const figures = (days >= 0 ? [[days, T.countdown.days]] : []).concat(
      [[state.matches.length, T.countdown.matches], [paidStops(stops).reduce((t, s) => t + s.nights, 0), T.countdown.nights]]);
    return `<div class="wrap"><div class="countdown-name">${logo("emblem")}<div><strong>${esc(T.tournament)}</strong><span>${esc(T.countdown.dates)}</span></div></div>
      <dl>${figures.map(([value, label]) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join("")}</dl></div>`;
  }

  /* The parts around the main screen that follow the plan. */
  function updateSummary() {
    el("countdown").innerHTML = countdown();
    el("side").innerHTML = side();
  }

  /* ---------- Rendering and events ---------- */

  const views = { start: viewStart, matches: viewMatches, flights: viewFlights, stays: viewStays, activities: viewActivities, trip: viewTrip, account: viewAccount };
  const currentView = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "start");
  const el = id => document.getElementById(id);

  function renderNav(view) {
    el("steps").innerHTML = STEPS.map(v =>
      `<li><a href="#${v}"${v === view ? ' aria-current="step"' : ""}>${esc(T.steps[v])}</a></li>`).join("");
    /* On narrow screens, keep the current step in sight. */
    const list = el("steps"), current = list.querySelector("[aria-current]");
    if (current) list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }

  function render(moved) {
    const view = currentView();
    const active = document.activeElement;
    const focusKey = active && (active.dataset.focus || active.id);
    renderNav(view);
    accountLink();
    el("main").innerHTML = views[view]();
    /* Your trip has its own map, and My trips isn't a planning screen: both use the full width. */
    const full = view === "trip" || view === "account";
    el("layout").classList.toggle("full", full);
    el("side").hidden = full;
    updateSummary();
    document.title = `${T.steps[view]} · ${T.tournament} ${T.siteName}`;
    if (moved) {
      window.scrollTo(0, 0);
      const h1 = el("main").querySelector("h1");
      if (h1) h1.focus({ preventScroll: true });
    } else if (focusKey) {
      const again = document.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`) || el(focusKey);
      if (again) again.focus({ preventScroll: true });
    }
  }

  function commit() { save(); render(false); }

  function chooseHome(text) {
    const wanted = text.trim().toLowerCase();
    const exact = WWC.homes.find(h => homeLabel(h).toLowerCase() === wanted);
    const byCity = WWC.homes.filter(h => h.city.toLowerCase() === wanted);
    const match = exact || (byCity.length === 1 ? byCity[0] : null);
    const id = match ? match.id : null;
    if (id !== state.home) { state.home = id; state.currency = null; state.flights = {}; save(); }
    /* Update in place, so typing and tabbing aren't interrupted. */
    el("home-status").textContent = match ? homeStatus() : wanted ? T.start.homeMissing : "";
    el("currency").value = currency();
    if (match) el("home").value = homeLabel(match);
    updateSummary();
  }

  document.addEventListener("change", event => {
    const target = event.target;
    if (target.id === "home") return chooseHome(target.value);
    const setting = target.dataset.setting;
    if (setting) {
      if (setting.startsWith("filter-")) { filters[setting.slice(7)] = target.value; return render(false); }
      if (setting === "adults") state.adults = whole(Number(target.value), 1, 99, 1);
      else if (setting === "children") state.children = whole(Number(target.value), 0, 99, 0);
      else if (setting === "arriveBefore" || setting === "stayAfter") state[setting] = Number(target.value);
      else state[setting] = target.value;
      save();
      if (setting === "adults" || setting === "children") { target.value = state[setting]; updateSummary(); return; }
      return render(false);
    }
    if (target.dataset.leg) { state.flights[target.dataset.leg] = target.value; return commit(); }
    if (target.name === "roomType") { state.roomType = target.value; return commit(); }
    if (target.dataset.city) { state.areas[target.dataset.city] = target.value; return commit(); }
    if (target.dataset.pick) { state.picks[target.dataset.pick] = target.value; return commit(); }
  });

  document.addEventListener("submit", event => {
    const form = event.target.closest("[data-form]");
    if (!form) return;
    event.preventDefault();
    submitForm(form.dataset.form, form.dataset.id);
  });

  /* Pick up a home city as soon as the text matches one. */
  document.addEventListener("input", event => {
    /* Keep half-typed names if the screen is redrawn. */
    if (event.target.dataset.draft) { ui.draft[event.target.dataset.draft] = event.target.value; return; }
    if (event.target.id !== "home") return;
    const wanted = event.target.value.trim().toLowerCase();
    if (WWC.homes.some(h => homeLabel(h).toLowerCase() === wanted)) chooseHome(event.target.value);
  });

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "match") {
      const match = WWC.matches.find(m => m.id === id);
      if (state.matches.includes(id)) state.matches = state.matches.filter(x => x !== id);
      else if (!P.clash(match, state.matches)) state.matches.push(id);
      return commit();
    }
    if (action === "to-save") {
      const panel = el("save-panel");
      panel.scrollIntoView({ block: "center" });
      return (panel.querySelector("input, button, a") || panel).focus({ preventScroll: true });
    }
    if (action === "clear-filters") { filters.city = filters.team = filters.stage = ""; return render(false); }
    if (action === "interest") {
      state.interests = state.interests.includes(id) ? state.interests.filter(x => x !== id) : state.interests.concat(id);
      return commit();
    }
    if (action === "activity") {
      if (id in state.picks) delete state.picks[id]; else state.picks[id] = "";
      return commit();
    }
    if (action === "reset") { ui.confirmReset = true; render(false); return document.querySelector('[data-focus="reset-no"]').focus(); }
    if (action === "reset-no") { ui.confirmReset = false; render(false); return document.querySelector('[data-focus="reset"]').focus(); }
    if (action === "reset-yes") { ui.confirmReset = false; startNewPlan(); location.hash = "start"; return; }
    if (["update", "open", "delete", "new-trip", "signout", "rename", "rename-cancel", "confirm-yes", "confirm-no"].includes(action)) {
      return accountAction(action, id);
    }
    if (action === "copy") {
      const stops = trip(), legs = journeys(stops), plan = P.schedule(stops, state.picks);
      const text = tripText(itinerary(stops, legs, plan), budget(stops, legs, plan));
      const done = result => { ui.copy = result; render(false); };
      if (!navigator.clipboard) return done("failed");
      navigator.clipboard.writeText(text).then(() => done("ok"), () => done("failed"));
    }
  });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#main") return;
    ui.copy = ""; ui.confirmReset = false; ui.confirm = null; ui.renaming = null; ui.draft = {};
    render(true);
    say(pendingMessage);
    pendingMessage = "";
  });

  /* Another tab may have signed in, signed out or changed saved trips. */
  window.addEventListener("storage", () => refresh().then(() => render(false)));

  document.querySelector(".skip").addEventListener("click", event => {
    event.preventDefault();
    el("main").focus();
  });

  el("brand-fifa").innerHTML = logo("fifa");
  el("brand-emblem").innerHTML = logo("emblem");
  el("fifa-page").innerHTML = link("https://www.fifa.com/en/tournaments/womens/womensworldcup/brazil-2027", T.fifaPage);
  el("tournament").textContent = T.tournament;
  el("sitename").textContent = T.siteName;
  el("prototype").textContent = T.prototype;
  el("notice").textContent = T.notice;
  el("countdown").setAttribute("aria-label", T.countdown.label);
  el("footer").innerHTML = `<span class="footlogo">${logo("fifa")}</span>
    <span class="footlabel">${esc(T.footerPartners)}</span>${logo("qatar")}
    <span class="footlabel">${esc(T.footerSupporters)}</span>${logo("airbnb")}
    <p class="footnote"><span>${esc(T.footer)}</span><span>${esc(T.footerNote)}</span></p>`;
  document.querySelector(".skip").textContent = T.skip;
  el("steps").setAttribute("aria-label", T.stepsLabel);
  refresh().catch(() => say(A.errors.storage, true)).then(() => render(false));
})();
