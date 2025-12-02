#!/usr/bin/env node

/**
 * Generate Templates Manifest
 * Scans templates/generated/ directory and creates a manifest file
 * for automatic template discovery in the viewer
 */

const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../templates/generated');

function generateManifest() {
  const manifest = [];
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }
  
  // Find all .meta.json files
  const files = fs.readdirSync(templatesDir);
  const metaFiles = files.filter(f => f.endsWith('.meta.json'));
  
  console.log(`📋 Found ${metaFiles.length} template metadata files`);
  
  for (const metaFile of metaFiles) {
    const metaPath = path.join(templatesDir, metaFile);
    const baseName = metaFile.replace('.meta.json', '');
    const templatePath = `templates/generated/${baseName}.js`;
    
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      
      manifest.push({
        path: templatePath,
        name: meta.dsl?.id || baseName,
        description: meta.dsl?.description || 'No description',
        timestamp: meta.timestamp || meta.dsl?.timestamp || new Date().toISOString()
      });
      
      console.log(`  ✓ ${meta.dsl?.id || baseName}`);
    } catch (e) {
      console.warn(`  ⚠ Could not read ${metaFile}: ${e.message}`);
    }
  }
  
  // Sort by timestamp (newest first)
  manifest.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Save manifest
  const manifestPath = path.join(templatesDir, 'templates-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  
  console.log(`\n✅ Manifest generated: ${manifestPath}`);
  console.log(`   ${manifest.length} templates registered`);
  
  return manifest;
}

if (require.main === module) {
  generateManifest();
}

module.exports = { generateManifest };

