/* Planning logic: no page access here, so it can be tested on its own (see tests.html). */
window.WWC = window.WWC || {};

WWC.planner = (function () {
  const DAY = 86400000;
  const toTime = d => Date.parse(d + "T00:00:00Z");
  const isoDate = t => new Date(t).toISOString().slice(0, 10);
  const addDays = (d, n) => isoDate(toTime(d) + n * DAY);
  const diffDays = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY);
  const range = (a, b) => Array.from({ length: diffDays(a, b) + 1 }, (_, i) => addDays(a, i));
  const clamp = (value, low, high, fallback) =>
    Number.isFinite(value) ? Math.min(high, Math.max(low, Math.round(value))) : fallback;

  function km(a, b) {
    const r = Math.PI / 180;
    const h = Math.sin((b.lat - a.lat) * r / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  }

  const airport = code => WWC.airports[code] || null;
  const home = id => WWC.homes.find(h => h.id === id) || null;

  /* The host city a home belongs to, if any. */
  const hostCityOf = h => (h && Object.keys(WWC.cities).find(k => h.airports.includes(WWC.cities[k].airport))) || null;

  const selected = ids => WWC.matches.filter(m => ids.includes(m.id))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* Another chosen match on the same day, if any. */
  const clash = (match, ids) => selected(ids).find(m => m.id !== match.id && m.date === match.date) || null;

  /*
   * Group consecutive matches in the same city into stops with arrival and departure dates.
   * A second match on the same day is left out and listed in result.skipped.
   */
  function stops(ids, opts) {
    const o = opts || {};
    const arriveBefore = clamp(o.arriveBefore, 1, 7, 1);
    const stayAfter = clamp(o.stayAfter, 1, 14, 1);
    const homeCity = hostCityOf(home(o.homeId));

    const groups = [];
    const skipped = [];
    let previousDate = null;
    selected(ids || []).forEach(m => {
      if (m.date === previousDate) { skipped.push(m); return; }
      previousDate = m.date;
      const last = groups[groups.length - 1];
      if (last && last.city === m.city) last.matches.push(m);
      else groups.push({ city: m.city, matches: [m], atHome: m.city === homeCity });
    });

    groups.forEach((g, i) => {
      const firstMatch = g.matches[0].date;
      const lastMatch = g.matches[g.matches.length - 1].date;
      g.arrive = i > 0 ? groups[i - 1].depart : g.atHome ? firstMatch : addDays(firstMatch, -arriveBefore);
      const next = groups[i + 1];
      if (!next) {
        g.depart = g.atHome ? lastMatch : addDays(lastMatch, stayAfter);
      } else {
        const early = addDays(lastMatch, 1);
        const late = addDays(next.matches[0].date, -1);
        /* People stay at home as long as they can, and go home as soon as they can. */
        const stayLong = g.atHome || (o.moveStyle === "late" && !next.atHome);
        g.depart = stayLong && late > early ? late : early;
      }
      g.nights = diffDays(g.arrive, g.depart);
    });
    groups.skipped = skipped;
    return groups;
  }

  function legs(homeId, trip) {
    const h = home(homeId);
    if (!h || !trip.length) return [];
    const result = [];
    const first = trip[0], last = trip[trip.length - 1];
    const code = stop => WWC.cities[stop.city].airport;

    if (!h.airports.includes(code(first))) {
      result.push({ id: `out-${h.id}-${code(first)}`, kind: "out", from: h.airports, to: [code(first)], date: first.arrive });
    }
    for (let i = 1; i < trip.length; i++) {
      const a = airport(code(trip[i - 1])), b = airport(code(trip[i]));
      const date = trip[i].arrive;
      const match = trip[i].matches[0];
      const previous = trip[i - 1].matches[trip[i - 1].matches.length - 1];
      result.push({
        id: `hop-${i}-${a.code}-${b.code}`, kind: "between", from: [a.code], to: [b.code], date,
        matchDay: match.date === date,
        tight: diffDays(previous.date, match.date) === 1 && (km(a, b) > 1500 || match.time < "15:00")
      });
    }
    if (!h.airports.includes(code(last))) {
      result.push({ id: `back-${code(last)}-${h.id}`, kind: "back", from: [code(last)], to: h.airports, date: last.depart });
    }
    return result;
  }

  /* ---------- Flights ---------- */

  const SPEED = 830;        /* km per hour */
  const GROUND = 0.7;       /* hours of taxiing per flight */
  const CONNECTION = 2.5;   /* hours between flights */
  const HOUR_VALUE = 14;    /* "balanced": one hour of travel counts like this many pounds per person */
  const CHANGE_VALUE = 40;  /* and each change of plane like this many pounds */
  const PARTNER_MARGIN = 1.25;

  /* Airports a suggested route may connect through. */
  const HUBS = new Set(("LHR CDG AMS FRA LIS MAD IST DXB DOH ADD JNB CMN LAD JFK MIA ATL IAH PTY BOG LIM SCL EZE LAX " +
    "MEX YYZ VVI BOM DEL BKK SIN SYD MEL AKL GRU GIG BSB CNF VCP").split(" "));

  const inBrazil = code => airport(code).region === "Brazil";
  const pathKm = path => path.slice(1).reduce((t, c, i) => t + km(airport(path[i]), airport(c)), 0);
  const pathHours = path => path.slice(1).reduce((t, c, i) => t + km(airport(path[i]), airport(c)) / SPEED + GROUND, 0) +
    (path.length - 2) * CONNECTION;
  const price = n => Math.round(n / 5) * 5;
  const score = option => option.price + option.hours * HOUR_VALUE + option.connections * CHANGE_VALUE;

  /* Every sensible route from one airport to another, with at most maxFlights flights. */
  function findPaths(origin, target, maxFlights, maxDetour) {
    const direct = km(airport(origin), airport(target));
    const limit = direct * maxDetour + 600;
    const found = [];
    (function walk(path, travelled) {
      const here = path[path.length - 1];
      (WWC.network[here] || []).forEach(next => {
        if (path.includes(next)) return;
        if (inBrazil(here) && !inBrazil(next)) return;       /* do not leave Brazil again */
        const total = travelled + km(airport(here), airport(next));
        if (total + km(airport(next), airport(target)) > limit) return;
        if (next === target) { found.push(path.concat(next)); return; }
        if (HUBS.has(next) && path.length < maxFlights) walk(path.concat(next), total);
      });
    })([origin], 0);
    return found;
  }

  function makeOption(path, directKm, domesticLeg) {
    const connections = path.length - 2;
    const detour = Math.max(1, pathKm(path) / Math.max(directKm, 1));
    const base = domesticLeg ? 30 + directKm * 0.032 : 90 + directKm * 0.043;
    const factor = domesticLeg
      ? [1.12, 0.97, 0.93][connections] || 0.93
      : [1.12, 1, 0.95][connections] || 0.92;
    return {
      id: path.join("-"), route: path, connections, hours: pathHours(path),
      price: price(base * factor * (1 + 0.15 * (detour - 1))),
      partner: path.includes("DOH") ? "qatar" : null, best: false
    };
  }

  /* The Qatar Airways routing: home to Doha, Doha to São Paulo, then onward within Brazil. */
  function qatarPaths(origin, target) {
    if (inBrazil(origin) || (origin !== "DOH" && !WWC.qatarAirports.has(origin))) return [];
    const start = origin === "DOH" ? ["DOH"] : [origin, "DOH"];
    const arrival = start.concat("GRU");
    if (target === "GRU") return [arrival];
    if (WWC.network.GRU.has(target)) return [arrival.concat(target)];
    return Array.from(WWC.network.GRU).filter(hub => inBrazil(hub) && HUBS.has(hub) && WWC.network[hub].has(target))
      .map(hub => arrival.concat(hub, target));
  }

  /*
   * Route options for one leg, best balance of price and time first. Qatar Airways moves to the top
   * only when its journey takes no more than 25% longer than the best balanced option.
   * Prices are estimated one-way adult fares in GBP.
   */
  function flightOptions(leg) {
    const origins = leg.from.filter(airport), targets = leg.to.filter(airport);
    if (!origins.length || !targets.length) return [];
    const domesticLeg = origins.every(inBrazil) && targets.every(inBrazil);
    /* Always search from the end outside Brazil, then flip the route for the way home. */
    const reversed = !domesticLeg && origins.every(inBrazil);
    const starts = reversed ? targets : origins;
    const ends = reversed ? origins : targets;

    let all = [];
    let partner = [];
    starts.forEach(a => ends.forEach(b => {
      const directKm = km(airport(a), airport(b));
      /* [most flights, longest allowed detour]: widen the search only if nothing is found. */
      const attempts = domesticLeg ? [[2, 2.2], [3, 6]] : [[3, 1.7], [4, 2.2], [5, 2.2], [4, 5]];
      let paths = [];
      for (let i = 0; i < attempts.length && !paths.length; i++) {
        /* Doha routings come only from qatarPaths, so each is a Qatar-led journey. */
        paths = findPaths(a, b, attempts[i][0], attempts[i][1]).filter(p => !p.includes("DOH") || p[0] === "DOH");
      }
      /* A home city's first airport wins a near tie. */
      const secondary = starts.indexOf(a) > 0 ? 5 : 0;
      const option = (p, domestic) => { const o = makeOption(p, directKm, domestic); o.price += secondary; return o; };
      all = all.concat(paths.map(p => option(p, domesticLeg)));
      if (!domesticLeg) partner = partner.concat(qatarPaths(a, b).map(p => option(p, false)));
    }));

    if (domesticLeg) {
      const a = airport(starts[0]), b = airport(ends[0]);
      const distance = km(a, b);
      if (distance < 520) {
        all.push({ id: "coach", route: [a.code, b.code], connections: 0, hours: distance * 1.25 / 65,
          price: price(18 + distance * 0.025), partner: null, best: false, coach: true });
      }
    }

    const byScore = (x, y) => score(x) - score(y);
    partner.sort(byScore);
    const qatar = partner[0] || null;
    if (qatar) all = all.filter(o => o.partner !== "qatar").concat(qatar);
    all.sort(byScore);
    if (!all.length) return [];

    /* Drop a route that only adds extra changes to a better one. */
    const middle = o => o.route.slice(1, -1);
    const padded = o => o.partner !== "qatar" && all.some(other => other !== o && other.connections && !other.coach &&
      other.connections < o.connections && score(other) <= score(o) && middle(other).every(c => middle(o).includes(c)));

    /* Keep one option for each first connection, so the choices are genuinely different. */
    const seen = new Set();
    const distinct = all.filter(o => !padded(o)).filter(o => {
      const key = o.coach ? "coach" : o.connections ? o.route[1] : "nonstop";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const nonstop = distinct.find(o => !o.connections && !o.coach);
    const keep = new Set([distinct[0], nonstop, distinct.find(o => o.coach)].filter(Boolean));
    distinct.forEach(o => { if (keep.size < 3 && score(o) <= score(distinct[0]) * 1.35) keep.add(o); });
    if (qatar) keep.add(qatar);

    let options = all.filter(o => keep.has(o));
    options[0].best = true;
    if (qatar && options[0] !== qatar && qatar.hours <= options[0].hours * PARTNER_MARGIN) {
      options = [qatar].concat(options.filter(o => o !== qatar));
    }
    if (reversed) options.forEach(o => { o.route = o.route.slice().reverse(); o.id = o.route.join("-"); });
    return options;
  }

  /*
   * Approximate local departure and arrival dates for a leg flown with a given option.
   * Outbound: leave in time to land early on the planned arrival day.
   * Homeward: leave on the evening of the planned departure day.
   */
  function legDates(leg, option) {
    if (!option || leg.kind === "between") return { depart: leg.date, arrive: leg.date };
    const from = airport(option.route[0]), to = airport(option.route[option.route.length - 1]);
    const HOUR = 3600000;
    if (leg.kind === "out") {
      if (from.region === "Brazil") return { depart: leg.date, arrive: leg.date };
      const landing = toTime(leg.date) + (6 - to.tz) * HOUR;
      return { depart: isoDate(landing - option.hours * HOUR + from.tz * HOUR), arrive: leg.date };
    }
    const takeoff = toTime(leg.date) + (18 - from.tz) * HOUR;
    return { depart: leg.date, arrive: isoDate(takeoff + option.hours * HOUR + to.tz * HOUR) };
  }

  /* Estimated fare for the whole group. Children are estimated at 80% of an adult fare. */
  const groupFare = (option, adults, children) => Math.round(option.price * (adults + 0.8 * children));

  /* ---------- Links to live searches ---------- */

  const q = encodeURIComponent;
  const yymmdd = d => d.slice(2).replace(/-/g, "");

  const links = {
    /* Naming an airline in this query stops Google filling in the search, so none is passed. */
    googleFlights: (from, to, date) =>
      `https://www.google.com/travel/flights?q=${q(`One way flights from ${from} to ${to} on ${date}`)}`,
    skyscanner: (from, to, date, adults) =>
      `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd(date)}/?adultsv2=${Math.min(adults, 8)}&rtn=0`,
    qatar: () => "https://www.qatarairways.com/en/homepage.html",
    /* Adults only: Booking.com needs each child's age, which the planner doesn't ask for. */
    bookingFlights: (from, to, date, adults) =>
      `https://flights.booking.com/flights/${from}.AIRPORT-${to}.AIRPORT/?type=ONEWAY&from=${from}.AIRPORT&to=${to}.AIRPORT&depart=${date}&adults=${Math.min(adults, 9)}&cabinClass=ECONOMY`,
    coach: (from, to) => `https://www.google.com/search?q=${q(`bus ${from} to ${to} tickets`)}`,
    airbnb: (place, checkin, checkout, adults, children, type) => {
      const slug = place.split(",").map(s => q(s.trim().replace(/ /g, "-"))).join("--");
      const kind = type === "entire" ? "&room_types%5B%5D=Entire%20home%2Fapt"
        : type === "room" ? "&room_types%5B%5D=Private%20room" : "";
      return `https://www.airbnb.com/s/${slug}--Brazil/homes?checkin=${checkin}&checkout=${checkout}&adults=${Math.min(adults, 16)}&children=${Math.min(children, 15)}${kind}`;
    },
    booking: (place, checkin, checkout, adults, children) =>
      `https://www.booking.com/searchresults.html?ss=${q(place + ", Brazil")}&checkin=${checkin}&checkout=${checkout}&group_adults=${Math.min(adults, 30)}&group_children=${Math.min(children, 10)}&no_rooms=${Math.min(30, Math.ceil((adults + children) / 2))}`,
    experiences: city => `https://www.airbnb.com/s/${q(city.replace(/ /g, "-"))}--Brazil/experiences`,
    /* GetYourGuide's own search ignores the query in the address, so search its pages through Google. */
    tours: query => `https://www.google.com/search?q=${q("site:getyourguide.com " + query)}`,
    map: query => `https://www.google.com/maps/search/?api=1&query=${q(query)}`
  };

  /* Estimated nightly price for the whole group, in GBP. */
  function nightly(area, type, guests) {
    if (type === "room") return area.room * Math.ceil(guests / 2);
    return Math.round(area.nightly * (1 + 0.28 * Math.max(0, guests - 2)));
  }

  /* ---------- Activities ---------- */

  /*
   * Put each chosen activity on a day.
   * picks: { "CITY:activityId": "YYYY-MM-DD" or "" }. A chosen day is kept while it is still valid.
   * Full-day and longer trips avoid match and travel days, and nothing else shares a multi-day trip.
   * Evening activities avoid days with a match kicking off at 17:00 or later.
   */
  function schedule(trip, picks) {
    const days = {};
    trip.forEach((stop, i) => range(stop.arrive, stop.depart).forEach(date => {
      const match = stop.matches.find(m => m.date === date) || null;
      const travel = !stop.atHome && ((date === stop.arrive) || (date === stop.depart && i === trip.length - 1) ||
        (date === stop.depart));
      /* On a moving day the arriving city wins, because it is written last. */
      days[date] = { date, city: stop.city, match, travel };
    }));

    const used = {};      /* date -> { full, multi, evening, short } */
    const slot = date => used[date] || (used[date] = { full: 0, multi: 0, evening: 0, short: 0 });

    function allowed(item, day) {
      const s = slot(day.date);
      if (s.multi) return false;
      if (item.kind === "full") {
        if (day.match || day.travel || s.full || s.short) return false;
        return item.days === 1 || !s.evening;
      }
      if (item.kind === "evening") return !(day.match && day.match.time >= "17:00") && !s.evening;
      return !s.full;
    }

    const span = (item, start) => Array.from({ length: item.days }, (_, i) => days[addDays(start, i)]);
    const fitsAt = (item, city, start) => span(item, start).every(d => d && d.city === city && allowed(item, d));
    const rank = d => (d.match ? 2 : d.travel ? 1 : 0);
    const load = d => { const s = slot(d.date); return s.full + s.evening + s.short; };

    const order = item => (item.days > 1 ? 0 : item.kind === "full" ? 1 : item.kind === "evening" ? 2 : 3);
    const entries = Object.entries(picks || {}).map(([key, wanted]) => {
      const [city, id] = key.split(":");
      return { key, city, wanted, item: (WWC.activities[city] || []).find(a => a.id === id) };
    }).filter(e => e.item).sort((a, b) => order(a.item) - order(b.item) || (b.wanted ? 1 : 0) - (a.wanted ? 1 : 0));

    const result = {};
    entries.forEach(e => {
      const cityDays = Object.values(days).filter(d => d.city === e.city);
      const starts = cityDays.filter(d => fitsAt(e.item, e.city, d.date))
        .sort((a, b) => a.date.localeCompare(b.date));
      const best = starts.find(d => d.date === e.wanted) ||
        starts.slice().sort((a, b) => load(a) - load(b) || rank(a) - rank(b) || a.date.localeCompare(b.date))[0];
      if (!best) {
        result[e.key] = { item: e.item, city: e.city, date: null, starts: [], notInTrip: !cityDays.length };
        return;
      }
      span(e.item, best.date).forEach(d => {
        const s = slot(d.date);
        s[e.item.kind] += 1;
        if (e.item.days > 1) s.multi += 1;
      });
      result[e.key] = { item: e.item, city: e.city, date: best.date, starts: starts.map(d => d.date), notInTrip: false };
    });
    return result;
  }

  /* Whether an activity can fit anywhere in the trip on its own. */
  function fits(trip, city, item) {
    const key = city + ":" + item.id;
    const r = schedule(trip, { [key]: "" })[key];
    return !!(r && r.date);
  }

  return { addDays, diffDays, range, km, airport, home, hostCityOf, selected, clash, stops, legs,
    flightOptions, legDates, groupFare, score, links, nightly, schedule, fits };
})();
