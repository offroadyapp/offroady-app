const fs = require('fs');

// Read the new body
const newBody = fs.readFileSync('C:\\offroady-app\\tmp\\mount-cheam-body.txt', 'utf8');

// Read the current posts.ts
let c = fs.readFileSync('C:\\offroady-app\\content\\blog\\posts.ts', 'utf8');

// Find the mount-cheam blog entry and its body
const idx = c.indexOf('mount-cheam-fsr-first-offroady-trip-2026-05-03');
const bodyKey = c.indexOf('body: ', idx);

// Find the backtick (char code 96)
let bt1 = -1;
for (let x = bodyKey + 6; x < c.length; x++) {
  if (c.charCodeAt(x) === 96) {
    bt1 = x;
    break;
  }
}

// Find the closing backtick
let bt2 = -1;
for (let x = bt1 + 1; x < c.length; x++) {
  if (c.charCodeAt(x) === 96) {
    bt2 = x;
    break;
  }
}

console.log('body key at:', bodyKey);
console.log('backtick open at:', bt1);
console.log('backtick close at:', bt2);
console.log('Old body length:', bt2 - bt1 - 1);

// Replace the old body content (between the backticks) with new body
// Keep the backtick delimiters
const result = c.substring(0, bt1 + 1) + '\n' + newBody + '\n' + c.substring(bt2);

fs.writeFileSync('C:\\offroady-app\\content\\blog\\posts.ts', result, 'utf8');
console.log('Done! New file written.');
console.log('New body in the file context around:', result.substring(bt1, bt1 + 100));
