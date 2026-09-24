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
  c = c.replace(/name: ([^,]+),/g, (m, p1) => {
    // Only replace if it doesn't already have an outletKey near it, or just blindly replace it if it's simpler
    return m + `\n    outletKey: 'OUTLET-' + Math.random().toString(36).substring(2, 10).toUpperCase(),`;
  });
  // Clean up duplicate outletKeys if multiple name fields were replaced in the same object
  // Actually, wait, replacing all `name: ...` is risky.
  // Better approach:
  c = c.replace(/name: '.*?',/g, (match) => {
    return match + `\n      outletKey: 'OUTLET-' + Math.random().toString(36).substring(2, 10).toUpperCase(),`;
  });
  c = c.replace(/name: ".*?",/g, (match) => {
    return match + `\n      outletKey: 'OUTLET-' + Math.random().toString(36).substring(2, 10).toUpperCase(),`;
  });
  c = c.replace(/name: `.*?`,/g, (match) => {
    return match + `\n      outletKey: 'OUTLET-' + Math.random().toString(36).substring(2, 10).toUpperCase(),`;
  });
  
  // also handle name: "Kasir", "Manager", etc which causes TS errors on memberships if we add outletKey.
  // Actually the TS errors were: Object literal may only specify known properties, and 'outletKey' does not exist in type 'ProductDef'.
  // This is because my previous regex added outletKey to EVERYTHING with a name!
  // I must revert and specifically target tenants.
  fs.writeFileSync(f, c);
});
