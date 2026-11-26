/* Screens and interaction. Planning decisions live in planner.js. */
(function () {
  const P = WWC.planner;
  const T = WWC.t;
  const STORE = "wwc2027-trip-v1";
  const VIEWS = ["start", "matches", "flights", "stays", "activities", "trip"];

  /* ---------- State ---------- */

  const fresh = () => ({
    home: null, adults: 2, children: 0, currency: null, matches: [], arriveBefore: 1, stayAfter: 1,
    moveStyle: "early", flights: {}, areas: {}, roomType: "entire", interests: [], picks: {}
  });

  const whole = (v, low, high, fallback) => (Number.isFinite(v) ? Math.min(high, Math.max(low, Math.round(v))) : fallback);
  const isDate = v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v);
  const plainObject = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

  /* Saved data is checked against the current content, so old or edited values can't break a screen. */
  function load() {
    const s = fresh();
    let saved = {};
    try { saved = plainObject(JSON.parse(localStorage.getItem(STORE))); } catch (e) { /* storage unavailable */ }
    if (P.home(saved.home)) s.home = saved.home;
    s.adults = whole(saved.adults, 1, 99, s.adults);
    s.children = whole(saved.children, 0, 99, s.children);
    if (WWC.rates[saved.currency]) s.currency = saved.currency;
    (Array.isArray(saved.matches) ? saved.matches : []).forEach(id => {
      const match = WWC.matches.find(m => m.id === id);
      if (match && !s.matches.includes(id) && !P.clash(match, s.matches)) s.matches.push(id);
    });
    s.arriveBefore = whole(saved.arriveBefore, 1, 7, 1);
    s.stayAfter = whole(saved.stayAfter, 1, 14, 1);
    if (saved.moveStyle === "late") s.moveStyle = "late";
    if (saved.roomType === "room") s.roomType = "room";
    Object.entries(plainObject(saved.flights)).forEach(([k, v]) => { if (typeof v === "string") s.flights[k] = v; });
    Object.entries(plainObject(saved.areas)).forEach(([city, id]) => {
      if ((WWC.areas[city] || []).some(a => a.id === id)) s.areas[city] = id;
    });
    s.interests = (Array.isArray(saved.interests) ? saved.interests : []).filter(x => T.activities.tags[x]);
    Object.entries(plainObject(saved.picks)).forEach(([key, date]) => {
      const [city, id] = key.split(":");
      if ((WWC.activities[city] || []).some(a => a.id === id) && isDate(date)) s.picks[key] = date;
    });
    return s;
  }

  let state = load();
  const filters = { city: "", team: "", stage: "" };
  const ui = { confirmReset: false, copy: "" };

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
    return `<div class="hero">${logo("emblem", "hero-emblem")}<div>${heading(T.start.title, T.start.lead)}</div></div>
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
      <fieldset class="chips"><legend>${esc(T.activities.interests)}</legend>${Object.entries(T.activities.tags).map(([k, label]) =>
        `<button type="button" class="chip" data-action="interest" data-id="${k}" data-focus="interest-${k}" aria-pressed="${state.interests.includes(k)}">${esc(label)}</button>`).join("")}</fieldset>
      ${cities.map(key => {
        const city = WWC.cities[key];
        const visits = stops.filter(s => s.city === key);
        const items = WWC.activities[key].slice().sort((a, b) => matchesInterest(b) - matchesInterest(a));
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
            return `<li class="activity${added ? " chosen" : ""}${state.interests.length && matchesInterest(a) ? " liked" : ""}">
              <h3>${esc(a.name)}</h3>
              <p class="tags">${a.tags.map(t => `<span>${esc(T.activities.tags[t])}</span>`).join("")}</p>
              <p>${esc(a.time)}, ${esc(T.activities.cost(a.cost ? money(a.cost) : ""))}. ${esc(a.note)}</p>
              ${a.days > 1 ? `<p class="hint">${esc(T.activities.overnight)}</p>` : ""}
              ${why ? `<p class="warn" id="why-${key}-${a.id}">${esc(why)}</p>` : ""}
              ${added && placed.date ? `<label class="field" for="day-${key}-${a.id}"><span>${esc(T.activities.day)}</span><select id="day-${key}-${a.id}" data-pick="${id}">${placed.starts.map(d =>
                `<option value="${d}"${d === placed.date ? " selected" : ""}>${esc(dayLabel(d))}</option>`).join("")}</select></label>` : ""}
              <button type="button" class="toggle" data-action="activity" data-id="${id}" data-focus="act-${id}" aria-pressed="${added}"
                ${!added && (!possible || !roomLeft) ? `disabled aria-describedby="why-${key}-${a.id}"` : ""}>${esc(added ? T.activities.remove : T.activities.add)}<span class="sr">: ${esc(a.name)}</span></button>
              <p class="others">${link(P.links.experiences(city.name), T.activities.experiences)} ${link(P.links.tours(`${a.name} ${city.name}`), T.activities.tours)} ${link(P.links.map(`${a.name} ${city.name}`), T.activities.map)}</p>
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
    return `${heading(T.trip.title)}
      <section class="panel"><h2>${esc(T.trip.budget)}</h2>
        <table class="budget"><tbody>
          ${["flights", "stays", "activities"].map(k => `<tr><th scope="row">${esc(T.trip[k])}</th><td>${esc(money(totals[k]))}</td></tr>`).join("")}
          <tr class="total"><th scope="row">${esc(T.trip.total)}</th><td>${esc(money(totals.total))}</td></tr>
        </tbody></table>
        <p>${esc(T.trip.perPerson(money(totals.total / guests())))}</p><p class="hint">${esc(T.trip.excludes)}</p></section>
      <section><h2>${esc(T.trip.days)}</h2><ol class="timeline">${days.map(d =>
        `<li><h3>${esc(dayLong(d.date))}</h3><ul>${d.lines.map(l => `<li class="line-${l.type}">${esc(l.text)}</li>`).join("")}</ul></li>`).join("")}</ol></section>
      <section class="panel"><h2>${esc(T.trip.before)}</h2><ul>${T.trip.checks.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>
      <div class="actions">
        <button type="button" class="button" data-action="copy" data-focus="copy">${esc(T.trip.copy)}</button>
        ${ui.confirmReset
          ? `<span>${esc(T.trip.resetAsk)}</span> <button type="button" class="toggle" data-action="reset-yes" data-focus="reset-yes">${esc(T.trip.resetYes)}</button> <button type="button" class="toggle" data-action="reset-no" data-focus="reset-no">${esc(T.trip.resetNo)}</button>`
          : `<button type="button" class="toggle" data-action="reset" data-focus="reset">${esc(T.trip.reset)}</button>`}
        <span role="status">${esc(ui.copy === "ok" ? T.trip.copied : ui.copy ? T.trip.copyFailed : "")}</span>
      </div>
      ${ui.copy === "failed" ? `<textarea class="copytext" rows="12" readonly aria-label="${esc(T.trip.title)}">${esc(tripText(days, totals))}</textarea>` : ""}`;
  }

  /* ---------- Route map and summary ---------- */

  function map(stops) {
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
    return `<h2>${esc(T.side.title)}</h2>${map(stops)}
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

  /* ---------- Rendering and events ---------- */

  const views = { start: viewStart, matches: viewMatches, flights: viewFlights, stays: viewStays, activities: viewActivities, trip: viewTrip };
  const currentView = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "start");
  const el = id => document.getElementById(id);

  function renderNav(view) {
    el("steps").innerHTML = VIEWS.map((v, i) =>
      `<li><a href="#${v}"${v === view ? ' aria-current="step"' : ""}><span class="n">${i + 1}</span>${esc(T.steps[v])}</a></li>`).join("");
    /* On narrow screens, keep the current step in sight. */
    const list = el("steps"), current = list.querySelector("[aria-current]");
    list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }

  function render(moved) {
    const view = currentView();
    const active = document.activeElement;
    const focusKey = active && (active.dataset.focus || active.id);
    renderNav(view);
    el("main").innerHTML = views[view]();
    el("side").innerHTML = side();
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
    el("side").innerHTML = side();
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
      if (setting === "adults" || setting === "children") { target.value = state[setting]; el("side").innerHTML = side(); return; }
      return render(false);
    }
    if (target.dataset.leg) { state.flights[target.dataset.leg] = target.value; return commit(); }
    if (target.name === "roomType") { state.roomType = target.value; return commit(); }
    if (target.dataset.city) { state.areas[target.dataset.city] = target.value; return commit(); }
    if (target.dataset.pick) { state.picks[target.dataset.pick] = target.value; return commit(); }
  });

  /* Pick up a home city as soon as the text matches one. */
  document.addEventListener("input", event => {
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
    if (action === "reset-yes") { ui.confirmReset = false; state = fresh(); save(); location.hash = "start"; return; }
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
    ui.copy = ""; ui.confirmReset = false;
    render(true);
  });

  document.querySelector(".skip").addEventListener("click", event => {
    event.preventDefault();
    el("main").focus();
  });

  el("brand-fifa").innerHTML = logo("fifa");
  el("brand-emblem").innerHTML = logo("emblem");
  el("tournament").textContent = T.tournament;
  el("sitename").textContent = T.siteName;
  el("prototype").textContent = T.prototype;
  el("notice").textContent = T.notice;
  el("footer").textContent = T.footer;
  document.querySelector(".skip").textContent = T.skip;
  el("steps").setAttribute("aria-label", T.stepsLabel);
  render(false);
})();
