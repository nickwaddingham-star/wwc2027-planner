/*
 * Airports, countries and routes.
 * Routes are "usually served" nonstop services compiled by hand. They are NOT live or verified
 * schedules: the site must always tell visitors to check them for their date.
 */
window.WWC = window.WWC || {};

(function () {
  /* code: [name, currency, region] */
  const countries = {
    GB: ["United Kingdom","GBP","Europe"], IE: ["Ireland","EUR","Europe"], FR: ["France","EUR","Europe"],
    ES: ["Spain","EUR","Europe"], PT: ["Portugal","EUR","Europe"], NL: ["Netherlands","EUR","Europe"],
    BE: ["Belgium","EUR","Europe"], LU: ["Luxembourg","EUR","Europe"], DE: ["Germany","EUR","Europe"],
    CH: ["Switzerland","CHF","Europe"], AT: ["Austria","EUR","Europe"], IT: ["Italy","EUR","Europe"],
    MT: ["Malta","EUR","Europe"], DK: ["Denmark","DKK","Europe"], SE: ["Sweden","SEK","Europe"],
    NO: ["Norway","NOK","Europe"], FI: ["Finland","EUR","Europe"], IS: ["Iceland","ISK","Europe"],
    PL: ["Poland","PLN","Europe"], CZ: ["Czechia","CZK","Europe"], HU: ["Hungary","HUF","Europe"],
    RO: ["Romania","RON","Europe"], BG: ["Bulgaria","EUR","Europe"], GR: ["Greece","EUR","Europe"],
    RS: ["Serbia","RSD","Europe"], HR: ["Croatia","EUR","Europe"], SI: ["Slovenia","EUR","Europe"],
    LV: ["Latvia","EUR","Europe"], LT: ["Lithuania","EUR","Europe"], EE: ["Estonia","EUR","Europe"],
    CY: ["Cyprus","EUR","Europe"], TR: ["Türkiye","TRY","Europe"],

    US: ["United States","USD","North America"], CA: ["Canada","CAD","North America"], MX: ["Mexico","MXN","North America"],
    PA: ["Panama","USD","Central America and Caribbean"], CR: ["Costa Rica","CRC","Central America and Caribbean"],
    GT: ["Guatemala","GTQ","Central America and Caribbean"], SV: ["El Salvador","USD","Central America and Caribbean"],
    CU: ["Cuba","CUP","Central America and Caribbean"], DO: ["Dominican Republic","DOP","Central America and Caribbean"],
    JM: ["Jamaica","JMD","Central America and Caribbean"], TT: ["Trinidad and Tobago","TTD","Central America and Caribbean"],
    PR: ["Puerto Rico","USD","Central America and Caribbean"],

    CO: ["Colombia","COP","South America"], EC: ["Ecuador","USD","South America"], PE: ["Peru","PEN","South America"],
    VE: ["Venezuela","VES","South America"], BO: ["Bolivia","BOB","South America"], CL: ["Chile","CLP","South America"],
    AR: ["Argentina","ARS","South America"], UY: ["Uruguay","UYU","South America"], PY: ["Paraguay","PYG","South America"],

    ZA: ["South Africa","ZAR","Africa"], NG: ["Nigeria","NGN","Africa"], GH: ["Ghana","GHS","Africa"],
    CI: ["Côte d'Ivoire","XOF","Africa"], SN: ["Senegal","XOF","Africa"], MA: ["Morocco","MAD","Africa"],
    DZ: ["Algeria","DZD","Africa"], TN: ["Tunisia","TND","Africa"], EG: ["Egypt","EGP","Africa"],
    ET: ["Ethiopia","ETB","Africa"], KE: ["Kenya","KES","Africa"], TZ: ["Tanzania","TZS","Africa"],
    UG: ["Uganda","UGX","Africa"], RW: ["Rwanda","RWF","Africa"], AO: ["Angola","AOA","Africa"],
    MZ: ["Mozambique","MZN","Africa"], ZW: ["Zimbabwe","USD","Africa"], ZM: ["Zambia","ZMW","Africa"],
    NA: ["Namibia","NAD","Africa"], CM: ["Cameroon","XAF","Africa"], CD: ["DR Congo","CDF","Africa"],
    CV: ["Cape Verde","CVE","Africa"],

    AE: ["United Arab Emirates","AED","Middle East"], QA: ["Qatar","QAR","Middle East"], SA: ["Saudi Arabia","SAR","Middle East"],
    KW: ["Kuwait","KWD","Middle East"], BH: ["Bahrain","BHD","Middle East"], OM: ["Oman","OMR","Middle East"],
    JO: ["Jordan","JOD","Middle East"], LB: ["Lebanon","USD","Middle East"], IL: ["Israel","ILS","Middle East"],
    IQ: ["Iraq","IQD","Middle East"],

    IN: ["India","INR","Asia"], PK: ["Pakistan","PKR","Asia"], BD: ["Bangladesh","BDT","Asia"], LK: ["Sri Lanka","LKR","Asia"],
    NP: ["Nepal","NPR","Asia"], MV: ["Maldives","USD","Asia"], UZ: ["Uzbekistan","UZS","Asia"], KZ: ["Kazakhstan","KZT","Asia"],
    GE: ["Georgia","GEL","Asia"], AM: ["Armenia","AMD","Asia"], AZ: ["Azerbaijan","AZN","Asia"], CN: ["China","CNY","Asia"],
    HK: ["Hong Kong","HKD","Asia"], TW: ["Taiwan","TWD","Asia"], JP: ["Japan","JPY","Asia"], KR: ["South Korea","KRW","Asia"],
    SG: ["Singapore","SGD","Asia"], TH: ["Thailand","THB","Asia"], MY: ["Malaysia","MYR","Asia"], ID: ["Indonesia","IDR","Asia"],
    VN: ["Vietnam","VND","Asia"], KH: ["Cambodia","USD","Asia"], PH: ["Philippines","PHP","Asia"],

    AU: ["Australia","AUD","Oceania"], NZ: ["New Zealand","NZD","Oceania"], FJ: ["Fiji","FJD","Oceania"],
    BR: ["Brazil","BRL","Brazil"]
  };

  /* [code, city, country, lat, lon, UTC offset in June 2027, usual nonstop links toward hubs] */
  const rows = [
    ["LHR","London","GB",51.47,-0.45,1,"CDG AMS FRA LIS MAD IST DXB JFK MIA ATL IAH ADD JNB"],
    ["LGW","London","GB",51.15,-0.18,1,"LIS MAD IST DXB"],
    ["MAN","Manchester","GB",53.35,-2.27,1,"LHR CDG AMS FRA LIS MAD IST DXB JFK ATL ADD"],
    ["BHX","Birmingham","GB",52.45,-1.75,1,"CDG AMS FRA LIS MAD IST DXB"],
    ["EDI","Edinburgh","GB",55.95,-3.37,1,"LHR CDG AMS FRA LIS MAD IST JFK ATL"],
    ["GLA","Glasgow","GB",55.87,-4.43,1,"LHR CDG AMS LIS IST DXB"],
    ["BRS","Bristol","GB",51.38,-2.72,1,"AMS CDG LIS MAD"],
    ["NCL","Newcastle","GB",55.04,-1.69,1,"LHR CDG AMS DXB"],
    ["BFS","Belfast","GB",54.66,-6.22,1,"LHR AMS LIS"],
    ["DUB","Dublin","IE",53.42,-6.27,1,"LHR CDG AMS FRA LIS MAD IST DXB JFK MIA ATL ADD"],
    ["ORK","Cork","IE",51.84,-8.49,1,"LHR CDG AMS LIS"],
    ["CDG","Paris","FR",49.01,2.55,2,"LHR AMS FRA LIS MAD IST DXB JFK MIA ATL IAH BOG PTY ADD JNB"],
    ["LYS","Lyon","FR",45.73,5.08,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["MRS","Marseille","FR",43.44,5.22,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["NCE","Nice","FR",43.66,7.22,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["TLS","Toulouse","FR",43.63,1.37,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["MAD","Madrid","ES",40.47,-3.56,2,"LHR CDG AMS FRA LIS IST DXB JFK MIA ATL BOG PTY"],
    ["BCN","Barcelona","ES",41.30,2.08,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK MIA"],
    ["VLC","Valencia","ES",39.49,-0.48,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["SVQ","Seville","ES",37.42,-5.89,2,"LHR CDG AMS FRA LIS MAD"],
    ["AGP","Málaga","ES",36.67,-4.50,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["BIO","Bilbao","ES",43.30,-2.91,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["LIS","Lisbon","PT",38.77,-9.13,1,"LHR CDG AMS FRA MAD IST DXB JFK MIA"],
    ["OPO","Porto","PT",41.25,-8.68,1,"LHR CDG AMS FRA LIS MAD IST JFK"],
    ["AMS","Amsterdam","NL",52.31,4.76,2,"LHR CDG FRA LIS MAD IST DXB JFK ATL PTY"],
    ["BRU","Brussels","BE",50.90,4.48,2,"LHR CDG FRA LIS MAD IST DXB JFK ADD"],
    ["LUX","Luxembourg","LU",49.63,6.21,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["BER","Berlin","DE",52.37,13.50,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["FRA","Frankfurt","DE",50.04,8.56,2,"LHR CDG AMS LIS MAD IST DXB JFK MIA ATL ADD JNB"],
    ["MUC","Munich","DE",48.35,11.79,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["HAM","Hamburg","DE",53.63,9.99,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["DUS","Düsseldorf","DE",51.29,6.77,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["CGN","Cologne","DE",50.87,7.14,2,"LHR LIS MAD IST"],
    ["STR","Stuttgart","DE",48.69,9.22,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["ZRH","Zurich","CH",47.46,8.55,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK MIA"],
    ["GVA","Geneva","CH",46.24,6.11,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK ADD"],
    ["VIE","Vienna","AT",48.11,16.57,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK ADD"],
    ["FCO","Rome","IT",41.80,12.25,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK MIA ATL ADD"],
    ["MXP","Milan","IT",45.63,8.72,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK ADD"],
    ["VCE","Venice","IT",45.51,12.35,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["BLQ","Bologna","IT",44.54,11.29,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["NAP","Naples","IT",40.89,14.29,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["MLA","Valletta","MT",35.86,14.48,2,"LHR CDG AMS FRA LIS MAD IST"],
    ["CPH","Copenhagen","DK",55.62,12.65,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["ARN","Stockholm","SE",59.65,17.92,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["GOT","Gothenburg","SE",57.66,12.29,2,"LHR CDG AMS FRA IST"],
    ["OSL","Oslo","NO",60.19,11.10,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["BGO","Bergen","NO",60.29,5.22,2,"LHR CDG AMS FRA"],
    ["HEL","Helsinki","FI",60.32,24.96,3,"LHR CDG AMS FRA LIS MAD IST"],
    ["KEF","Reykjavík","IS",63.99,-22.61,0,"LHR CDG AMS FRA MAD JFK"],
    ["WAW","Warsaw","PL",52.17,20.97,2,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["KRK","Kraków","PL",50.08,19.78,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["PRG","Prague","CZ",50.10,14.26,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["BUD","Budapest","HU",47.44,19.26,2,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["OTP","Bucharest","RO",44.57,26.09,3,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["SOF","Sofia","BG",42.70,23.41,3,"LHR CDG AMS FRA LIS MAD IST DXB"],
    ["ATH","Athens","GR",37.94,23.95,3,"LHR CDG AMS FRA LIS MAD IST DXB JFK"],
    ["SKG","Thessaloniki","GR",40.52,22.97,3,"LHR CDG AMS FRA IST"],
    ["BEG","Belgrade","RS",44.82,20.31,2,"LHR CDG AMS FRA LIS IST"],
    ["ZAG","Zagreb","HR",45.74,16.07,2,"LHR CDG AMS FRA LIS IST DXB"],
    ["LJU","Ljubljana","SI",46.22,14.46,2,"LHR CDG AMS FRA IST"],
    ["RIX","Riga","LV",56.92,23.97,3,"LHR CDG AMS FRA IST"],
    ["VNO","Vilnius","LT",54.63,25.29,3,"LHR CDG AMS FRA IST"],
    ["TLL","Tallinn","EE",59.41,24.83,3,"LHR CDG AMS FRA IST"],
    ["LCA","Larnaca","CY",34.88,33.62,3,"LHR CDG AMS FRA MAD IST DXB"],
    ["IST","Istanbul","TR",41.26,28.74,3,"LHR CDG AMS FRA LIS MAD DXB JFK MIA"],
    ["ESB","Ankara","TR",40.13,32.99,3,"IST"],

    ["JFK","New York","US",40.64,-73.78,-4,"LHR CDG AMS FRA LIS MAD IST DXB ATL MIA IAH PTY BOG"],
    ["EWR","New York","US",40.69,-74.17,-4,"LHR CDG LIS MAD IST MIA PTY"],
    ["BOS","Boston","US",42.36,-71.01,-4,"LHR CDG AMS FRA LIS MAD IST DXB JFK ATL MIA PTY"],
    ["PHL","Philadelphia","US",39.87,-75.24,-4,"LHR LIS MAD JFK ATL MIA"],
    ["IAD","Washington DC","US",38.95,-77.46,-4,"LHR CDG AMS FRA LIS MAD IST DXB ATL MIA PTY BOG"],
    ["CLT","Charlotte","US",35.21,-80.94,-4,"LHR MAD MIA ATL"],
    ["RDU","Raleigh","US",35.88,-78.79,-4,"LHR CDG MIA ATL"],
    ["ATL","Atlanta","US",33.64,-84.43,-4,"LHR CDG AMS JFK MIA IAH PTY BOG"],
    ["MCO","Orlando","US",28.43,-81.31,-4,"LHR FRA MIA ATL PTY BOG"],
    ["TPA","Tampa","US",27.98,-82.53,-4,"LHR MIA ATL PTY"],
    ["MIA","Miami","US",25.79,-80.29,-4,"LHR CDG AMS FRA LIS MAD IST JFK ATL IAH PTY BOG"],
    ["DTW","Detroit","US",42.21,-83.35,-4,"LHR CDG AMS FRA ATL MIA JFK"],
    ["ORD","Chicago","US",41.97,-87.91,-5,"LHR CDG AMS FRA LIS MAD IST DXB ATL MIA IAH PTY BOG"],
    ["MSP","Minneapolis","US",44.88,-93.22,-5,"LHR CDG AMS ATL MIA JFK"],
    ["STL","St. Louis","US",38.75,-90.37,-5,"ATL MIA JFK IAH"],
    ["BNA","Nashville","US",36.13,-86.68,-5,"LHR MIA ATL JFK"],
    ["MSY","New Orleans","US",29.99,-90.26,-5,"ATL MIA IAH PTY"],
    ["DFW","Dallas","US",32.90,-97.04,-5,"LHR CDG FRA MAD IST DXB ATL MIA BOG PTY"],
    ["IAH","Houston","US",29.98,-95.34,-5,"LHR CDG AMS FRA IST DXB ATL MIA PTY BOG"],
    ["AUS","Austin","US",30.19,-97.67,-5,"LHR FRA ATL MIA IAH PTY"],
    ["DEN","Denver","US",39.86,-104.67,-6,"LHR FRA ATL MIA IAH PTY"],
    ["SLC","Salt Lake City","US",40.79,-111.98,-6,"LHR CDG AMS ATL"],
    ["PHX","Phoenix","US",33.43,-112.01,-7,"LHR ATL MIA IAH"],
    ["LAS","Las Vegas","US",36.08,-115.15,-7,"LHR AMS ATL MIA IAH PTY"],
    ["SAN","San Diego","US",32.73,-117.19,-7,"LHR ATL MIA IAH"],
    ["LAX","Los Angeles","US",33.94,-118.41,-7,"LHR CDG AMS FRA LIS MAD IST DXB ATL MIA IAH PTY BOG LIM"],
    ["SFO","San Francisco","US",37.62,-122.38,-7,"LHR CDG AMS FRA LIS IST DXB ATL MIA PTY"],
    ["SEA","Seattle","US",47.45,-122.31,-7,"LHR CDG AMS FRA IST DXB ATL MIA"],
    ["PDX","Portland","US",45.59,-122.60,-7,"LHR AMS ATL"],
    ["YYZ","Toronto","CA",43.68,-79.63,-4,"LHR CDG AMS FRA LIS MAD IST DXB ADD MIA ATL PTY BOG"],
    ["YUL","Montreal","CA",45.47,-73.74,-4,"LHR CDG AMS FRA LIS MAD IST ATL MIA PTY"],
    ["YOW","Ottawa","CA",45.32,-75.67,-4,"LHR CDG ATL YYZ"],
    ["YHZ","Halifax","CA",44.88,-63.51,-3,"LHR YYZ"],
    ["YYC","Calgary","CA",51.11,-114.02,-6,"LHR AMS FRA CDG YYZ ATL"],
    ["YEG","Edmonton","CA",53.31,-113.58,-6,"AMS YYZ"],
    ["YVR","Vancouver","CA",49.19,-123.18,-7,"LHR CDG AMS FRA YYZ MIA"],
    ["MEX","Mexico City","MX",19.44,-99.07,-6,"LHR CDG AMS FRA MAD IST ATL MIA IAH JFK PTY BOG LIM"],
    ["GDL","Guadalajara","MX",20.52,-103.31,-6,"MEX ATL MIA IAH PTY"],
    ["MTY","Monterrey","MX",25.78,-100.11,-6,"MEX ATL IAH PTY MAD"],
    ["CUN","Cancún","MX",21.04,-86.87,-5,"LHR CDG AMS FRA MAD IST ATL MIA PTY BOG"],

    ["PTY","Panama City","PA",9.07,-79.38,-5,"MIA MAD CDG AMS IST ATL JFK IAH BOG"],
    ["SJO","San José","CR",9.99,-84.21,-6,"MAD CDG LHR MIA ATL IAH PTY BOG"],
    ["GUA","Guatemala City","GT",14.58,-90.53,-6,"MAD MIA ATL IAH PTY BOG"],
    ["SAL","San Salvador","SV",13.44,-89.06,-6,"MAD MIA IAH PTY BOG"],
    ["HAV","Havana","CU",22.99,-82.41,-4,"MAD CDG IST PTY BOG"],
    ["SDQ","Santo Domingo","DO",18.43,-69.67,-4,"MAD MIA ATL JFK PTY BOG"],
    ["KIN","Kingston","JM",17.94,-76.79,-5,"LHR MIA ATL JFK PTY"],
    ["POS","Port of Spain","TT",10.60,-61.34,-4,"MIA PTY"],
    ["SJU","San Juan","PR",18.44,-66.00,-4,"MAD MIA ATL JFK PTY BOG"],

    ["BOG","Bogotá","CO",4.70,-74.15,-5,"MAD CDG LHR AMS FRA IST MIA JFK ATL PTY LIM SCL EZE"],
    ["MDE","Medellín","CO",6.17,-75.43,-5,"MAD MIA PTY BOG"],
    ["UIO","Quito","EC",-0.13,-78.36,-5,"MAD AMS MIA ATL IAH PTY BOG LIM"],
    ["GYE","Guayaquil","EC",-2.16,-79.88,-5,"MAD MIA PTY BOG LIM"],
    ["LIM","Lima","PE",-12.02,-77.11,-5,"MAD CDG AMS MIA ATL IAH PTY BOG SCL EZE"],
    ["CCS","Caracas","VE",10.60,-66.99,-4,"MAD IST PTY BOG"],
    ["LPB","La Paz","BO",-16.51,-68.19,-4,"LIM BOG VVI"],
    ["VVI","Santa Cruz","BO",-17.64,-63.14,-4,"LIM PTY BOG EZE MIA"],
    ["SCL","Santiago","CL",-33.39,-70.79,-4,"MAD CDG MIA ATL IAH PTY BOG LIM EZE"],
    ["EZE","Buenos Aires","AR",-34.82,-58.54,-3,"MAD CDG FRA FCO IST MIA ATL JFK PTY BOG LIM SCL"],
    ["COR","Córdoba","AR",-31.32,-64.21,-3,"LIM PTY SCL"],
    ["MVD","Montevideo","UY",-34.84,-56.03,-3,"MAD MIA PTY LIM EZE"],
    ["ASU","Asunción","PY",-25.24,-57.52,-3,"MAD PTY EZE"],

    ["JNB","Johannesburg","ZA",-26.14,28.25,2,"LHR CDG AMS FRA IST DXB ADD ATL"],
    ["CPT","Cape Town","ZA",-33.97,18.60,2,"LHR CDG AMS FRA IST DXB ADD JNB ATL"],
    ["DUR","Durban","ZA",-29.61,31.12,2,"IST DXB JNB"],
    ["LOS","Lagos","NG",6.58,3.32,1,"LHR CDG AMS FRA IST DXB ADD CMN ATL"],
    ["ABV","Abuja","NG",9.01,7.26,1,"LHR CDG FRA IST ADD CMN"],
    ["ACC","Accra","GH",5.61,-0.17,0,"LHR AMS IST DXB ADD CMN LIS JFK"],
    ["ABJ","Abidjan","CI",5.26,-3.93,0,"CDG IST ADD CMN"],
    ["DSS","Dakar","SN",14.67,-17.07,0,"CDG MAD LIS IST ADD CMN"],
    ["RAI","Praia","CV",14.94,-23.48,-1,"LIS"],
    ["CMN","Casablanca","MA",33.37,-7.59,1,"LHR CDG AMS FRA MAD LIS IST DXB JFK MIA"],
    ["RAK","Marrakesh","MA",31.61,-8.04,1,"LHR CDG AMS MAD IST CMN"],
    ["ALG","Algiers","DZ",36.69,3.22,1,"CDG MAD LIS IST CMN"],
    ["TUN","Tunis","TN",36.85,10.23,1,"CDG FRA MAD IST CMN"],
    ["CAI","Cairo","EG",30.12,31.41,3,"LHR CDG AMS FRA MAD IST DXB ADD"],
    ["ADD","Addis Ababa","ET",8.98,38.80,3,"LHR CDG FRA IST DXB JNB"],
    ["NBO","Nairobi","KE",-1.32,36.93,3,"LHR CDG AMS IST DXB ADD JNB"],
    ["DAR","Dar es Salaam","TZ",-6.88,39.20,3,"AMS IST DXB ADD JNB"],
    ["EBB","Kampala","UG",0.04,32.44,3,"AMS IST DXB ADD"],
    ["KGL","Kigali","RW",-1.97,30.14,2,"AMS IST DXB ADD"],
    ["LAD","Luanda","AO",-8.86,13.23,1,"LIS IST ADD JNB CDG"],
    ["MPM","Maputo","MZ",-25.92,32.57,2,"LIS IST ADD JNB"],
    ["HRE","Harare","ZW",-17.93,31.09,2,"DXB ADD JNB"],
    ["LUN","Lusaka","ZM",-15.33,28.45,2,"LHR DXB ADD JNB"],
    ["WDH","Windhoek","NA",-22.48,17.47,2,"FRA ADD JNB"],
    ["DLA","Douala","CM",4.01,9.72,1,"CDG IST ADD CMN"],
    ["FIH","Kinshasa","CD",-4.39,15.44,1,"CDG IST ADD CMN"],

    ["DXB","Dubai","AE",25.25,55.36,4,"LHR CDG AMS FRA LIS MAD IST ADD JNB"],
    ["AUH","Abu Dhabi","AE",24.43,54.65,4,"LHR CDG AMS FRA IST"],
    ["DOH","Doha","QA",25.27,51.61,3,"LHR CDG AMS FRA IST"],
    ["RUH","Riyadh","SA",24.96,46.70,3,"LHR CDG FRA IST DXB ADD"],
    ["JED","Jeddah","SA",21.68,39.16,3,"LHR CDG FRA IST DXB ADD"],
    ["DMM","Dammam","SA",26.47,49.80,3,"IST DXB"],
    ["KWI","Kuwait City","KW",29.23,47.97,3,"LHR CDG FRA IST DXB"],
    ["BAH","Manama","BH",26.27,50.63,3,"LHR CDG FRA IST DXB"],
    ["MCT","Muscat","OM",23.59,58.28,4,"LHR FRA IST DXB"],
    ["AMM","Amman","JO",31.72,35.99,3,"LHR CDG AMS FRA MAD IST DXB"],
    ["BEY","Beirut","LB",33.82,35.49,3,"LHR CDG FRA IST DXB ADD"],
    ["TLV","Tel Aviv","IL",32.01,34.89,3,"LHR CDG AMS FRA LIS MAD IST DXB ADD JFK"],
    ["BGW","Baghdad","IQ",33.26,44.23,3,"IST DXB"],

    ["DEL","Delhi","IN",28.56,77.10,5.5,"LHR CDG AMS FRA IST DXB ADD JFK"],
    ["BOM","Mumbai","IN",19.09,72.87,5.5,"LHR CDG AMS FRA IST DXB ADD JNB"],
    ["BLR","Bengaluru","IN",13.20,77.71,5.5,"LHR CDG AMS FRA IST DXB ADD"],
    ["MAA","Chennai","IN",12.99,80.18,5.5,"LHR FRA DXB ADD"],
    ["HYD","Hyderabad","IN",17.24,78.43,5.5,"LHR FRA IST DXB"],
    ["CCU","Kolkata","IN",22.65,88.45,5.5,"DXB BOM DEL"],
    ["COK","Kochi","IN",10.15,76.40,5.5,"LHR DXB"],
    ["AMD","Ahmedabad","IN",23.07,72.63,5.5,"LHR DXB"],
    ["ATQ","Amritsar","IN",31.71,74.80,5.5,"DEL"],
    ["KHI","Karachi","PK",24.91,67.16,5,"IST DXB ADD"],
    ["LHE","Lahore","PK",31.52,74.40,5,"LHR IST DXB"],
    ["ISB","Islamabad","PK",33.55,72.83,5,"LHR IST DXB"],
    ["DAC","Dhaka","BD",23.84,90.40,6,"LHR IST DXB"],
    ["CMB","Colombo","LK",7.18,79.88,5.5,"LHR CDG IST DXB"],
    ["KTM","Kathmandu","NP",27.70,85.36,5.75,"IST DXB"],
    ["MLE","Malé","MV",4.19,73.53,5,"LHR CDG FRA IST DXB ADD"],
    ["TAS","Tashkent","UZ",41.26,69.28,5,"FRA IST DXB"],
    ["ALA","Almaty","KZ",43.35,77.04,5,"FRA IST DXB"],
    ["TBS","Tbilisi","GE",41.67,44.95,4,"IST DXB"],
    ["EVN","Yerevan","AM",40.15,44.40,4,"CDG IST DXB"],
    ["GYD","Baku","AZ",40.47,50.05,4,"LHR IST DXB"],
    ["PKX","Beijing","CN",39.51,116.41,8,"LHR CDG AMS FRA MAD IST DXB ADD"],
    ["PVG","Shanghai","CN",31.14,121.81,8,"LHR CDG AMS FRA MAD IST DXB ADD LAX"],
    ["CAN","Guangzhou","CN",23.39,113.30,8,"LHR CDG AMS FRA IST DXB ADD"],
    ["TFU","Chengdu","CN",30.31,104.44,8,"LHR CDG AMS FRA IST DXB ADD"],
    ["HKG","Hong Kong","HK",22.31,113.91,8,"LHR CDG AMS FRA MAD IST DXB ADD JNB LAX JFK"],
    ["TPE","Taipei","TW",25.08,121.23,8,"LHR CDG AMS FRA IST DXB LAX IAH"],
    ["HND","Tokyo","JP",35.55,139.78,9,"LHR CDG AMS FRA IST DXB JFK ATL IAH LAX"],
    ["NRT","Tokyo","JP",35.77,140.39,9,"CDG AMS DXB ADD LAX IAH MEX"],
    ["KIX","Osaka","JP",34.43,135.23,9,"CDG AMS IST DXB LAX"],
    ["ICN","Seoul","KR",37.46,126.44,9,"LHR CDG AMS FRA MAD IST DXB ADD JFK ATL IAH LAX"],
    ["SIN","Singapore","SG",1.36,103.99,8,"LHR CDG AMS FRA IST DXB ADD JNB LAX"],
    ["BKK","Bangkok","TH",13.69,100.75,7,"LHR CDG AMS FRA IST DXB ADD"],
    ["HKT","Phuket","TH",8.11,98.32,7,"FRA IST DXB"],
    ["KUL","Kuala Lumpur","MY",2.74,101.71,8,"LHR CDG AMS IST DXB"],
    ["CGK","Jakarta","ID",-6.13,106.66,7,"AMS IST DXB"],
    ["DPS","Denpasar","ID",-8.75,115.17,8,"AMS IST DXB"],
    ["HAN","Hanoi","VN",21.22,105.81,7,"LHR CDG FRA IST DXB"],
    ["SGN","Ho Chi Minh City","VN",10.82,106.65,7,"LHR CDG FRA IST DXB"],
    ["PNH","Phnom Penh","KH",11.55,104.84,7,"DXB BKK SIN"],
    ["MNL","Manila","PH",14.51,121.02,8,"LHR CDG AMS IST DXB LAX"],

    ["SYD","Sydney","AU",-33.95,151.18,10,"LHR DXB SCL JNB LAX"],
    ["MEL","Melbourne","AU",-37.67,144.84,10,"LHR DXB SCL LAX"],
    ["BNE","Brisbane","AU",-27.38,153.12,10,"DXB LAX"],
    ["PER","Perth","AU",-31.94,115.97,8,"LHR CDG DXB JNB"],
    ["ADL","Adelaide","AU",-34.95,138.53,9.5,"SYD MEL"],
    ["CBR","Canberra","AU",-35.31,149.19,10,"SYD MEL"],
    ["AKL","Auckland","NZ",-37.01,174.79,12,"DXB SCL LAX IAH JFK"],
    ["WLG","Wellington","NZ",-41.33,174.81,12,"AKL SYD"],
    ["CHC","Christchurch","NZ",-43.49,172.53,12,"AKL SYD"],
    ["NAN","Nadi","FJ",-17.76,177.44,12,"AKL SYD LAX"],

    ["GRU","São Paulo","BR",-23.43,-46.47,-3,""],
    ["VCP","Campinas","BR",-23.01,-47.13,-3,""],
    ["GIG","Rio de Janeiro","BR",-22.81,-43.25,-3,""],
    ["CNF","Belo Horizonte","BR",-19.63,-43.97,-3,""],
    ["BSB","Brasília","BR",-15.87,-47.92,-3,""],
    ["SSA","Salvador","BR",-12.91,-38.33,-3,""],
    ["REC","Recife","BR",-8.13,-34.92,-3,""],
    ["FOR","Fortaleza","BR",-3.78,-38.53,-3,""],
    ["POA","Porto Alegre","BR",-29.99,-51.17,-3,""],
    ["CWB","Curitiba","BR",-25.53,-49.17,-3,""],
    ["FLN","Florianópolis","BR",-27.67,-48.55,-3,""],
    ["IGU","Foz do Iguaçu","BR",-25.60,-54.49,-3,""],
    ["VIX","Vitória","BR",-20.26,-40.29,-3,""],
    ["GYN","Goiânia","BR",-16.63,-49.22,-3,""],
    ["CGB","Cuiabá","BR",-15.65,-56.12,-4,""],
    ["CGR","Campo Grande","BR",-20.47,-54.67,-4,""],
    ["NAT","Natal","BR",-5.77,-35.37,-3,""],
    ["JPA","João Pessoa","BR",-7.15,-34.95,-3,""],
    ["MCZ","Maceió","BR",-9.51,-35.79,-3,""],
    ["SLZ","São Luís","BR",-2.59,-44.23,-3,""],
    ["BEL","Belém","BR",-1.38,-48.48,-3,""],
    ["MAO","Manaus","BR",-3.04,-60.05,-4,""]
  ];

  /* Usual nonstop services into Brazil from abroad. */
  const intoBrazil = {
    GRU: "LIS OPO MAD BCN CDG LHR AMS FRA ZRH FCO MXP IST DOH DXB ADD JNB LAD CMN JFK EWR BOS IAD ATL MCO MIA IAH DFW ORD LAX YYZ MEX PTY BOG LIM SCL EZE COR MVD ASU VVI",
    GIG: "LIS MAD CDG LHR AMS FCO MIA ATL PTY BOG LIM SCL EZE MVD",
    BSB: "LIS PTY", CNF: "LIS PTY", SSA: "LIS MAD EZE", REC: "LIS EZE", FOR: "LIS", POA: "LIS PTY LIM SCL EZE"
  };

  /* Usual nonstop services within Brazil. */
  const domestic = {
    GRU: "GIG CNF BSB SSA REC FOR POA CWB FLN IGU VIX GYN CGB CGR NAT JPA MCZ SLZ BEL MAO",
    GIG: "CNF BSB SSA REC FOR POA CWB FLN IGU VIX NAT MCZ",
    BSB: "CNF SSA REC FOR POA CWB FLN VIX GYN CGB CGR NAT JPA MCZ SLZ BEL MAO",
    CNF: "SSA REC FOR POA CWB VIX GYN NAT",
    VCP: "GIG CNF BSB SSA REC FOR POA CWB",
    SSA: "REC FOR", REC: "FOR NAT", FOR: "NAT SLZ BEL", POA: "CWB FLN", CWB: "IGU"
  };

  /*
   * Airports that Qatar Airways serves as passenger destinations (flights to Doha), limited to
   * those in this table. Source: Wikipedia "List of Qatar Airways destinations", read 26 November 2026.
   * Not an airline-confirmed list.
   */
  const qatar = ("LHR LGW MAN BHX EDI DUB CDG NCE MAD BCN AGP LIS AMS BRU BER FRA MUC HAM DUS ZRH GVA VIE FCO MXP VCE " +
    "CPH ARN OSL HEL WAW PRG BUD OTP ATH BEG ZAG LCA IST ESB " +
    "YYZ YUL ATL BOS ORD DFW IAH LAX MIA JFK PHL SFO SEA IAD " +
    "GRU " +
    "ALG LAD ACC ABJ ADD CAI NBO LOS ABV CMN RAK MPM KGL DAR TUN EBB JNB CPT DUR LUN HRE FIH " +
    "BAH KWI BEY AMM MCT AUH DXB DMM JED RUH BGW EVN GYD TBS " +
    "PKX TFU CAN PVG HKG AMD ATQ BLR MAA DEL HYD COK CCU BOM KTM CMB DPS CGK KUL MLE MNL SIN ICN KIX HND NRT HAN SGN BKK HKT PNH TAS " +
    "ADL BNE CBR MEL PER SYD AKL").split(" ");

  const airports = {};
  rows.forEach(r => {
    const country = countries[r[2]];
    airports[r[0]] = { code: r[0], city: r[1], countryCode: r[2], country: country[0], region: country[2], lat: r[3], lon: r[4], tz: r[5] };
  });

  /* Build a two-way network. */
  const network = {};
  const connect = (a, b) => {
    (network[a] = network[a] || new Set()).add(b);
    (network[b] = network[b] || new Set()).add(a);
  };
  rows.forEach(r => r[6].split(" ").filter(Boolean).forEach(to => connect(r[0], to)));
  [intoBrazil, domestic].forEach(table =>
    Object.entries(table).forEach(([a, list]) => list.split(" ").forEach(b => connect(a, b))));
  qatar.forEach(code => { if (code !== "DOH") connect(code, "DOH"); });

  /* Home cities: one entry per city, listing all of its airports. */
  const homes = [];
  rows.forEach(r => {
    const a = airports[r[0]];
    const id = (a.city.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "-") + "-" + r[2].toLowerCase());
    const existing = homes.find(h => h.id === id);
    if (existing) existing.airports.push(a.code);
    else homes.push({ id, city: a.city, country: a.country, countryCode: a.countryCode, region: a.region, currency: country(r[2]), airports: [a.code] });
  });
  function country(code) { return countries[code][1]; }
  homes.sort((a, b) => a.city.localeCompare(b.city));

  WWC.countries = countries;
  WWC.airports = airports;
  WWC.network = network;
  WWC.homes = homes;
  WWC.qatarAirports = new Set(qatar);
})();
