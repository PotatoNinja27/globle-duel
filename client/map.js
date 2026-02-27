const ISO3_TO_ISO2 = {
  AFG:'af', AGO:'ao', ALB:'al', ARE:'ae', ARG:'ar', ARM:'am', AUS:'au', AUT:'at',
  AZE:'az', BDI:'bi', BEL:'be', BEN:'bj', BFA:'bf', BGD:'bd', BGR:'bg', BHR:'bh',
  BIH:'ba', BLR:'by', BLZ:'bz', BOL:'bo', BRA:'br', BRN:'bn', BTN:'bt', BWA:'bw',
  CAF:'cf', CAN:'ca', CHE:'ch', CHL:'cl', CHN:'cn', CIV:'ci', CMR:'cm', COD:'cd',
  COG:'cg', COL:'co', COM:'km', CPV:'cv', CRI:'cr', CUB:'cu', CYP:'cy', CZE:'cz',
  DEU:'de', DJI:'dj', DMA:'dm', DNK:'dk', DOM:'do', DZA:'dz', ECU:'ec', EGY:'eg',
  ERI:'er', ESP:'es', EST:'ee', ETH:'et', FIN:'fi', FJI:'fj', FRA:'fr', GAB:'ga',
  GBR:'gb', GEO:'ge', GHA:'gh', GIN:'gn', GMB:'gm', GNB:'gw', GNQ:'gq', GRC:'gr',
  GRL:'gl', GTM:'gt', GUY:'gy', HND:'hn', HRV:'hr', HTI:'ht', HUN:'hu', IDN:'id',
  IND:'in', IRL:'ie', IRN:'ir', IRQ:'iq', ISL:'is', ISR:'il', ITA:'it', JAM:'jm',
  JOR:'jo', JPN:'jp', KAZ:'kz', KEN:'ke', KGZ:'kg', KHM:'kh', KOR:'kr', KWT:'kw',
  LAO:'la', LBN:'lb', LBR:'lr', LBY:'ly', LCA:'lc', LKA:'lk', LSO:'ls', LTU:'lt',
  LUX:'lu', LVA:'lv', MAR:'ma', MDA:'md', MDG:'mg', MDV:'mv', MEX:'mx', MKD:'mk',
  MLI:'ml', MLT:'mt', MMR:'mm', MNE:'me', MNG:'mn', MOZ:'mz', MRT:'mr', MUS:'mu',
  MWI:'mw', MYS:'my', NAM:'na', NCL:'nc', NER:'ne', NGA:'ng', NIC:'ni', NLD:'nl',
  NOR:'no', NPL:'np', NZL:'nz', OMN:'om', PAK:'pk', PAN:'pa', PER:'pe', PHL:'ph',
  PNG:'pg', POL:'pl', PRK:'kp', PRT:'pt', PRY:'py', QAT:'qa', ROU:'ro', RUS:'ru',
  RWA:'rw', SAU:'sa', SDN:'sd', SEN:'sn', SLB:'sb', SLE:'sl', SLV:'sv', SOM:'so',
  SRB:'rs', SSD:'ss', STP:'st', SUR:'sr', SVK:'sk', SVN:'si', SWE:'se', SWZ:'sz',
  SYC:'sc', SYR:'sy', TCD:'td', TGO:'tg', THA:'th', TJK:'tj', TKM:'tm', TLS:'tl',
  TTO:'tt', TUN:'tn', TUR:'tr', TWN:'tw', TZA:'tz', UGA:'ug', UKR:'ua', URY:'uy',
  USA:'us', UZB:'uz', VCT:'vc', VEN:'ve', VNM:'vn', VUT:'vu', YEM:'ye', ZAF:'za',
  ZMB:'zm', ZWE:'zw',
};

const COUNTRY_LIST = [];
let svgDoc = null;

export function getCountryList() { return COUNTRY_LIST; }

export async function initMap() {
    const container = document.getElementById('globe-container');
    container.innerHTML = '';

    const [svgRes, countryRes] = await Promise.all([
        fetch('/world.svg'),
        fetch('/countries.json')
    ]);

    const svgText = await svgRes.text();
    container.innerHTML = svgText;
    svgDoc = container.querySelector('svg');
    svgDoc.setAttribute('viewBox', '30.767 241.591 784.077 458.627');
    svgDoc.style.width = '100%';
    svgDoc.style.height = '100%';

    const data = await countryRes.json();
    COUNTRY_LIST.length = 0;
    for (const [iso3, info] of Object.entries(data)) {
        COUNTRY_LIST.push({ iso: iso3, name: info.name });
    }
    COUNTRY_LIST.sort((a, b) => a.name.localeCompare(b.name));
}

export function colorCountry(iso3, color) {
    if (!svgDoc) return;
    const iso2 = ISO3_TO_ISO2[iso3];
    if (!iso2) return;
    const el = svgDoc.getElementById(iso2);
    if (!el) return;
    el.style.fill = color;
    el.querySelectorAll('path').forEach(p => p.style.fill = color);
}

export function resetMap() {
    if (!svgDoc) return;
    svgDoc.querySelectorAll('path').forEach(p => {
        p.style.fill = '';
        p.style.transition = '';
    });
}