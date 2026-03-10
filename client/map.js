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

    // zoom / pan state
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    function applyTransform() {
        if (svgDoc) {
            svgDoc.style.transform = `translate(${offsetX}px,${offsetY}px) scale(${scale})`;
        }
    }

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
    svgDoc.style.transformOrigin = '0 0';
    svgDoc.style.cursor = 'grab';

    // make paths clickable (iso2 -> iso3 lookup)
    const ISO2_TO_ISO3 = {};
    Object.entries(ISO3_TO_ISO2).forEach(([iso3, iso2]) => {
        ISO2_TO_ISO3[iso2.toUpperCase()] = iso3;
    });
    svgDoc.querySelectorAll('[id]').forEach(el => {
        const iso2 = el.id.toUpperCase();
        const iso3 = ISO2_TO_ISO3[iso2];
        if (!iso3) return;
        el.style.cursor = 'pointer';
        // hover feedback only — no click submission
    });

    // register interaction handlers on the container
    container.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // calculate what SVG point is under the cursor before zoom
        const svgX = (mouseX - offsetX) / scale;
        const svgY = (mouseY - offsetY) / scale;
        
        // update scale
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.max(0.5, Math.min(4, scale + delta));
        
        // recalculate offset so the same SVG point stays under the cursor
        offsetX = mouseX - svgX * newScale;
        offsetY = mouseY - svgY * newScale;
        scale = newScale;
        
        applyTransform();
    });
    // mouse events for desktop
    container.addEventListener('mousedown', e => {
        dragging = true;
        dragStartX = e.clientX - offsetX;
        dragStartY = e.clientY - offsetY;
        container.style.cursor = 'grabbing';
    });
    container.addEventListener('mousemove', e => {
        if (!dragging) return;
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        applyTransform();
    });
    container.addEventListener('mouseup', () => {
        dragging = false;
        container.style.cursor = 'grab';
    });
    container.addEventListener('mouseleave', () => {
        dragging = false;
        container.style.cursor = 'grab';
    });

    // touch events for mobile
    let lastTouchDistance = 0;
    container.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            // single finger = pan
            dragging = true;
            dragStartX = e.touches[0].clientX - offsetX;
            dragStartY = e.touches[0].clientY - offsetY;
        } else if (e.touches.length === 2) {
            // two fingers = pinch zoom
            dragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    });
    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && dragging) {
            // pan
            offsetX = e.touches[0].clientX - dragStartX;
            offsetY = e.touches[0].clientY - dragStartY;
            applyTransform();
        } else if (e.touches.length === 2) {
            // pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            const rect = container.getBoundingClientRect();
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            const svgX = (centerX - offsetX) / scale;
            const svgY = (centerY - offsetY) / scale;
            const zoomFactor = newDistance / (lastTouchDistance || newDistance);
            const newScale = Math.max(0.5, Math.min(4, scale * zoomFactor));
            offsetX = centerX - svgX * newScale;
            offsetY = centerY - svgY * newScale;
            scale = newScale;
            lastTouchDistance = newDistance;
            applyTransform();
        }
    });
    container.addEventListener('touchend', () => {
        dragging = false;
        lastTouchDistance = 0;
    });

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