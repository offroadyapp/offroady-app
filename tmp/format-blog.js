const fs = require('fs');
const md = fs.readFileSync('C:\\Users\\Xvender24\\Downloads\\mount-cheam-fsr-first-offroady-trip-blog.md', 'utf8');

const parts = md.split('---');
const body = parts[2]?.trim() || '';

// Remove the first line (h1 title) since we use the metadata title
const lines = body.split('\n');
const bodyNoTitle = lines.filter((l, i) => !(i === 0 && l.startsWith('# '))).join('\n').trim();

// Remove the frontmatter note block at the end (Image upload note section)
const noteIdx = bodyNoTitle.lastIndexOf('<!--');
const bodyClean = noteIdx > 0 ? bodyNoTitle.substring(0, noteIdx).trim() : bodyNoTitle;

// Fix external link to use relative
const bodyFinal = bodyClean
  .replace(/https:\/\/www\.offroady\.app\//g, '/')
  .replace(/https:\/\/www\.offroady\.app/g, '');

console.log(bodyFinal);
fs.writeFileSync('C:\\offroady-app\\tmp\\mount-cheam-body.txt', bodyFinal, 'utf8');
console.log('\n--- BODY LENGTH:', bodyFinal.length, 'chars ---');
