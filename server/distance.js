const countries = require('./countries.json');
const borders = require('./borders.json');

// alpha-3 to alpha-2
const ISO3_TO_ISO2 = {
  AFG:'AF', AGO:'AO', ALB:'AL', ARE:'AE', ARG:'AR', ARM:'AM', AUS:'AU', AUT:'AT',
  AZE:'AZ', BDI:'BI', BEL:'BE', BEN:'BJ', BFA:'BF', BGD:'BD', BGR:'BG', BHR:'BH',
  BIH:'BA', BLR:'BY', BLZ:'BZ', BOL:'BO', BRA:'BR', BRN:'BN', BTN:'BT', BWA:'BW',
  CAF:'CF', CAN:'CA', CHE:'CH', CHL:'CL', CHN:'CN', CIV:'CI', CMR:'CM', COD:'CD',
  COG:'CG', COL:'CO', COM:'KM', CPV:'CV', CRI:'CR', CUB:'CU', CYP:'CY', CZE:'CZ',
  DEU:'DE', DJI:'DJ', DMA:'DM', DNK:'DK', DOM:'DO', DZA:'DZ', ECU:'EC', EGY:'EG',
  ERI:'ER', ESP:'ES', EST:'EE', ETH:'ET', FIN:'FI', FJI:'FJ', FRA:'FR', GAB:'GA',
  GBR:'GB', GEO:'GE', GHA:'GH', GIN:'GN', GMB:'GM', GNB:'GW', GNQ:'GQ', GRC:'GR',
  GRL:'GL', GTM:'GT', GUY:'GY', HND:'HN', HRV:'HR', HTI:'HT', HUN:'HU', IDN:'ID',
  IND:'IN', IRL:'IE', IRN:'IR', IRQ:'IQ', ISL:'IS', ISR:'IL', ITA:'IT', JAM:'JM',
  JOR:'JO', JPN:'JP', KAZ:'KZ', KEN:'KE', KGZ:'KG', KHM:'KH', KOR:'KR', KWT:'KW',
  LAO:'LA', LBN:'LB', LBR:'LR', LBY:'LY', LCA:'LC', LKA:'LK', LSO:'LS', LTU:'LT',
  LUX:'LU', LVA:'LV', MAR:'MA', MDA:'MD', MDG:'MG', MDV:'MV', MEX:'MX', MKD:'MK',
  MLI:'ML', MLT:'MT', MMR:'MM', MNE:'ME', MNG:'MN', MOZ:'MZ', MRT:'MR', MUS:'MU',
  MWI:'MW', MYS:'MY', NAM:'NA', NCL:'NC', NER:'NE', NGA:'NG', NIC:'NI', NLD:'NL',
  NOR:'NO', NPL:'NP', NZL:'NZ', OMN:'OM', PAK:'PK', PAN:'PA', PER:'PE', PHL:'PH',
  PNG:'PG', POL:'PL', PRK:'KP', PRT:'PT', PRY:'PY', QAT:'QA', ROU:'RO', RUS:'RU',
  RWA:'RW', SAU:'SA', SDN:'SD', SEN:'SN', SLB:'SB', SLE:'SL', SLV:'SV', SOM:'SO',
  SRB:'RS', SSD:'SS', STP:'ST', SUR:'SR', SVK:'SK', SVN:'SI', SWE:'SE', SWZ:'SZ',
  SYC:'SC', SYR:'SY', TCD:'TD', TGO:'TG', THA:'TH', TJK:'TJ', TKM:'TM', TLS:'TL',
  TTO:'TT', TUN:'TN', TUR:'TR', TWN:'TW', TZA:'TZ', UGA:'UG', UKR:'UA', URY:'UY',
  USA:'US', UZB:'UZ', VCT:'VC', VEN:'VE', VNM:'VN', VUT:'VU', YEM:'YE', ZAF:'ZA',
  ZMB:'ZM', ZWE:'ZW',
};

function toRad(deg) { return deg * (Math.PI / 180); }

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function isAdjacent(isoA, isoB) {
    const a2 = ISO3_TO_ISO2[isoA];
    const b2 = ISO3_TO_ISO2[isoB];
    if (!a2 || !b2) return false;
    const neighbors = borders[a2] || [];
    return neighbors.includes(b2);
}

function getDistance(isoA, isoB) {
    const a = countries[isoA];
    const b = countries[isoB];
    if (!a || !b) return null;
    return Math.round(haversine(a.lat, a.lon, b.lat, b.lon));
}

function normalize(distanceKm) {
    return Math.max(0, 1 - distanceKm / 20000);
}

function getColor(normalized) {
    const stops = [
        { t: 0.00, r: 10,  g: 17,  b: 114 },
        { t: 0.25, r: 79,  g: 195, b: 247 },
        { t: 0.50, r: 255, g: 255, b: 255 },
        { t: 0.70, r: 255, g: 241, b: 118 },
        { t: 0.85, r: 255, g: 152, b: 0   },
        { t: 0.95, r: 244, g: 67,  b: 54  },
        { t: 1.00, r: 76,  g: 175, b: 80  },
    ];

    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (normalized >= stops[i].t && normalized <= stops[i+1].t) {
            lower = stops[i];
            upper = stops[i+1];
            break;
        }
    }

    const range = upper.t - lower.t;
    const factor = range === 0 ? 0 : (normalized - lower.t) / range;
    return `rgb(${Math.round(lower.r + factor*(upper.r-lower.r))},${Math.round(lower.g + factor*(upper.g-lower.g))},${Math.round(lower.b + factor*(upper.b-lower.b))})`;
}

function getDistanceInfo(guessIso, targetIso) {
    let distance = getDistance(guessIso, targetIso);
    if (distance === null) return null;
    const adjacent = isAdjacent(guessIso, targetIso);

    // Globle-style: bordering countries count as zero distance.
    if (adjacent) {
        distance = 0;
    }

    const norm = normalize(distance);
    // choose a color; correct (norm===1) will be green later, but we want
    // adjacent guesses to be extremely hot (red) rather than green.
    let color;
    if (adjacent && distance !== 0) {
        // this branch shouldn't happen since we forced distance=0 above,
        // but leave in case we change the strategy later
        color = 'rgb(244,67,54)'; // red
    } else if (adjacent && distance === 0) {
        // treat border guess as very hot but not green
        color = 'rgb(244,67,54)'; // red
    } else {
        color = getColor(norm);
    }

    return { distance, normalized: norm, color, adjacent };
}

module.exports = { getDistanceInfo, getColor, normalize };