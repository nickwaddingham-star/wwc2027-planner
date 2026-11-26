/*
 * Screen tests. Open screens.html. Each test loads the real planner in a frame and uses it
 * as a visitor would. Results are left in window.WWC.testResults for the automated run.
 */
window.WWC = window.WWC || {};

(function () {
  const KEYS = ["wwc2027-trip-v1", "wwc2027-accounts-v1", "wwc2027-session-v1"];
  const BACKUP = "wwc2027-test-backup";
  const VIEWS = ["start", "matches", "flights", "stays", "activities", "trip", "account"];

  const results = [];
  const queue = [];
  /* A test returns an empty string when it passes. */
  const test = (name, fn) => queue.push({ name, fn });
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let runs = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  async function until(condition, message) {
    for (let i = 0; i < 100; i++) {
      const value = condition();
      if (value) return value;
      await sleep(50);
    }
    throw new Error("Timed out: " + message);
  }

  /* ---------- Putting the visitor's own data aside ---------- */

  function restore() {
    const saved = JSON.parse(localStorage.getItem(BACKUP) || "null");
    if (!saved) return;
    KEYS.forEach(k => (saved[k] === null || saved[k] === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, saved[k])));
    localStorage.removeItem(BACKUP);
  }
  function putAside() {
    restore(); /* left over from a run that was interrupted */
    localStorage.setItem(BACKUP, JSON.stringify(Object.fromEntries(KEYS.map(k => [k, localStorage.getItem(k)]))));
  }
  const clearPlanner = () => KEYS.forEach(k => localStorage.removeItem(k));

  /* ---------- Driving the planner ---------- */

  async function open(options) {
    const { view = "start", width = 1280, plan, keep } = options || {};
    document.getElementById("stage").textContent = "";
    if (!keep) clearPlanner();
    if (plan) localStorage.setItem(KEYS[0], JSON.stringify(plan));
    const frame = document.createElement("iframe");
    frame.title = "Planner under test";
    frame.width = width;
    frame.height = 800;
    frame.src = `index.html?test=${++runs}#${view}`;
    const loaded = new Promise(resolve => (frame.onload = resolve));
    document.getElementById("stage").appendChild(frame);
    await loaded;
    const win = frame.contentWindow;
    const errors = [];
    win.addEventListener("error", event => errors.push(event.message));
    win.addEventListener("unhandledrejection", event => errors.push(String(event.reason)));
    const page = {
      win, errors,
      get doc() { return win.document; },
      find(selector) {
        const found = win.document.querySelector(selector);
        assert(found, "missing on screen: " + selector);
        return found;
      },
      all: selector => Array.from(win.document.querySelectorAll(selector)),
      text: selector => page.find(selector).textContent.replace(/\s+/g, " ").trim(),
      async go(next) {
        win.location.hash = next;
        await until(() => win.document.title.startsWith(win.WWC.t.steps[next]) && win.document.querySelector("#main h1"), "screen " + next);
      },
      async click(selector) {
        const target = page.find(selector);
        assert(!target.disabled, "disabled: " + selector);
        target.click();
        await sleep(30);
      },
      /* Set a field the way typing and leaving it would. */
      async fill(selector, value) {
        const field = page.find(selector);
        field.value = value;
        field.dispatchEvent(new win.Event("input", { bubbles: true }));
        field.dispatchEvent(new win.Event("change", { bubbles: true }));
        await sleep(30);
      },
      saved: () => JSON.parse(localStorage.getItem(KEYS[0]) || "null")
    };
    await until(() => win.document.querySelector("#main h1"), "the planner to draw its first screen");
    return page;
  }

  const matchId = (page, a, b) => {
    const match = page.win.WWC.matches.find(m => m.a === a && m.b === b);
    assert(match, `sample match not found: ${a} v ${b}`);
    return match.id;
  };

  /* A typical trip: two adults and a child from London, two cities, one approved activity. */
  async function typicalPlan() {
    const page = await open();
    return {
      home: "london-gb", adults: 2, children: 1,
      matches: [matchId(page, "Brazil", "New Zealand"), matchId(page, "Brazil", "South Africa")],
      picks: { "RIO:christ": "" }
    };
  }

  function noBrokenText(page, where) {
    const text = page.doc.body.innerText;
    const found = text.match(/undefined|NaN|\[object|\bnull\b/);
    assert(!found, `${where} shows "${found && found[0]}"`);
  }

  /* ---------- 1. Every screen loads ---------- */

  const scenarios = [
    ["an empty trip", async () => null],
    ["a typical trip", typicalPlan],
    ["a fan living in the only match city", async () => {
      const p = await open();
      return { home: "rio-de-janeiro-br", matches: [matchId(p, "Brazil", "New Zealand")] };
    }],
    ["a fan passing through their home city", async () => {
      const p = await open();
      return { home: "rio-de-janeiro-br", matches: [matchId(p, "Norway", "South Africa"), matchId(p, "England", "Korea Republic"), matchId(p, "Brazil", "Norway")] };
    }]
  ];

  scenarios.forEach(([label, build]) => {
    test(`Every screen loads for ${label}`, async () => {
      const plan = await build();
      const page = await open({ plan });
      for (const view of VIEWS) {
        await page.go(view);
        assert(page.text("#main h1").length > 3, `${view} has no heading`);
        noBrokenText(page, view);
        page.all("img").forEach(i => (i.loading = "eager")); /* load photos further down too */
        const broken = page.all("img").filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute("src"));
        if (broken.length) await until(() => page.all("img").every(i => i.complete && i.naturalWidth > 0), `images on ${view}: ${broken.join(", ")}`);
      }
      assert(!page.errors.length, page.errors.join("; "));
      return "";
    });
  });

  test("The header and planning steps are in the agreed order", async () => {
    const page = await open();
    const order = [".topbar", ".eventbar", ".countdown", ".steps"].map(s => page.find(s).getBoundingClientRect().top);
    assert(order.every((top, i) => !i || top > order[i - 1]), "order is " + order.join(", "));
    const steps = page.all(".steps a").map(a => a.textContent);
    assert(steps.join("|") === "Start Trip|Matches|Flights|Stays|Activities|Your trip", steps.join(", "));
    return "";
  });

  /* ---------- 2. The full journey ---------- */

  test("Journey: plan a trip, save it, start another, then reopen it", async () => {
    let page = await open();
    await page.fill("#home", "London, United Kingdom");
    assert(page.saved().home === "london-gb", "home not kept");

    await page.go("matches");
    const first = matchId(page, "Brazil", "New Zealand"), second = matchId(page, "Brazil", "South Africa");
    await page.click(`[data-focus="match-${first}"]`);
    await page.click(`[data-focus="match-${second}"]`);
    assert(page.saved().matches.length === 2, "matches not kept");

    await page.go("flights");
    const other = page.all(".leg")[0].querySelectorAll("input[data-leg]")[1];
    assert(other, "no second flight option");
    const flight = other.value;
    other.click();
    await sleep(30);

    await page.go("stays");
    await page.click('input[data-city="RIO"][value="botafogo"]');

    await page.go("activities");
    await page.click('[data-focus="act-RIO:christ"]');

    await page.go("account");
    await page.fill("#signin-name", "Journey Test");
    await page.click('[data-focus="submit-signin"]');
    await until(() => page.doc.querySelector("#save-name"), "the save form");
    await page.go("trip");
    await page.fill("#save-name", "My test trip");
    await page.click('[data-focus="submit-save"]');
    await until(() => page.text("#save-panel").includes("All changes are saved"), "the saved message");

    /* Reload, as if coming back later. */
    page = await open({ view: "account", keep: true });
    assert(page.all(".savedtrip").length === 1 && page.text(".savedtrip h3").includes("My test trip"), "saved trip not listed after reload");
    await page.click('[data-focus="new-trip"]');
    await until(() => page.saved().matches.length === 0, "a new empty trip");
    await page.go("account");
    await page.click('.savedtrip [data-focus^="open-"]');
    await until(() => page.doc.querySelector(".triphero"), "the reopened trip");
    const plan = page.saved();
    assert(plan.matches.length === 2, "matches not restored");
    assert(Object.values(plan.flights).includes(flight), "flight choice not restored");
    assert(plan.areas.RIO === "botafogo", "neighbourhood not restored");
    assert("RIO:christ" in plan.picks, "activity not restored");
    assert(!page.errors.length, page.errors.join("; "));
    return "";
  });

  /* ---------- 3. Booking links ---------- */

  test("Your trip: booking links match the dates, route and group", async () => {
    const page = await open({ view: "trip", plan: await typicalPlan() });
    const links = page.all(".trip .cards a").map(a => a.href);
    const flights = links.filter(l => l.startsWith("https://flights.booking.com/"));
    const stays = links.filter(l => l.startsWith("https://www.airbnb.com/s/"));
    const expected = [
      [/(LHR|LGW)\.AIRPORT-GIG\.AIRPORT/, "depart=2027-06-22"],
      [/GIG\.AIRPORT-CNF\.AIRPORT/, "depart=2027-06-25"],
      [/CNF\.AIRPORT-(LHR|LGW)\.AIRPORT/, "depart=2027-06-30"]
    ];
    assert(flights.length === expected.length, `expected 3 flight links, found ${flights.length}`);
    expected.forEach(([route, date], i) => assert(route.test(flights[i]) && flights[i].includes(date) && flights[i].includes("adults=2"), "flight link wrong: " + flights[i]));
    const homes = [["Copacabana--Rio-de-Janeiro", "checkin=2027-06-23&checkout=2027-06-25"], ["Savassi--Belo-Horizonte", "checkin=2027-06-25&checkout=2027-06-30"]];
    assert(stays.length === homes.length, `expected 2 Airbnb links, found ${stays.length}`);
    homes.forEach(([area, dates], i) => assert(stays[i].includes(area) && stays[i].includes(dates) && stays[i].includes("adults=2&children=1"), "Airbnb link wrong: " + stays[i]));
    assert(links.includes("https://www.tremdocorcovado.rio/en"), "activity website link missing");
    assert(links.every(l => l.startsWith("https://")), "a link isn't https");
    assert(page.all('.trip .cards a').every(a => a.target === "_blank" && a.rel.includes("noopener")), "a booking link doesn't open safely");
    return "";
  });

  /* ---------- 4. Required labels ---------- */

  test("Every screen says it is a prototype with sample data", async () => {
    const page = await open({ plan: await typicalPlan() });
    for (const view of VIEWS) {
      await page.go(view);
      assert(page.text("#prototype") === "Prototype", "no prototype label on " + view);
      assert(page.text("#notice").includes("Sample schedule, not official"), "no sample notice on " + view);
      assert(page.text("#footer").includes("not an official FIFA product"), "no footer note on " + view);
    }
    assert(page.find('meta[name="robots"]').content.includes("noindex"), "search engines are no longer asked to stay away");
    return "";
  });

  test("Approved activities are marked as examples", async () => {
    const page = await open({ view: "activities", plan: await typicalPlan() });
    if (!page.win.WWC.approved.sample) return ""; /* the official list has replaced the sample */
    for (const view of ["activities", "trip"]) {
      await page.go(view);
      const badges = page.all("#main .approved-badge");
      assert(badges.length, "no approved badge on " + view);
      assert(badges.every(b => b.textContent.includes("Example")), "a badge on " + view + " doesn't say Example");
    }
    await page.go("activities");
    assert(page.text("#main").includes("FIFA hasn’t approved any activity"), "explanation missing");
    return "";
  });

  test("Partners are labelled correctly", async () => {
    const page = await open({ view: "flights", plan: await typicalPlan() });
    const qatar = page.all(".option.partner");
    assert(qatar.length && qatar.every(o => o.textContent.includes("FIFA Partner")), "Qatar Airways option not labelled");
    await page.go("stays");
    const airbnb = page.text(".partnerline");
    assert(airbnb.includes("FIFA Supporter") && !airbnb.includes("FIFA Partner"), "Airbnb label is: " + airbnb);
    return "";
  });

  test("Every activity photo shows its credit and licence", async () => {
    const page = await open({ view: "activities", plan: await typicalPlan() });
    for (const view of ["activities", "trip"]) {
      await page.go(view);
      const photos = page.all("#main .photo");
      assert(photos.length, "no activity photo on " + view);
      photos.forEach(figure => {
        const photo = Object.values(page.win.WWC.activityPhotos).find(p => p.file === figure.querySelector("img").getAttribute("src"));
        const links = Array.from(figure.querySelectorAll("figcaption a")).map(a => a.getAttribute("href"));
        assert(photo && figure.querySelector("img").alt, "photo without a description on " + view);
        assert(figure.textContent.includes(photo.author) && figure.textContent.includes(photo.licence) &&
          links.includes(photo.source) && links.includes(photo.licenceUrl), "credit incomplete for " + photo.file);
      });
    }
    return "";
  });

  /* ---------- 5. Safety ---------- */

  test("Names containing code show as plain text", async () => {
    const name = "<img src=x onerror=top.hacked=1>";
    const tripName = '"><b id="injected">bold</b>';
    delete window.hacked;
    const page = await open({ view: "account", plan: await typicalPlan() });
    await page.fill("#signin-name", name);
    await page.click('[data-focus="submit-signin"]');
    await until(() => page.doc.querySelector("#save-name"), "the save form");
    await page.fill("#save-name", tripName);
    await page.click('[data-focus="submit-save"]');
    await until(() => page.doc.querySelector(".savedtrip"), "the saved trip");
    await sleep(200);
    assert(page.text("#main").includes(name), "display name not shown as typed");
    assert(page.text(".savedtrip h3").includes(tripName), "trip name not shown as typed");
    await page.go("trip");
    assert(!page.doc.querySelector("#injected") && !page.doc.querySelector('img[src="x"]'), "typed code became part of the page");
    assert(window.hacked === undefined, "typed code ran");
    return "";
  });

  test("There is no password field, and sign-in says it isn't FIFA ID", async () => {
    const page = await open({ plan: await typicalPlan() });
    for (const view of VIEWS) {
      await page.go(view);
      assert(!page.doc.querySelector('input[type="password"]'), "password field on " + view);
    }
    assert(page.text("#main").includes("not FIFA ID"), "demo warning missing");
    return "";
  });

  /* ---------- 6. Files ---------- */

  test("Every file the planner refers to can be loaded", async () => {
    const page = await open();
    const local = page.all("script[src], link[rel=stylesheet][href]")
      .map(e => e.getAttribute("src") || e.getAttribute("href"))
      .filter(path => !/^(https?:|data:)/.test(path));
    const files = local.concat(Object.values(page.win.WWC.brand).filter(Boolean),
      Object.values(page.win.WWC.activityPhotos).map(p => p.file));
    assert(files.length > 10, "too few files found: " + files.length);
    const missing = [];
    for (const file of files) {
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) missing.push(file);
    }
    assert(!missing.length, "missing: " + missing.join(", "));
    return "";
  });

  /* ---------- Run ---------- */

  (async function run() {
    try {
      putAside();
      for (const { name, fn } of queue) {
        try {
          const problem = await fn();
          results.push({ name, ok: !problem, problem });
        } catch (error) {
          results.push({ name, ok: false, problem: error.message });
        }
      }
    } catch (error) {
      results.push({ name: "Test setup", ok: false, problem: error.message });
    } finally {
      document.getElementById("stage").textContent = "";
      restore();
    }
    const passed = results.filter(r => r.ok).length;
    WWC.testResults = { passed, total: results.length, failures: results.filter(r => !r.ok) };
    document.getElementById("summary").textContent = `${passed} of ${results.length} tests passed`;
    const list = document.getElementById("results");
    results.forEach(r => {
      const item = document.createElement("li");
      item.className = r.ok ? "pass" : "fail";
      item.textContent = (r.ok ? "Pass: " : "FAIL: ") + r.name + (r.problem ? " (" + r.problem + ")" : "");
      list.appendChild(item);
    });
  })();
})();
