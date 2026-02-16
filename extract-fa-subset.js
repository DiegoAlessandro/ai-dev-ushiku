const fs = require('fs');
const css = fs.readFileSync('/tmp/fa-full.css', 'utf8');

// Icons we need (class name -> we need to find .fa-XXXX::before or :before)
const neededIcons = [
  'arrow-left', 'arrow-right', 'bars', 'briefcase', 'building',
  'check-circle', 'circle-check', 'circle-exclamation', 'circle-question',
  'clipboard-list', 'code', 'comment-dots', 'comments', 'copy',
  'external-link-alt', 'feather-pointed', 'file-lines', 'file-pen',
  'flask', 'hard-hat', 'hashtag', 'instagram', 'lightbulb', 'lock',
  'map-marker-alt', 'microchip', 'microphone-lines', 'paper-plane',
  'pen-nib', 'pencil', 'phone-volume', 'play', 'robot', 'sparkles',
  'spinner', 'store', 'times', 'tooth', 'user', 'user-slash',
  'utensils', 'wand-magic-sparkles', 'wine-bottle'
];

// Unminify just enough to extract rules
// Font Awesome minified CSS uses patterns like .fa-XXXX:before{content:"\fXXX"}

const results = [];
for (const icon of neededIcons) {
  // Match patterns like .fa-icon-name::before{content:"\fXXX"} or :before
  const regex = new RegExp(`\\.fa-${icon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?::before|::before)\\{content:"([^"]+)"\\}`, 'g');
  const match = regex.exec(css);
  if (match) {
    results.push({ icon, content: match[1] });
  } else {
    // Try alternate pattern (FA6 uses comma-separated selectors)
    const regex2 = new RegExp(`\\.fa-${icon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*:before\\{content:"([^"]+)"\\}`, 'g');
    const match2 = regex2.exec(css);
    if (match2) {
      results.push({ icon, content: match2[1] });
    } else {
      results.push({ icon, content: null });
    }
  }
}

console.log("Found icons:");
results.forEach(r => {
  console.log(`  .fa-${r.icon}::before { content: "${r.content || 'NOT FOUND'}"; }`);
});

const notFound = results.filter(r => !r.content);
if (notFound.length > 0) {
  console.log("\nNot found:", notFound.map(r => r.icon).join(', '));
}
