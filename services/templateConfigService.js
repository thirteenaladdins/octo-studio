const path = require("path");

// Load JSON Schemas defined for the web tuner and reuse them here
const gridPatternModularSchema = require(path.join(
  __dirname,
  "../src/art/templates/gridPatternModular.schema.json"
));
const noiseWavesSchema = require(path.join(
  __dirname,
  "../src/art/templates/noiseWaves.schema.json"
));

const TEMPLATE_TO_SCHEMA = {
  gridPattern: gridPatternModularSchema,
  simpleModular: gridPatternModularSchema, // Uses same schema as gridPattern
  noiseWaves: noiseWavesSchema,
};

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function uniform(rng, min, max) {
  return min + (max - min) * rng();
}

function buildDefaults(schema) {
  const out = {};
  const props = schema.properties || {};
  for (const key of Object.keys(props)) {
    const def = props[key].default;
    if (def !== undefined) out[key] = def;
  }
  return out;
}

function generateRandomConfig(template, seed) {
  const schema = TEMPLATE_TO_SCHEMA[template];
  if (!schema) return {};
  const rng = mulberry32(Number(seed) || Date.now());
  const cfg = buildDefaults(schema);
  const props = schema.properties || {};

  for (const [key, prop] of Object.entries(props)) {
    if (prop.type === "number") {
      const min = prop.minimum ?? 0;
      const max = prop.maximum ?? 1;
      cfg[key] = Number(uniform(rng, min, max).toFixed(3));
    } else if (prop.type === "integer") {
      const min = prop.minimum ?? 0;
      const max = prop.maximum ?? 10;
      cfg[key] = Math.floor(uniform(rng, min, max + 1));
    } else if (prop.enum) {
      cfg[key] = pickRandom(rng, prop.enum);
    } else if (prop.type === "array" && prop.items?.type === "string") {
      // Keep defaults if present; otherwise sample simple palette
      if (!Array.isArray(cfg[key]) || cfg[key].length === 0) {
        const count = Math.max(prop.minItems || 3, 3);
        const arr = [];
        for (let i = 0; i < count; i++) {
          const hue = Math.floor(uniform(rng, 0, 360));
          // simple HSL to hex approximation via random fixed palette if needed
          const hex = `#${(((1 << 24) * rng()) | 0)
            .toString(16)
            .padStart(6, "0")}`;
          arr.push(hex);
        }
        cfg[key] = arr;
      }
    } else if (prop.type === "string" && prop.pattern) {
      // For hex colors with pattern, keep default or generate random hex
      if (!cfg[key]) {
        cfg[key] = `#${(((1 << 24) * rng()) | 0)
          .toString(16)
          .padStart(6, "0")}`;
      }
    } else if (prop.type === "object" && prop.properties) {
      // Handle nested objects (e.g., modules)
      const nestedCfg = buildDefaults(prop);
      for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
        if (nestedProp.enum) {
          nestedCfg[nestedKey] = pickRandom(rng, nestedProp.enum);
        } else if (nestedProp.default !== undefined) {
          nestedCfg[nestedKey] = nestedProp.default;
        }
      }
      cfg[key] = nestedCfg;
    }
  }

  return cfg;
}

module.exports = { generateRandomConfig };
