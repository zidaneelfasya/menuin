const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('apps/mobile/src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('SafeAreaView') && content.includes(`} from 'react-native'`)) {
    if (content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native['"]/)) {
      console.log('Fixing ' + file);
      content = content.replace(/import\s+{([^}]*)}?\s+from\s+['"]react-native['"]/g, (match, p1) => {
        if (p1.includes('SafeAreaView')) {
          const parts = p1.split(',').map(s => s.trim()).filter(s => s !== 'SafeAreaView' && s !== '');
          if (parts.length === 0) return '';
          return `import { ${parts.join(', ')} } from 'react-native'`;
        }
        return match;
      });
      if (!content.includes('react-native-safe-area-context')) {
         content = `import { SafeAreaView } from 'react-native-safe-area-context';\n` + content;
      }
      fs.writeFileSync(file, content);
    }
  }
});
