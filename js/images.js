/*
 * Activity photos, from Wikimedia Commons. Every photo is shown with its credit and licence.
 * Keys are "CITY:activity". Activities without an entry are shown without a photo.
 * See img/activities/SOURCES.md before changing or adding one.
 */
window.WWC = window.WWC || {};

(function () {
  const BY_SA_4 = ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"];
  const BY_SA_3 = ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"];
  const BY_2 = ["CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/"];
  const CC0 = ["CC0", "https://creativecommons.org/publicdomain/zero/1.0/"];
  const COMMONS = "https://commons.wikimedia.org/wiki/File:";

  const photo = (file, alt, author, licence, page) =>
    ({ file: "img/activities/" + file, alt, author, licence: licence[0], licenceUrl: licence[1], source: COMMONS + page });

  WWC.activityPhotos = {
    "RIO:christ": photo("rio-christ.jpg", "Christ the Redeemer statue on its peak with the moon behind it",
      "Donatas Dabravolskas", BY_SA_4, "Unique_Moment_with_the_Moon_and_Christ_the_Redeemer_3.jpg"),
    "RIO:sugarloaf": photo("rio-sugarloaf.jpg", "Sugarloaf cable car high above Rio and its bay",
      "Wilfredor", CC0, "Sugarloaf_Cable_Car_viewed_from_Rio_de_Janeiro,_Brazil.jpg"),
    "SAO:futmuseum": photo("sao-futmuseum.jpg", "A yellow number 10 Brazil shirt on display at the Football Museum",
      "Adauto Neto", BY_2, "Pel%C3%A9_10,_Museu_do_futebol,_Pacaembu_%286070080673%29.jpg"),
    "BHZ:inhotim": photo("bhz-inhotim.jpg", "A lake surrounded by palms at the Inhotim art park",
      "Dlee saxx", BY_SA_4, "Lagoa_Instituto_Inhotim_-_Brumadinho_-_MG.jpg"),
    "BSB:tiles": photo("bsb-tiles.jpg", "Blue, white and red tile panels by Athos Bulcão on a gallery wall",
      "Lou Fernando", BY_SA_4, "Azulejos_de_Athos_Bulc%C3%A3o_-_acervo_da_Funda%C3%A7%C3%A3o_Athos_Bulc%C3%A3o_%281%29.jpg"),
    "SSA:whales": photo("ssa-whales.jpg", "A humpback whale’s tail rising from the sea off Bahia",
      "Mia Morete", BY_SA_3, "Jubarte_%22Chifre_de_Boi%22_Abrolhos_por_Mia_Morete.JPG"),
    "REC:frevo": photo("rec-frevo.jpg", "Red walls lettered with names inside the Paço do Frevo",
      "Eduardo Fonseca", BY_2, "2016_-_Pa%C3%A7o_do_Frevo_-_Recife_-_Pernambuco.jpg"),
    "FOR:dragao": photo("for-dragao.jpg", "Walkway and mural lit at night at the Dragão do Mar cultural centre",
      "Joelkaula", BY_SA_4, "Centro_Drag%C3%A3o_do_Mar_%C3%A0_Noite_04.jpg"),
    "POA:beirario": photo("poa-beirario.jpg", "The curved white roof of the Beira-Rio stadium",
      "Hedestad", BY_SA_4, "Est%C3%A1dio_Beira-Rio_2021_10.jpg")
  };
})();
