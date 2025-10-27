const path = require("path");

// Load JSON Schemas from schemas directory
const flowFieldSchema = require(path.join(
  __dirname,
  "../schemas/flowField.schema.json"
));
const gridPatternSchema = require(path.join(
  __dirname,
  "../schemas/gridPattern.schema.json"
));
const noiseWavesSchema = require(path.join(
  __dirname,
  "../schemas/noiseWaves.schema.json"
));
const orbitalMotionSchema = require(path.join(
  __dirname,
  "../schemas/orbitalMotion.schema.json"
));
const particleSystemSchema = require(path.join(
  __dirname,
  "../schemas/particleSystem.schema.json"
));

const TEMPLATE_TO_SCHEMA = {
  flowField: flowFieldSchema,
  gridPattern: gridPatternSchema,
  noiseWaves: noiseWavesSchema,
  orbitalMotion: orbitalMotionSchema,
  particleSystem: particleSystemSchema,
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
    }
  }

  return cfg;
}

module.exports = { generateRandomConfig };
