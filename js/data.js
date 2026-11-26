/*
 * Trip content. Fixtures, prices and recommendations are SAMPLE data: replace with official
 * and live sources before public release.
 */
window.WWC = window.WWC || {};

WWC.cities = {
  RIO: { name: "Rio de Janeiro", airport: "GIG", lat: -22.91, lon: -43.17, stadium: "Maracanã",
    weather: "Mild winter, roughly 18–26°C.",
    matchday: "Metrô Line 2 and suburban trains serve Maracanã station." },
  SAO: { name: "São Paulo", airport: "GRU", lat: -23.55, lon: -46.63, stadium: "Arena Itaquera",
    weather: "Cool and fairly dry, roughly 13–23°C. Pack a jacket.",
    matchday: "Metrô Line 3 (Red) serves Corinthians-Itaquera station." },
  BHZ: { name: "Belo Horizonte", airport: "CNF", lat: -19.92, lon: -43.94, stadium: "Mineirão",
    weather: "Dry and sunny, roughly 13–25°C.",
    matchday: "The stadium is in Pampulha. Check match-day bus plans and leave early." },
  BSB: { name: "Brasília", airport: "BSB", lat: -15.79, lon: -47.88, stadium: "Estádio Nacional",
    weather: "Very dry and sunny, roughly 13–26°C. Carry water.",
    matchday: "The stadium is central, a short ride from the hotel sectors." },
  SSA: { name: "Salvador", airport: "SSA", lat: -12.97, lon: -38.50, stadium: "Arena Fonte Nova",
    weather: "Warm with showers, roughly 22–27°C.",
    matchday: "Fonte Nova is central and has metro stations nearby." },
  REC: { name: "Recife", airport: "REC", lat: -8.05, lon: -34.88, stadium: "Arena de Pernambuco",
    weather: "Warm rainy season, roughly 22–28°C.",
    matchday: "The arena is well west of the city. Allow plenty of time to get there." },
  FOR: { name: "Fortaleza", airport: "FOR", lat: -3.73, lon: -38.54, stadium: "Arena Castelão",
    weather: "Hot and breezy, roughly 24–31°C.",
    matchday: "Castelão is inland from the beaches. Check match-day transport." },
  POA: { name: "Porto Alegre", airport: "POA", lat: -30.03, lon: -51.23, stadium: "Beira-Rio",
    weather: "The coolest host city, roughly 10–20°C with rain.",
    matchday: "Beira-Rio is on the Guaíba waterfront, south of the centre." }
};

/*
 * Sample fixtures: [date, kick-off (Brasília time), city, team 1, team 2, stage].
 * Rules kept by this sample: no stadium is used on consecutive days, and every team has
 * at least three clear days between matches.
 */
WWC.matches = [
  ["06-24","17:00","RIO","Brazil","New Zealand","Group A"],
  ["06-25","13:00","SAO","Norway","South Africa","Group A"],
  ["06-25","16:00","BHZ","England","Morocco","Group B"],
  ["06-25","19:00","SSA","Colombia","Korea Republic","Group B"],
  ["06-25","21:00","POA","USA","Vietnam","Group C"],
  ["06-26","13:00","BSB","Sweden","Nigeria","Group C"],
  ["06-26","16:00","REC","Spain","Zambia","Group D"],
  ["06-26","19:00","FOR","Japan","Mexico","Group D"],
  ["06-26","21:00","RIO","Germany","Philippines","Group E"],
  ["06-27","13:00","POA","Australia","Argentina","Group E"],
  ["06-27","16:00","SAO","France","Ghana","Group F"],
  ["06-27","19:00","SSA","Canada","China","Group F"],
  ["06-27","21:00","BHZ","Netherlands","Switzerland","Group G"],
  ["06-28","14:00","FOR","Korea DPR","Jamaica","Group G"],
  ["06-28","17:00","BSB","Denmark","Haiti","Group H"],
  ["06-28","20:00","REC","Italy","Ecuador","Group H"],

  ["06-29","16:00","BHZ","Brazil","South Africa","Group A"],
  ["06-29","19:00","POA","New Zealand","Norway","Group A"],
  ["06-30","13:00","RIO","England","Korea Republic","Group B"],
  ["06-30","16:00","REC","Morocco","Colombia","Group B"],
  ["06-30","19:00","BSB","USA","Nigeria","Group C"],
  ["06-30","21:00","FOR","Vietnam","Sweden","Group C"],
  ["07-01","13:00","BHZ","Spain","Mexico","Group D"],
  ["07-01","16:00","SSA","Zambia","Japan","Group D"],
  ["07-01","19:00","SAO","Germany","Argentina","Group E"],
  ["07-01","21:00","POA","Philippines","Australia","Group E"],
  ["07-02","13:00","FOR","France","China","Group F"],
  ["07-02","16:00","RIO","Ghana","Canada","Group F"],
  ["07-02","19:00","REC","Netherlands","Jamaica","Group G"],
  ["07-02","21:00","BSB","Switzerland","Korea DPR","Group G"],
  ["07-03","16:00","SSA","Denmark","Ecuador","Group H"],
  ["07-03","19:00","SAO","Haiti","Italy","Group H"],

  ["07-04","16:00","REC","Brazil","Norway","Group A"],
  ["07-04","16:00","BSB","South Africa","New Zealand","Group A"],
  ["07-04","20:00","RIO","England","Colombia","Group B"],
  ["07-04","20:00","FOR","Korea Republic","Morocco","Group B"],
  ["07-05","16:00","SAO","USA","Sweden","Group C"],
  ["07-05","16:00","BHZ","Nigeria","Vietnam","Group C"],
  ["07-05","20:00","SSA","Spain","Japan","Group D"],
  ["07-05","20:00","POA","Mexico","Zambia","Group D"],
  ["07-06","16:00","RIO","Germany","Australia","Group E"],
  ["07-06","16:00","BSB","Argentina","Philippines","Group E"],
  ["07-06","20:00","REC","France","Canada","Group F"],
  ["07-06","20:00","FOR","China","Ghana","Group F"],
  ["07-07","16:00","SAO","Netherlands","Korea DPR","Group G"],
  ["07-07","16:00","BHZ","Jamaica","Switzerland","Group G"],
  ["07-08","20:00","SSA","Denmark","Italy","Group H"],
  ["07-08","20:00","POA","Ecuador","Haiti","Group H"],

  ["07-10","14:00","SAO","Winner Group A","Runner-up Group B","Round of 16"],
  ["07-10","18:00","BSB","Winner Group C","Runner-up Group D","Round of 16"],
  ["07-11","14:00","SSA","Winner Group B","Runner-up Group A","Round of 16"],
  ["07-11","18:00","POA","Winner Group D","Runner-up Group C","Round of 16"],
  ["07-12","14:00","RIO","Winner Group E","Runner-up Group F","Round of 16"],
  ["07-12","18:00","REC","Winner Group G","Runner-up Group H","Round of 16"],
  ["07-13","14:00","FOR","Winner Group F","Runner-up Group E","Round of 16"],
  ["07-13","18:00","BHZ","Winner Group H","Runner-up Group G","Round of 16"],

  ["07-16","16:00","FOR","Quarter-finalist 1","Quarter-finalist 2","Quarter-final"],
  ["07-16","20:00","SAO","Quarter-finalist 3","Quarter-finalist 4","Quarter-final"],
  ["07-17","16:00","BHZ","Quarter-finalist 5","Quarter-finalist 6","Quarter-final"],
  ["07-17","20:00","RIO","Quarter-finalist 7","Quarter-finalist 8","Quarter-final"],

  ["07-20","19:00","SAO","Semi-finalist 1","Semi-finalist 2","Semi-final"],
  ["07-21","19:00","RIO","Semi-finalist 3","Semi-finalist 4","Semi-final"],
  ["07-24","16:00","BHZ","Semi-final runner-up 1","Semi-final runner-up 2","Third place"],
  ["07-25","16:00","RIO","Finalist 1","Finalist 2","Final"]
].map((m, i) => ({ id: "m" + (i + 1), date: "2027-" + m[0], time: m[1], city: m[2], a: m[3], b: m[4], stage: m[5] }));

/* Neighbourhoods: nightly = typical entire place for two, room = one private room. Sample prices in GBP. */
WWC.areas = {
  RIO: [
    { id: "copa", name: "Copacabana", why: "Beachfront, with many rentals and metro access.", nightly: 85, room: 38 },
    { id: "botafogo", name: "Botafogo", why: "Local bars and restaurants in a central spot.", nightly: 72, room: 32 },
    { id: "tijuca", name: "Tijuca", why: "Residential, near the Maracanã and usually cheaper.", nightly: 52, room: 25 }
  ],
  SAO: [
    { id: "pinheiros", name: "Pinheiros", why: "Food, nightlife and street art around Vila Madalena.", nightly: 68, room: 30 },
    { id: "jardins", name: "Jardins", why: "Leafy and walkable, near Avenida Paulista.", nightly: 78, room: 36 },
    { id: "tatuape", name: "Tatuapé", why: "On the Red Line toward the stadium.", nightly: 46, room: 22 }
  ],
  BHZ: [
    { id: "savassi", name: "Savassi", why: "Popular for bars and cafés.", nightly: 48, room: 22 },
    { id: "lourdes", name: "Lourdes", why: "Central and known for restaurants.", nightly: 55, room: 26 },
    { id: "pampulha", name: "Pampulha", why: "Near the Mineirão and the lakeside sights.", nightly: 40, room: 18 }
  ],
  BSB: [
    { id: "asasul", name: "Asa Sul", why: "Established residential blocks with shops and bars.", nightly: 50, room: 24 },
    { id: "asanorte", name: "Asa Norte", why: "Relaxed, with a student feel.", nightly: 44, room: 21 },
    { id: "shn", name: "Setor Hoteleiro Norte", why: "Hotel district near the stadium.", nightly: 62, room: 30 }
  ],
  SSA: [
    { id: "barra", name: "Barra", why: "Beach and lighthouse sunsets.", nightly: 55, room: 24 },
    { id: "riovermelho", name: "Rio Vermelho", why: "Nightlife and acarajé stalls.", nightly: 50, room: 22 },
    { id: "santoantonio", name: "Santo Antônio Além do Carmo", why: "Colourful historic streets near the old town.", nightly: 46, room: 21 }
  ],
  REC: [
    { id: "boaviagem", name: "Boa Viagem", why: "The main beach district, near the airport.", nightly: 50, room: 22 },
    { id: "gracas", name: "Graças", why: "Quiet, leafy and residential.", nightly: 38, room: 18 },
    { id: "olinda", name: "Olinda", place: "Olinda, Pernambuco", why: "Historic hill town next door.", nightly: 42, room: 19 }
  ],
  FOR: [
    { id: "meireles", name: "Meireles", why: "Seafront promenade and evening market.", nightly: 46, room: 20 },
    { id: "iracema", name: "Praia de Iracema", why: "Nightlife near the Dragão do Mar cultural centre.", nightly: 38, room: 17 },
    { id: "aldeota", name: "Aldeota", why: "Central residential area with dining.", nightly: 36, room: 17 }
  ],
  POA: [
    { id: "moinhos", name: "Moinhos de Vento", why: "Parks, cafés and walkable streets.", nightly: 52, room: 24 },
    { id: "cidadebaixa", name: "Cidade Baixa", why: "Student bars and live music.", nightly: 36, room: 17 },
    { id: "meninodeus", name: "Menino Deus", why: "Near Beira-Rio and the waterfront.", nightly: 40, room: 19 }
  ]
};

/*
 * Activities. tags: culture, beach, nature, food, football. cost: sample GBP per person.
 * time: "2 hours", "Half day", "Evening", "Full day" or "N days".
 */
(function () {
  const act = (id, name, tags, time, cost, note) => {
    const multi = /^(\d+) days$/.exec(time);
    const kind = multi || time === "Full day" ? "full" : time === "Evening" ? "evening" : "short";
    return { id, name, tags, time, cost, note, kind, days: multi ? Number(multi[1]) : 1 };
  };

  WWC.activities = {
    RIO: [
      act("christ","Christ the Redeemer and Corcovado train",["culture","nature"],"Half day",22,"Go early for the best chance of clear views."),
      act("sugarloaf","Sugarloaf cable car at sunset",["nature"],"Half day",28,"Check the weather before booking."),
      act("lapa","Samba night in Lapa",["food","culture"],"Evening",18,"Usually liveliest on Friday and Saturday."),
      act("tijucaforest","Tijuca Forest hike",["nature"],"Half day",25,"Consider a guide for longer trails."),
      act("beachday","Ipanema beach and Arpoador sunset",["beach"],"Half day",0,"Chairs can be rented on the beach."),
      act("mtour","Maracanã stadium tour",["football"],"2 hours",12,"Tours may pause during the tournament.")
    ],
    SAO: [
      act("futmuseum","Museu do Futebol at Pacaembu",["football","culture"],"Half day",4,"Check opening days."),
      act("masp","MASP and Avenida Paulista",["culture"],"Half day",10,"The avenue is usually traffic-free on Sundays."),
      act("mercadao","Mercadão food hall",["food"],"2 hours",12,"Known for its mortadella sandwich."),
      act("liberdade","Liberdade Japanese district",["food","culture"],"Half day",10,"A street fair runs at weekends."),
      act("ibirapuera","Ibirapuera Park and museums",["nature","culture"],"Half day",0,"Bikes can be hired in the park."),
      act("beco","Beco do Batman street art walk",["culture"],"2 hours",0,"Pair it with lunch in Vila Madalena.")
    ],
    BHZ: [
      act("inhotim","Inhotim art park day trip",["culture","nature"],"Full day",35,"Closed some weekdays, so check first."),
      act("ouropreto","Ouro Preto colonial town",["culture"],"Full day",40,"About two hours each way."),
      act("mercadobh","Mercado Central tasting",["food"],"Half day",15,"Cheese, coffee and cachaça."),
      act("pampulhaarch","Pampulha modernist walk",["culture"],"Half day",0,"Close to the stadium area."),
      act("botecos","Boteco crawl in Savassi",["food"],"Evening",20,"The city is known for bar food.")
    ],
    BSB: [
      act("esplanada","Niemeyer architecture tour",["culture"],"Half day",20,"Cathedral, Congress and Itamaraty."),
      act("tiles","Athos Bulcão tile trail",["culture"],"2 hours",0,"Tile murals across the central city."),
      act("pontao","Sunset at Pontão do Lago Sul",["food","nature"],"Evening",18,"Lakeside restaurants."),
      act("parque","Cycle the Parque da Cidade",["nature"],"Half day",5,"Dry season, so bring water."),
      act("veadeiros","Chapada dos Veadeiros waterfalls",["nature"],"2 days",140,"Several hours' drive north.")
    ],
    SSA: [
      act("pelourinho","Pelourinho old town walk",["culture"],"Half day",15,"Listen out for drum rehearsals."),
      act("barrasunset","Farol da Barra sunset",["beach"],"Evening",0,"A popular local ritual."),
      act("moqueca","Moqueca and market lunch",["food"],"Half day",18,"Start at Mercado Modelo."),
      act("whales","Whale watching from Praia do Forte",["nature","beach"],"Full day",55,"The humpback season starts around July."),
      act("morro","Morro de São Paulo island stay",["beach","nature"],"2 days",95,"Boat crossings can be rough in winter.")
    ],
    REC: [
      act("olindawalk","Olinda historic hills",["culture"],"Half day",8,"Churches, studios and views."),
      act("frevo","Paço do Frevo and Recife Antigo",["culture","food"],"Half day",5,"A centre for frevo music and dance."),
      act("brennand","Instituto Ricardo Brennand",["culture"],"Half day",10,"Museum with large gardens."),
      act("galinhas","Porto de Galinhas natural pools",["beach","nature"],"Full day",35,"Check tide times and the forecast."),
      act("forro","Forró night",["food","culture"],"Evening",12,"Ask locally where June festivals continue.")
    ],
    FOR: [
      act("futuro","Praia do Futuro beach huts",["beach","food"],"Half day",15,"Known for seafood."),
      act("dragao","Dragão do Mar cultural centre",["culture"],"Evening",5,"Galleries and bars."),
      act("canoa","Canoa Quebrada cliffs",["beach","nature"],"Full day",35,"Red cliffs and buggy rides."),
      act("cumbuco","Kite lesson at Cumbuco",["beach","nature"],"Full day",70,"Winds usually pick up mid-year."),
      act("jeri","Jericoacoara dunes and lagoons",["beach","nature"],"3 days",160,"A long transfer, worth several days.")
    ],
    POA: [
      act("orla","Orla do Guaíba sunset",["nature"],"Evening",0,"A favourite local view."),
      act("churrasco","Gaúcho churrasco dinner",["food"],"Evening",25,"Come hungry."),
      act("mercadopoa","Mercado Público and old centre",["culture","food"],"Half day",8,"Try chimarrão."),
      act("beirario","Grêmio and Internacional football sites",["football"],"Half day",12,"Two fierce rivals."),
      act("gramado","Gramado and Canela in winter",["nature","food"],"2 days",110,"Mountain towns and canyons."),
      act("vinhedos","Vale dos Vinhedos wine day",["food","nature"],"Full day",60,"Book tastings ahead.")
    ]
  };
})();

/* Rough outline of Brazil as [lon, lat] points, for the route map. */
WWC.outline = [[-60,5.2],[-59,1.3],[-56.5,1.9],[-54.6,2.3],[-52.9,2.2],[-51.6,4.4],[-50.7,2.1],[-50,.9],[-48.4,-.3],[-46,-1.1],[-44.3,-2.4],[-41.8,-2.9],[-39.5,-3.1],[-37.3,-4.7],[-35.3,-5.2],[-34.8,-7.2],[-35.1,-9],[-37,-11],[-38.5,-13],[-39,-14.8],[-39.2,-17.7],[-39.8,-19.6],[-41,-22],[-42,-22.9],[-44.7,-23.2],[-46.4,-24],[-48.4,-25.6],[-48.7,-28.4],[-50.2,-30],[-52.1,-32.2],[-53.4,-33.7],[-55.6,-30.9],[-57.6,-30.2],[-55.8,-28.2],[-53.8,-27.1],[-54.6,-25.6],[-54.3,-24],[-55.7,-22.4],[-57.9,-22.1],[-58.2,-19.8],[-57.7,-17.6],[-60.2,-16.3],[-60.5,-13.8],[-62.8,-13],[-65.4,-11.5],[-65.4,-9.8],[-68.7,-11.1],[-70.6,-11],[-70.6,-9.5],[-72.2,-10],[-73.2,-9.4],[-74,-7.5],[-72.9,-5.2],[-69.9,-4.3],[-69.4,-1.1],[-70,.6],[-69.8,1.7],[-67.1,1.7],[-65.5,.9],[-63.4,2.1],[-64.8,4.1],[-62.7,4],[-60.7,4.9]];

/* Rough, illustrative units per 1 GBP (set 26 November 2026, not a live feed). */
WWC.ratesDate = "26 November 2026";
WWC.rates = {
  GBP: 1, USD: 1.30, EUR: 1.15, CHF: 1.07, DKK: 8.6, SEK: 12.6, NOK: 13.5, ISK: 165, PLN: 4.9, CZK: 28,
  HUF: 440, RON: 5.8, CAD: 1.80, MXN: 24, BRL: 7.1, CLP: 1230, COP: 5200, PEN: 4.6, UYU: 52, ZAR: 23,
  MAD: 12.3, KES: 168, AED: 4.8, QAR: 4.75, SAR: 4.9, KWD: 0.40, BHD: 0.49, OMR: 0.50, JOD: 0.92, ILS: 4.4,
  INR: 115, CNY: 9.3, HKD: 10.1, TWD: 41, JPY: 200, KRW: 1850, SGD: 1.70, THB: 43, MYR: 5.5, IDR: 21500,
  VND: 34000, PHP: 76, AUD: 2.0, NZD: 2.25
};
