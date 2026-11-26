/* The shape of a trip plan: defaults, checking saved data, and comparing plans. */
window.WWC = window.WWC || {};

WWC.trips = (function () {
  const INTERESTS = ["culture", "beach", "nature", "food", "football"];

  const fresh = () => ({
    home: null, adults: 2, children: 0, currency: null, matches: [], arriveBefore: 1, stayAfter: 1,
    moveStyle: "early", flights: {}, areas: {}, roomType: "entire", interests: [], picks: {}
  });

  const whole = (v, low, high, fallback) => (Number.isFinite(v) ? Math.min(high, Math.max(low, Math.round(v))) : fallback);
  const isDate = v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v);
  const plainObject = v => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

  /* What a match was when it was saved, so a changed schedule can be noticed. */
  const describe = m => [m.date, m.city, m.a, m.b].join("|");

  /*
   * Check saved data against the current content, so old or edited values can't break a screen.
   * Returns the usable plan and the number of saved matches and activities that had to be left out.
   */
  function clean(data) {
    const saved = plainObject(data);
    const s = fresh();
    let missing = 0;
    if (WWC.planner.home(saved.home)) s.home = saved.home;
    s.adults = whole(saved.adults, 1, 99, s.adults);
    s.children = whole(saved.children, 0, 99, s.children);
    if (WWC.rates[saved.currency]) s.currency = saved.currency;
    const info = plainObject(saved.matchInfo);
    (Array.isArray(saved.matches) ? saved.matches : []).forEach(id => {
      if (s.matches.includes(id)) return;
      const match = WWC.matches.find(m => m.id === id);
      if (!match || (info[id] && info[id] !== describe(match)) || WWC.planner.clash(match, s.matches)) { missing += 1; return; }
      s.matches.push(id);
    });
    s.arriveBefore = whole(saved.arriveBefore, 1, 7, 1);
    s.stayAfter = whole(saved.stayAfter, 1, 14, 1);
    if (saved.moveStyle === "late") s.moveStyle = "late";
    if (saved.roomType === "room") s.roomType = "room";
    Object.entries(plainObject(saved.flights)).forEach(([k, v]) => { if (typeof v === "string") s.flights[k] = v; });
    Object.entries(plainObject(saved.areas)).forEach(([city, id]) => {
      if ((WWC.areas[city] || []).some(a => a.id === id)) s.areas[city] = id;
    });
    s.interests = (Array.isArray(saved.interests) ? saved.interests : []).filter(x => INTERESTS.includes(x));
    Object.entries(plainObject(saved.picks)).forEach(([key, date]) => {
      const [city, id] = key.split(":");
      if ((WWC.activities[city] || []).some(a => a.id === id) && isDate(date)) s.picks[key] = date;
      else missing += 1;
    });
    return { plan: s, missing };
  }

  /* The visitor's choices only, ready to store. Prices are worked out again when a trip is opened. */
  function forStorage(plan) {
    const data = clean(plan).plan;
    data.matchInfo = {};
    data.matches.forEach(id => (data.matchInfo[id] = describe(WWC.matches.find(m => m.id === id))));
    return data;
  }

  /* Text that is the same for two plans with the same choices, whatever order they were made in. */
  function fingerprint(plan) {
    const sorted = v => Array.isArray(v) ? v.slice().sort()
      : v && typeof v === "object" ? Object.keys(v).sort().reduce((o, k) => { o[k] = sorted(v[k]); return o; }, {})
      : v;
    return JSON.stringify(sorted(clean(plan).plan));
  }

  const same = (a, b) => fingerprint(a) === fingerprint(b);

  return { fresh, clean, forStorage, same, whole };
})();
