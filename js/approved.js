/*
 * FIFA Approved activities and activity websites.
 *
 * SAMPLE LIST. FIFA has not approved any of these. It stands in for the official list, which will
 * eventually come from a FIFA API. When it does, replace this file: set sample to false and fill
 * `list` with the activity keys ("CITY:id") the API returns.
 */
window.WWC = window.WWC || {};

WWC.approved = {
  sample: true,
  list: [
    "RIO:christ", "RIO:sugarloaf", "SAO:futmuseum", "BHZ:inhotim", "BSB:tiles",
    "SSA:whales", "REC:frevo", "FOR:dragao", "POA:beirario"
  ]
};

/*
 * Activities' own websites. Each address was opened and its page checked on 26 November 2026.
 * Not every page sells tickets. Activities without an entry fall back to a tour search.
 */
WWC.activitySites = {
  "RIO:christ": { name: "Trem do Corcovado", url: "https://www.tremdocorcovado.rio/en" },
  "RIO:sugarloaf": { name: "Parque Bondinho", url: "https://bondinho.com.br/en/ingresso-bondinho" },
  "SAO:futmuseum": { name: "Museu do Futebol", url: "https://museudofutebol.org.br/" },
  "SAO:masp": { name: "MASP", url: "https://www.masp.org.br/visite" },
  "BHZ:inhotim": { name: "Inhotim", url: "https://www.inhotim.org.br/" },
  "BHZ:mercadobh": { name: "Mercado Central", url: "https://mercadocentral.com.br/" },
  "BSB:tiles": { name: "Fundação Athos Bulcão", url: "https://fundathos.org.br/" },
  "SSA:whales": { name: "Projeto Baleia Jubarte", url: "https://www.baleiajubarte.org.br/operadoras-praiadoforte?lang=en" },
  "REC:frevo": { name: "Paço do Frevo", url: "https://pacodofrevo.org.br/" },
  "REC:brennand": { name: "Instituto Ricardo Brennand", url: "https://www.institutoricardobrennand.org.br/" },
  "FOR:dragao": { name: "Dragão do Mar", url: "https://dragaodomar.org.br/" },
  "POA:beirario": { name: "Museu do Inter", url: "https://internacional.com.br/museu-do-inter" }
};
