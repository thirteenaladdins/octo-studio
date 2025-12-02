#!/usr/bin/env node

/**
 * Export Template Tool
 * Converts a CommonJS template to ES Module format for easier importing
 */

const fs = require('fs');
const path = require('path');

function exportTemplate(templatePath, outputDir = null) {
  // Read the template
  const templateCode = fs.readFileSync(templatePath, 'utf8');
  const fileName = path.basename(templatePath, '.js');
  const dir = outputDir || path.dirname(templatePath);
  
  // Parse the template to extract meta and render
  // We'll use a simpler approach: extract the parts we need
  const lines = templateCode.split('\n');
  
  // Find where meta starts and ends
  let metaStart = -1;
  let metaEnd = -1;
  let tplStart = -1;
  let renderStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('const meta =')) {
      metaStart = i;
    }
    if (lines[i].trim() === '};' && metaStart >= 0 && metaEnd === -1) {
      metaEnd = i;
    }
    if (lines[i].trim().startsWith('const tpl =')) {
      tplStart = i;
    }
    if (lines[i].includes('render: (p, params, seed) =>')) {
      renderStart = i;
    }
  }
  
  // Extract the description from header comments
  let description = '';
  for (let i = 0; i < metaStart; i++) {
    if (lines[i].includes('*')) {
      const descMatch = lines[i].match(/\* (.+)/);
      if (descMatch && !descMatch[1].includes('Generated Template')) {
        description = descMatch[1].trim();
        break;
      }
    }
  }
  
  // Build ES Module version
  const header = `/**
 * Generated Template: ${fileName} (ES Module Version)
 * ${description || ''}
 * 
 * Usage:
 *   import template from './${fileName}.esm.js';
 *   // or
 *   import { meta, render } from './${fileName}.esm.js';
 */
`;
  
  // Export meta
  const metaSection = lines.slice(metaStart, metaEnd + 1).join('\n').replace('const meta =', 'export const meta =');
  
  // Extract render function
  let renderEnd = lines.length - 1;
  for (let i = renderStart + 1; i < lines.length; i++) {
    if (lines[i].trim() === '  }' && i > renderStart + 10) {
      renderEnd = i;
      break;
    }
  }
  
  const renderSection = lines.slice(renderStart, renderEnd + 1)
    .join('\n')
    .replace(/^\s*render: /m, 'export const render = ')
    .replace(/^const tpl = \{/m, '')
    .replace(/^\s*meta,$/m, '');
  
  // Clean up render section - remove any module.exports
  let cleanRender = renderSection.replace(/module\.exports.*$/gm, '');
  
  const esmCode = header + metaSection + '\n\n' + cleanRender + '\n\n' + 
    '// Default export\nconst template = { meta, render };\nexport default template;';
  
  // Write ES Module version
  const esmPath = path.join(dir, `${fileName}.esm.js`);
  fs.writeFileSync(esmPath, esmCode, 'utf8');
  
  console.log(`✅ Exported ES Module version: ${esmPath}`);
  
  // Also create a simple browser version (UMD-like)
  const browserCode = templateCode.replace(
    /module\.exports = tpl;/,
    `// Browser version - assigns to window
if (typeof window !== 'undefined') {
  window.OctoTemplate = tpl;
}

// Also support module.exports for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = tpl;
}`
  );
  
  const browserPath = path.join(dir, `${fileName}.browser.js`);
  fs.writeFileSync(browserPath, browserCode, 'utf8');
  
  console.log(`✅ Exported browser version: ${browserPath}`);
  
  return {
    esm: esmPath,
    browser: browserPath
  };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node export-template.js <template-file.js> [output-dir]');
    console.log('');
    console.log('Examples:');
    console.log('  node export-template.js templates/generated/my-template.js');
    console.log('  node export-template.js templates/generated/my-template.js ./exports');
    process.exit(1);
  }
  
  const templatePath = args[0];
  const outputDir = args[1] || null;
  
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }
  
  try {
    exportTemplate(templatePath, outputDir);
    console.log('\n✅ Export completed!');
  } catch (error) {
    console.error('❌ Error exporting template:', error.message);
    process.exit(1);
  }
}

module.exports = { exportTemplate };
