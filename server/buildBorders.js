const fs = require('fs');
const path = require('path');

const csv = fs.readFileSync(path.join(__dirname, 'borders_raw.csv'), 'utf8');
const lines = csv.split('\n').slice(1);

const adjacency = {};

for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;
    // columns: 0=country_code,1=country_name,2=border_code,3=border_name
    const iso2a = parts[0].replace(/"/g, '').trim().toUpperCase();
    const iso2b = parts[2].replace(/"/g, '').trim().toUpperCase();
    if (!iso2a || !iso2b) continue;
    if (!adjacency[iso2a]) adjacency[iso2a] = [];
    if (!adjacency[iso2a].includes(iso2b)) adjacency[iso2a].push(iso2b);
}

fs.writeFileSync(
    path.join(__dirname, 'borders.json'),
    JSON.stringify(adjacency, null, 2)
);
console.log('borders.json written');