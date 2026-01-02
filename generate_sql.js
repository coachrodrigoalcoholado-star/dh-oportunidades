const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'raw_clients_full.txt');
const outFile = path.join(__dirname, '../../brain/1ae1e8c5-d7c6-4a48-97ed-32c476c77d54/migration_bulk_import_full.sql');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split('\n');

    let values = [];
    let seenDnis = new Set();

    lines.forEach(line => {
        if (!line.trim()) return;

        const cleanLine = line.trim();
        const match = cleanLine.match(/^([0-9.,E+]+)\s+(.+)$/);

        if (match) {
            let dni = match[1].replace(/[.]/g, '');
            let name = match[2].trim().replace(/'/g, "''");

            if (dni.includes('E+')) return;
            if (dni.includes(',')) return;

            if (dni.length > 5 && dni.length < 12) {
                if (!seenDnis.has(dni)) {
                    seenDnis.add(dni);
                    values.push(`('${dni}', '${name}', 50000, 2000000)`);
                }
            }
        }
    });

    const sqlHeader = `-- Bulk Insert Full List
-- Defaults: Min = 50000, Max = 2000000
-- Generated automatically

INSERT INTO client_limits (dni, full_name, min_amount, max_amount) 
VALUES 
`;

    const sqlFooter = `
ON CONFLICT (dni) DO UPDATE 
SET full_name = EXCLUDED.full_name;
`;

    const fullSql = sqlHeader + values.join(',\n') + sqlFooter;

    fs.writeFileSync(outFile, fullSql);
    console.log(`Generated SQL for ${values.length} clients.`);

} catch (err) {
    console.error(err);
}
