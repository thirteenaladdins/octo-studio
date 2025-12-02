import Ajv from "ajv";

// Use Ajv without extra formats; our schemas use patterns/ranges only
const ajv = new Ajv({ useDefaults: true, allErrors: true, strict: false });

export function compileSchema(schema) {
  return ajv.compile(schema);
}

export function validateConfig(schema, candidate) {
  const validate = compileSchema(schema);
  const data = JSON.parse(JSON.stringify(candidate));
  const valid = validate(data);
  return { valid, data, errors: validate.errors || [] };
}

export function getDefaultConfig(schema) {
  // Build defaults by validating an empty object
  const result = validateConfig(schema, {});
  return result.data;
}
