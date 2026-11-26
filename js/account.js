/*
 * Sign-in and saved trips.
 *
 * DEMO ONLY. A visitor "signs in" with a display name. There is no password and no security:
 * everything stays in this browser, and anyone using it can open a name's trips.
 *
 * To move to FIFA ID, replace this file with one that offers the same functions:
 * user, signIn, signOut, list, save, update, rename, remove. All of them return promises, so a
 * version that talks to a server fits without rewriting the screens.
 */
window.WWC = window.WWC || {};

(function () {
  const ACCOUNTS = "wwc2027-accounts-v1";
  const SESSION = "wwc2027-session-v1";
  const MAX_NAME = 40;
  const MAX_TRIP_NAME = 60;

  const isObject = v => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = code => Object.assign(new Error(code), { code });
  const tidy = text => String(text == null ? "" : text).replace(/\s+/g, " ").trim();
  /* The prefix stops a name such as "__proto__" being treated as anything but a name. */
  const keyFor = name => "u:" + tidy(name).normalize("NFKC").toLowerCase();
  const usable = t => isObject(t) && typeof t.id === "string" && typeof t.name === "string" && isObject(t.data);
  const copy = v => JSON.parse(JSON.stringify(v));

  /* storage needs getItem, setItem and removeItem, like window.localStorage. */
  function createAccount(storage) {
    function read(key) {
      try { return JSON.parse(storage.getItem(key)); } catch (e) { return null; }
    }
    function write(key, value) {
      try { storage.setItem(key, JSON.stringify(value)); } catch (e) { throw fail("storage"); }
    }
    const accounts = () => { const all = read(ACCOUNTS); return isObject(all) ? all : {}; };

    function current() {
      const key = read(SESSION);
      const all = accounts();
      return typeof key === "string" && isObject(all[key]) ? { key, all, record: all[key] } : null;
    }
    function signedIn() {
      const found = current();
      if (!found) throw fail("signedOut");
      if (!Array.isArray(found.record.trips)) found.record.trips = [];
      return found;
    }
    function find(found, id) {
      const trip = found.record.trips.find(t => usable(t) && t.id === id);
      if (!trip) throw fail("missing");
      return trip;
    }
    function tripName(text) {
      const name = tidy(text).slice(0, MAX_TRIP_NAME);
      if (!name) throw fail("name");
      return name;
    }

    return {
      demo: true,
      async user() {
        const found = current();
        return found ? { name: String(found.record.name || found.key.slice(2)) } : null;
      },
      async signIn(text) {
        const name = tidy(text);
        if (!name || name.length > MAX_NAME) throw fail("name");
        const key = keyFor(name);
        const all = accounts();
        if (!isObject(all[key])) all[key] = { name, trips: [] };
        write(ACCOUNTS, all);
        write(SESSION, key);
        return { name: all[key].name };
      },
      async signOut() {
        try { storage.removeItem(SESSION); } catch (e) { throw fail("storage"); }
      },
      /* Newest first. */
      async list() {
        const found = current();
        if (!found || !Array.isArray(found.record.trips)) return [];
        return copy(found.record.trips.filter(usable)).sort((a, b) => String(b.saved).localeCompare(String(a.saved)));
      },
      async save(name, data) {
        const found = signedIn();
        const trip = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          name: tripName(name), saved: new Date().toISOString(), data: copy(data)
        };
        found.record.trips.push(trip);
        write(ACCOUNTS, found.all);
        return copy(trip);
      },
      async update(id, data) {
        const found = signedIn();
        const trip = find(found, id);
        trip.data = copy(data);
        trip.saved = new Date().toISOString();
        write(ACCOUNTS, found.all);
        return copy(trip);
      },
      async rename(id, name) {
        const found = signedIn();
        const trip = find(found, id);
        trip.name = tripName(name);
        write(ACCOUNTS, found.all);
        return copy(trip);
      },
      async remove(id) {
        const found = signedIn();
        find(found, id);
        found.record.trips = found.record.trips.filter(t => !(usable(t) && t.id === id));
        write(ACCOUNTS, found.all);
      }
    };
  }

  /* Reached only when used, so a browser that blocks storage can still show the planner. */
  const browserStorage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key)
  };

  WWC.createAccount = createAccount;
  WWC.account = createAccount(browserStorage);
})();
