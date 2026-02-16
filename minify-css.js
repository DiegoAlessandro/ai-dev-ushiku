#!/usr/bin/env node
/**
 * CSS Minifier for inline <style> blocks in HTML files.
 * No external dependencies required.
 *
 * - Removes CSS comments
 * - Removes unnecessary whitespace
 * - Preserves content inside quoted strings
 * - Preserves @media, @keyframes structures correctly
 * - Preserves calc() operator spacing
 * - Does NOT touch HTML or JavaScript
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku/public/index.html',
  '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku/public/demo/chatbot.html',
  '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku/public/demo/report.html',
  '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku/public/demo/sns.html',
  '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku/public/demo/branding.html',
];

/**
 * Extract all calc() expressions, replace with placeholders, return map.
 * Handles nested parentheses inside calc().
 */
function extractCalcExpressions(css) {
  const placeholders = [];
  let result = '';
  let i = 0;

  while (i < css.length) {
    // Look for "calc("
    if (css.substring(i, i + 5) === 'calc(') {
      // Find matching closing paren, accounting for nesting
      let depth = 0;
      let j = i + 4; // pointing at '('
      let calcStr = 'calc(';
      depth = 1;
      j++;
      while (j < css.length && depth > 0) {
        if (css[j] === '(') depth++;
        if (css[j] === ')') depth--;
        calcStr += css[j];
        j++;
      }
      // calcStr now has the full calc(...) including the closing )
      // Minify inside calc: collapse whitespace but preserve spaces around + and -
      let inner = calcStr.slice(5, -1); // content between calc( and )
      inner = inner.replace(/\s+/g, ' ').trim();

      const placeholder = `__CALC_${placeholders.length}__`;
      placeholders.push(`calc(${inner})`);
      result += placeholder;
      i = j;
    } else {
      result += css[i];
      i++;
    }
  }

  return { css: result, placeholders };
}

/**
 * Restore calc() expressions from placeholders.
 */
function restoreCalcExpressions(css, placeholders) {
  let result = css;
  for (let i = 0; i < placeholders.length; i++) {
    result = result.replace(`__CALC_${i}__`, placeholders[i]);
  }
  return result;
}

/**
 * Minify CSS string while preserving quoted string contents.
 *
 * Strategy:
 * 1. Remove comments
 * 2. Extract calc() expressions (to preserve operator spacing)
 * 3. Tokenize into "quoted strings" vs "CSS code"
 * 4. Minify only the CSS code tokens
 * 5. Restore calc() expressions
 */
function minifyCss(css) {
  // Step 1: Remove CSS comments (/* ... */)
  let noComments = '';
  let i = 0;
  while (i < css.length) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
    } else {
      noComments += css[i];
      i++;
    }
  }

  // Step 2: Extract calc() before any whitespace manipulation
  const { css: withoutCalc, placeholders } = extractCalcExpressions(noComments);

  // Step 3: Tokenize into quoted strings and non-string segments
  const tokens = [];
  i = 0;
  let current = '';

  while (i < withoutCalc.length) {
    const ch = withoutCalc[i];

    if (ch === '"' || ch === "'") {
      if (current) {
        tokens.push({ type: 'css', value: current });
        current = '';
      }
      let str = ch;
      i++;
      while (i < withoutCalc.length) {
        const c = withoutCalc[i];
        str += c;
        if (c === '\\') {
          i++;
          if (i < withoutCalc.length) {
            str += withoutCalc[i];
          }
        } else if (c === ch) {
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', value: str });
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  if (current) {
    tokens.push({ type: 'css', value: current });
  }

  // Step 4: Minify only the CSS tokens
  const minified = tokens.map((token) => {
    if (token.type === 'string') {
      return token.value;
    }

    let s = token.value;

    // Collapse all whitespace sequences into single space
    s = s.replace(/\s+/g, ' ');

    // Remove spaces around structural characters
    s = s.replace(/\s*\{\s*/g, '{');
    s = s.replace(/\s*\}\s*/g, '}');
    s = s.replace(/\s*;\s*/g, ';');
    s = s.replace(/\s*:\s*/g, ':');
    s = s.replace(/\s*,\s*/g, ',');
    s = s.replace(/\s*>\s*/g, '>');
    s = s.replace(/\s*~\s*/g, '~');
    s = s.replace(/\s*\+\s*/g, '+');
    s = s.replace(/\s*\(\s*/g, '(');
    s = s.replace(/\s*\)\s*/g, ')');

    // Remove trailing semicolons before closing braces
    s = s.replace(/;}/g, '}');

    // Restore required spaces for CSS at-rules
    // Use \s* to consume any existing space and replace with exactly one
    s = s.replace(/@media\s*\(/g, '@media (');
    s = s.replace(/@supports\s*\(/g, '@supports (');
    s = s.replace(/@keyframes\s*/g, '@keyframes ');
    s = s.replace(/@font-face\s*/g, '@font-face ');
    s = s.replace(/@import\s*/g, '@import ');
    s = s.replace(/@charset\s*/g, '@charset ');

    // Restore space before ( for logical operators in @media queries
    s = s.replace(/\band\s*\(/g, 'and (');
    s = s.replace(/\bor\s*\(/g, 'or (');
    s = s.replace(/\bnot\s*\(/g, 'not (');
    s = s.replace(/\bonly\s+/g, 'only ');

    // Restore space in selectors where needed:
    // e.g. ".class .child" should not become ".class.child"
    // This is already handled because the tokenizer preserves the space
    // in selector contexts since { } : ; etc are the delimiters

    return s;
  }).join('');

  // Step 5: Restore calc() expressions
  const result = restoreCalcExpressions(minified, placeholders);

  return result.trim();
}

/**
 * Process a single HTML file: find all <style> blocks, minify CSS inside them.
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.relative(
    '/Users/diegoalessandrobacigalupomontero/WebstormProjects/ai-dev-ushiku',
    filePath
  );

  const styleRegex = /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi;
  let totalOriginal = 0;
  let totalMinified = 0;
  let blockCount = 0;

  const newContent = content.replace(styleRegex, (match, openTag, css, closeTag) => {
    blockCount++;
    const originalSize = css.length;
    const minifiedCss = minifyCss(css);
    const minifiedSize = minifiedCss.length;

    totalOriginal += originalSize;
    totalMinified += minifiedSize;

    return openTag + minifiedCss + closeTag;
  });

  if (blockCount === 0) {
    console.log(`  [SKIP] ${fileName}: No <style> blocks found`);
    return;
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');

  const savings = totalOriginal - totalMinified;
  const percent = ((savings / totalOriginal) * 100).toFixed(1);

  console.log(`  ${fileName}`);
  console.log(`    Blocks: ${blockCount}`);
  console.log(`    CSS before: ${totalOriginal.toLocaleString()} bytes`);
  console.log(`    CSS after:  ${totalMinified.toLocaleString()} bytes`);
  console.log(`    Saved:      ${savings.toLocaleString()} bytes (${percent}%)`);
  console.log('');
}

// --- Main ---
console.log('CSS Minification Report');
console.log('=======================\n');

let allExist = true;
for (const f of FILES) {
  if (!fs.existsSync(f)) {
    console.error(`  ERROR: File not found: ${f}`);
    allExist = false;
  }
}

if (!allExist) {
  process.exit(1);
}

for (const f of FILES) {
  processFile(f);
}

console.log('Done. All files processed successfully.');
