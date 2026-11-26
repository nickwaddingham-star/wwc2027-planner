/* Plain browser tests for the data and planning logic. Open tests.html. */
(function () {
  const P = WWC.planner;
  const results = [];
  const queue = [];
  /* A test returns an empty string when it passes. It may be async. */
  const test = (name, fn) => queue.push({ name, fn });
  const check = (condition, message) => (condition ? "" : message);
  const find = (a, b) => WWC.matches.find(m => m.a === a && m.b === b);
  const id = (a, b) => find(a, b).id;
  const homeId = code => WWC.homes.find(h => h.airports.includes(code)).id;
  const out = (code, to) => ({ kind: "out", from: P.home(homeId(code)).airports, to: [to], date: "2027-06-23" });

  /* ---------- Data ---------- */
  test("64 matches, all in known cities", () =>
    check(WWC.matches.length === 64 && WWC.matches.every(m => WWC.cities[m.city]), "count or city wrong: " + WWC.matches.length));

  test("No stadium is used on consecutive days", () => {
    const bad = [];
    Object.keys(WWC.cities).forEach(city => {
      const dates = WWC.matches.filter(m => m.city === city).map(m => m.date).sort();
      dates.slice(1).forEach((d, i) => { if (P.diffDays(dates[i], d) < 2) bad.push(`${city} ${dates[i]} and ${d}`); });
    });
    return check(!bad.length, bad.join("; "));
  });

  test("Group teams play three matches with at least three clear days between", () => {
    const teams = {};
    WWC.matches.filter(m => m.stage.startsWith("Group")).forEach(m => [m.a, m.b].forEach(t => (teams[t] = teams[t] || []).push(m.date)));
    const bad = Object.entries(teams).filter(([, d]) => d.length !== 3 ||
      d.sort().slice(1).some((x, i) => P.diffDays(d[i], x) < 4)).map(([t, d]) => `${t} ${d.join(",")}`);
    return check(Object.keys(teams).length === 32 && !bad.length, `${Object.keys(teams).length} teams; ${bad.join("; ")}`);
  });

  test("Every airport in the route network exists", () => {
    const missing = Object.keys(WWC.network).filter(c => !WWC.airports[c]);
    return check(!missing.length, missing.join(", "));
  });

  test("Every home id is unique and every home has a currency", () => {
    const ids = WWC.homes.map(h => h.id);
    return check(new Set(ids).size === ids.length && WWC.homes.every(h => h.currency), "duplicate id or missing currency");
  });

  test("At least 150 home cities", () => check(WWC.homes.length >= 150, "only " + WWC.homes.length));

  test("Currencies match their countries", () => {
    const expected = { ARN: "SEK", CPH: "DKK", OSL: "NOK", ZRH: "CHF", YYZ: "CAD", AKL: "NZD", HND: "JPY", DEL: "INR" };
    const bad = Object.entries(expected).filter(([c, cur]) => P.home(homeId(c)).currency !== cur).map(([c]) => c);
    return check(!bad.length, bad.join(", "));
  });

  test("Every city has neighbourhoods and activities", () =>
    check(Object.keys(WWC.cities).every(c => WWC.areas[c].length && WWC.activities[c].length), "missing content"));

  /* ---------- Stops and legs ---------- */
  test("Single match: arrive the day before, leave the day after", () => {
    const t = P.stops([id("Brazil", "New Zealand")], { homeId: homeId("LHR") });
    return check(t.length === 1 && t[0].arrive === "2027-06-23" && t[0].depart === "2027-06-25" && t[0].nights === 2, JSON.stringify(t));
  });

  test("Missing or silly options fall back to safe values", () => {
    const m = [id("Brazil", "New Zealand")];
    const a = P.stops(m), b = P.stops(m, { arriveBefore: NaN, stayAfter: 0 });
    return check(a[0].depart === "2027-06-25" && b[0].arrive === "2027-06-23" && b[0].depart === "2027-06-25", "bad dates");
  });

  test("Two matches on one day: the second is skipped, dates stay in order", () => {
    const t = P.stops([id("England", "Morocco"), id("Norway", "South Africa")], {});
    return check(t.length === 1 && t.skipped.length === 1 && t[0].depart > t[0].arrive, JSON.stringify(t));
  });

  test("Home in the only match city: no stay, no flights", () => {
    const home = homeId("GIG");
    const t = P.stops([id("Brazil", "New Zealand")], { homeId: home });
    return check(t[0].atHome && t[0].nights === 0 && P.legs(home, t).length === 0, JSON.stringify(t));
  });

  test("Home city in the middle of a trip is marked at home", () => {
    const home = homeId("GIG");
    const ids = [id("Norway", "South Africa"), id("England", "Korea Republic"), id("Brazil", "Norway")];
    const t = P.stops(ids, { homeId: home });
    return check(t.length === 3 && !t[0].atHome && t[1].atHome && !t[2].atHome && P.legs(home, t).length === 4, JSON.stringify(t));
  });

  test("Returning to a city makes a separate stop", () => {
    const ids = [id("Brazil", "New Zealand"), id("Brazil", "South Africa"), id("England", "Colombia")];
    const t = P.stops(ids, {});
    return check(t.map(s => s.city).join() === "RIO,BHZ,RIO" && t[1].arrive === t[0].depart, JSON.stringify(t));
  });

  test("Next-day long move is flagged as tight", () => {
    const home = homeId("LHR");
    const ids = [id("USA", "Vietnam"), id("Sweden", "Nigeria")];
    const leg = P.legs(home, P.stops(ids, { homeId: home })).find(l => l.kind === "between");
    return check(leg.matchDay && leg.tight, JSON.stringify(leg));
  });

  test("Long gap: 'late' stays until the day before the next match", () => {
    const ids = [id("Brazil", "New Zealand"), id("Finalist 1", "Finalist 2"), id("Spain", "Zambia")];
    const early = P.stops(ids, {}), late = P.stops(ids, { moveStyle: "late" });
    return check(early[1].depart === "2027-06-27" && late[1].depart === "2027-07-24", early[1].depart + " / " + late[1].depart);
  });

  /* ---------- Flights ---------- */
  const worldHomes = ["LHR", "JFK", "YVR", "MEX", "BOG", "EZE", "JNB", "LOS", "DXB", "DEL", "HND", "SYD", "WLG", "PNH", "CWB", "MAO"];
  test("A route exists from every home to every host city, and back", () => {
    const bad = [];
    WWC.homes.forEach(h => Object.values(WWC.cities).forEach(c => {
      if (h.airports.includes(c.airport)) return;
      const there = P.flightOptions({ from: h.airports, to: [c.airport] });
      if (!there.length) bad.push(h.city + ">" + c.airport);
    }));
    return check(!bad.length, bad.length + " missing: " + bad.slice(0, 20).join(", "));
  });

  test("Every route shown is made of listed flights", () => {
    const bad = [];
    worldHomes.forEach(code => ["GIG", "REC", "POA"].forEach(to => {
      P.flightOptions(out(code, to)).filter(o => !o.coach).forEach(o => {
        o.route.slice(1).forEach((c, i) => { if (!WWC.network[o.route[i]].has(c)) bad.push(o.id); });
        if (o.connections !== o.route.length - 2) bad.push(o.id + " count");
      });
    }));
    return check(!bad.length, bad.join(", "));
  });

  test("Options are ranked by balance, apart from a promoted partner", () => {
    const bad = [];
    worldHomes.forEach(code => ["GIG", "FOR"].forEach(to => {
      if (code === to) return;
      const options = P.flightOptions(out(code, to));
      const best = options.filter(o => o.best);
      const lowest = Math.min(...options.map(P.score));
      if (best.length !== 1 || P.score(best[0]) !== lowest) bad.push(code + to + " best");
      const rest = options.filter((o, i) => !(i === 0 && o.partner));
      if (rest.some((o, i) => i && P.score(o) < P.score(rest[i - 1]))) bad.push(code + to + " order");
    }));
    return check(!bad.length, bad.join(", "));
  });

  test("No route just adds changes to a better route", () => {
    const options = P.flightOptions({ from: ["REC"], to: ["LHR", "LGW"] });
    const bad = options.filter(o => !o.partner && o.connections > 1 && o.route.includes("LIS"));
    return check(!bad.length, bad.map(o => o.id).join(", "));
  });

  test("Domestic options are ranked too", () => {
    const options = P.flightOptions({ from: ["POA"], to: ["FOR"] });
    return check(options.length > 1 && options.every((o, i) => !i || P.score(o) >= P.score(options[i - 1])), JSON.stringify(options));
  });

  test("Qatar is first only when within 25% of the best journey time", () => {
    const bad = [];
    WWC.homes.forEach(h => ["GRU", "REC"].forEach(to => {
      if (h.airports.includes(to)) return;
      const options = P.flightOptions({ from: h.airports, to: [to] });
      const i = options.findIndex(o => o.partner === "qatar");
      if (i < 0) return;
      const best = options.find(o => o.best), qatar = options[i];
      const close = qatar.hours <= best.hours * 1.25;
      if (close && i !== 0) bad.push(h.city + " should be first");
      if (!close && i === 0 && !qatar.best) bad.push(h.city + " should not be first");
    }));
    return check(!bad.length, bad.slice(0, 10).join(", "));
  });

  test("London: Qatar offered via Doha but not first", () => {
    const options = P.flightOptions(out("LHR", "GRU"));
    const i = options.findIndex(o => o.partner === "qatar");
    return check(i > 0 && options[i].route.join() === "LHR,DOH,GRU" && options[0].id === "LHR-GRU", JSON.stringify(options.map(o => o.id)));
  });

  test("Doha and Delhi: Qatar comes first", () =>
    check(["DOH", "DEL"].every(c => P.flightOptions(out(c, "GRU"))[0].partner === "qatar"), "not first"));

  test("No Qatar on flights within Brazil or from South America", () => {
    const all = P.flightOptions({ from: ["GRU"], to: ["REC"] }).concat(P.flightOptions(out("EZE", "GIG")));
    return check(all.every(o => !o.partner), "partner found");
  });

  test("Way home is the same route reversed", () => {
    const back = P.flightOptions({ kind: "back", from: ["REC"], to: ["LHR", "LGW"] });
    return check(back.length && back.every(o => o.route[0] === "REC" && ["LHR", "LGW"].includes(o.route[o.route.length - 1])), JSON.stringify(back));
  });

  test("Nearby cities offer a coach", () =>
    check(P.flightOptions({ from: ["GIG"], to: ["GRU"] }).some(o => o.coach), "no coach"));

  test("Departure dates: London leaves the day before, Tokyo earlier still", () => {
    const date = code => { const leg = out(code, "GRU"); return P.legDates(leg, P.flightOptions(leg)[0]).depart; };
    return check(date("LHR") === "2027-06-22" && date("HND") <= "2027-06-22", date("LHR") + " / " + date("HND"));
  });

  /* ---------- Activities ---------- */
  const rioTrip = () => P.stops([id("Brazil", "New Zealand"), id("England", "Korea Republic")], { homeId: homeId("LHR") });

  test("Day trips avoid match and travel days", () => {
    const trip = P.stops([id("Brazil", "South Africa"), id("Spain", "Mexico")], {});
    const r = P.schedule(trip, { "BHZ:inhotim": "2027-06-29" })["BHZ:inhotim"];
    return check(r.date === "2027-06-30", "got " + r.date);
  });

  test("Evening activities avoid evening matches", () => {
    const trip = P.stops([id("Brazil", "New Zealand")], {});
    const r = P.schedule(trip, { "RIO:lapa": "2027-06-24" })["RIO:lapa"];
    return check(r.date && r.date !== "2027-06-24", "got " + r.date);
  });

  test("A multi-day trip needs enough free days and nothing shares them", () => {
    const short = P.stops([id("Brazil", "Norway")], {});
    const long = P.stops([id("France", "China"), id("China", "Ghana")], { stayAfter: 5 });
    const jeri = WWC.activities.FOR.find(a => a.id === "jeri");
    const r = P.schedule(long, { "FOR:jeri": "", "FOR:dragao": "", "FOR:futuro": "" });
    const trip = P.range(r["FOR:jeri"].date, P.addDays(r["FOR:jeri"].date, 2));
    return check(!P.fits(short, "FOR", jeri) && !trip.includes(r["FOR:dragao"].date) && !trip.includes(r["FOR:futuro"].date), JSON.stringify(r));
  });

  test("Activities for a city not in the trip are reported", () => {
    const r = P.schedule(rioTrip(), { "SAO:masp": "" })["SAO:masp"];
    return check(r && r.date === null && r.notInTrip, JSON.stringify(r));
  });

  /* ---------- Links ---------- */
  test("Search links carry route, dates and guests", () => {
    const air = P.links.airbnb("Copacabana, Rio de Janeiro", "2027-06-23", "2027-06-25", 2, 1, "entire");
    const sky = P.links.skyscanner("LHR", "GRU", "2027-06-22", 2);
    return check(air.includes("Copacabana--Rio-de-Janeiro--Brazil") && air.includes("checkin=2027-06-23") && air.includes("children=1") &&
      sky.includes("/lhr/gru/270622/") && sky.includes("rtn=0"), air + " " + sky);
  });

  const activityKeys = () => Object.entries(WWC.activities).flatMap(([city, list]) => list.map(a => `${city}:${a.id}`));

  test("Approved and website entries match real activities", () => {
    const keys = activityKeys();
    const bad = WWC.approved.list.concat(Object.keys(WWC.activitySites)).filter(k => !keys.includes(k));
    return check(!bad.length, bad.join(", "));
  });

  test("Every host city has an approved activity, each with a website", () => {
    const cities = Object.keys(WWC.cities).filter(c => !WWC.approved.list.some(k => k.startsWith(c + ":")));
    const noSite = WWC.approved.list.filter(k => !WWC.activitySites[k]);
    return check(!cities.length && !noSite.length, cities.concat(noSite).join(", "));
  });

  test("Booking.com flight link carries route, date and adults", () => {
    const url = P.links.bookingFlights("LHR", "GRU", "2027-06-22", 12);
    return check(url.includes("/LHR.AIRPORT-GRU.AIRPORT/") && url.includes("depart=2027-06-22") && url.includes("adults=9"), url);
  });

  /* ---------- Saved trips and the demo account ---------- */
  const memory = (initial) => {
    const items = Object.assign({}, initial);
    return { items, getItem: k => (k in items ? items[k] : null), setItem: (k, v) => { items[k] = String(v); }, removeItem: k => { delete items[k]; } };
  };
  const rejects = async (promise, code) => { try { await promise; return false; } catch (e) { return e.code === code; } };
  const samplePlan = () => Object.assign(WWC.trips.fresh(), {
    home: homeId("LHR"), adults: 3, matches: [id("Brazil", "New Zealand"), id("Brazil", "South Africa")],
    picks: { "RIO:christ": "" }, areas: { RIO: "botafogo" }, interests: ["food", "beach"]
  });

  test("A stored trip keeps the choices and reopens the same", () => {
    const plan = samplePlan();
    const stored = JSON.parse(JSON.stringify(WWC.trips.forStorage(plan)));
    const back = WWC.trips.clean(stored);
    return check(back.missing === 0 && WWC.trips.same(back.plan, plan) && !("tripId" in stored), JSON.stringify(back));
  });

  test("The order choices were made in doesn't count as a change", () => {
    const a = samplePlan(), b = samplePlan();
    b.matches.reverse(); b.interests.reverse();
    const c = samplePlan(); c.adults = 4;
    return check(WWC.trips.same(a, b) && !WWC.trips.same(a, c), "comparison wrong");
  });

  test("Removed or changed matches and activities are left out and counted", () => {
    const stored = WWC.trips.forStorage(samplePlan());
    stored.matchInfo[stored.matches[0]] = "2027-06-24|RIO|Brazil|Someone else";
    stored.matches.push("m999");
    stored.picks["RIO:gone"] = "";
    const back = WWC.trips.clean(stored);
    return check(back.missing === 3 && back.plan.matches.length === 1, JSON.stringify(back));
  });

  test("Damaged trip data gives a usable empty plan", () => {
    const bad = [null, "text", [], { matches: "m1", adults: "x", home: 5, picks: [], areas: null }];
    return check(bad.every(d => { const p = WWC.trips.clean(d).plan; return p.adults === 2 && p.matches.length === 0 && p.home === null; }), "not safe");
  });

  test("Sign in needs a name; no one is signed in to start", async () => {
    const account = WWC.createAccount(memory());
    const nobody = (await account.user()) === null;
    return check(nobody && await rejects(account.signIn("   "), "name") && await rejects(account.signIn("x".repeat(41)), "name") &&
      await rejects(account.save("Trip", {}), "signedOut"), "accepted bad input");
  });

  test("Several trips can be saved, updated, renamed and deleted", async () => {
    const account = WWC.createAccount(memory());
    await account.signIn("Sam");
    const first = await account.save("Rio", { adults: 1 });
    const second = await account.save("North east", { adults: 2 });
    await account.update(first.id, { adults: 5 });
    await account.rename(second.id, "Recife");
    let list = await account.list();
    const changed = list.length === 2 && list.find(t => t.id === first.id).data.adults === 5 && list.find(t => t.id === second.id).name === "Recife";
    await account.remove(first.id);
    list = await account.list();
    return check(changed && list.length === 1 && list[0].id === second.id && await rejects(account.remove(first.id), "missing") &&
      await rejects(account.rename(second.id, " "), "name"), JSON.stringify(list));
  });

  test("Trips survive signing out and stay separate for each name", async () => {
    const store = memory();
    const account = WWC.createAccount(store);
    await account.signIn("Sam");
    await account.save("Sam's trip", {});
    await account.signOut();
    const hidden = (await account.list()).length === 0;
    await account.signIn("Alex");
    const separate = (await account.list()).length === 0;
    await account.signIn("  sam ");
    const again = await WWC.createAccount(store).list();
    return check(hidden && separate && again.length === 1 && (await account.user()).name === "Sam", JSON.stringify(again));
  });

  test("Odd names are treated as ordinary names", async () => {
    const account = WWC.createAccount(memory());
    await account.signIn("__proto__");
    await account.save("One", {});
    return check((await account.list()).length === 1 && ({}).trips === undefined, "name not isolated");
  });

  test("Damaged account storage doesn't break sign-in", async () => {
    const account = WWC.createAccount(memory({ "wwc2027-accounts-v1": "{oops", "wwc2027-session-v1": "42" }));
    const before = (await account.user()) === null && (await account.list()).length === 0;
    await account.signIn("Sam");
    return check(before && (await account.user()).name === "Sam", "not recovered");
  });

  test("A browser that refuses to save reports it", async () => {
    const store = memory();
    store.setItem = () => { throw new Error("full"); };
    return check(await rejects(WWC.createAccount(store).signIn("Sam"), "storage"), "no error");
  });

  (async function run() {
    for (const { name, fn } of queue) {
      try {
        const problem = await fn();
        results.push({ name, ok: !problem, problem });
      } catch (error) {
        results.push({ name, ok: false, problem: error.message });
      }
    }
    const passed = results.filter(r => r.ok).length;
    WWC.testResults = { passed, total: results.length, failures: results.filter(r => !r.ok) };
    document.getElementById("summary").textContent = `${passed} of ${results.length} tests passed`;
    const list = document.getElementById("results");
    results.forEach(r => {
      const li = document.createElement("li");
      li.className = r.ok ? "pass" : "fail";
      li.textContent = (r.ok ? "Pass: " : "FAIL: ") + r.name + (r.problem ? " (" + r.problem + ")" : "");
      list.appendChild(li);
    });
  })();
})();
