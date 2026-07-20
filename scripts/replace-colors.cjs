const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
};

const dirs = ['src/components', 'src/app/(authenticated)'];
let files = [];
dirs.forEach(d => {
  files = files.concat(walk(d));
});

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (content.includes('text-[#c1fbd4]')) {
    content = content.replace(/text-\[#c1fbd4\]/g, 'text-aloe-text');
    changed = true;
  }
  if (content.includes('text-[#d4f9e0]')) {
    content = content.replace(/text-\[#d4f9e0\]/g, 'text-pistachio-text');
    changed = true;
  }
  if (content.includes('bg-[#0a0a0a]')) {
    content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-card');
    changed = true;
  }
  if (content.includes('border-[#1e2c31]')) {
    content = content.replace(/border-\[#1e2c31\]/g, 'border-border');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});
