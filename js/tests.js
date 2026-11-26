/* Plain browser tests for the data and planning logic. Open tests.html. */
(function () {
  const P = WWC.planner;
  const results = [];
  function test(name, fn) {
    try {
      const problem = fn();
      results.push({ name, ok: !problem, problem });
    } catch (error) {
      results.push({ name, ok: false, problem: error.message });
    }
  }
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
