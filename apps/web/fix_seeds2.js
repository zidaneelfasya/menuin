const fs = require('fs');

const files = [
  'src/lib/db/seed-realistic.ts',
  'src/lib/db/seed-stress.ts',
  'src/lib/db/seed-tenants.ts',
  'src/lib/db/seed.ts'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/name: tenantData\.name,/g, "name: tenantData.name,\n          outletKey: 'OUTLET-' + Math.random().toString(36).substring(2, 10).toUpperCase(),");
  
  // also check for other instances like name: 'Something' but only inside db.insert(schema.tenants)
  // Let's just do a blanket regex:
  // db.insert(schema.tenants).values({ name: ...
  fs.writeFileSync(f, c);
});
