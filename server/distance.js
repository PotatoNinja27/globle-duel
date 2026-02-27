const countries = require('./countries.json');

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
    return deg * (Math.PI / 180);
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

    // Find surrounding stops
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (normalized >= stops[i].t && normalized <= stops[i + 1].t) {
            lower = stops[i];
            upper = stops[i + 1];
            break;
        }
    }

    const range = upper.t - lower.t;
    const factor = range === 0 ? 0 : (normalized - lower.t) / range;

    const r = Math.round(lower.r + factor * (upper.r - lower.r));
    const g = Math.round(lower.g + factor * (upper.g - lower.g));
    const b = Math.round(lower.b + factor * (upper.b - lower.b));

    return `rgb(${r},${g},${b})`;
}

function getDistanceInfo(guessIso, targetIso) {
    const distance = getDistance(guessIso, targetIso);
    if (distance === null) return null;
    const norm = normalize(distance);
    const color = getColor(norm);
    return { distance, normalized: norm, color };
}

module.exports = { getDistanceInfo, getColor, normalize };