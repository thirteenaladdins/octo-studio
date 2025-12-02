#!/usr/bin/env node

const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");

/**
 * DSL Validator
 * Validates DSL JSON against the schema using Ajv
 */
class DSLValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    // Load the schema
    const schemaPath = path.join(__dirname, "schema.json");
    this.schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    this.validate = this.ajv.compile(this.schema);
  }

  /**
   * Validate DSL JSON against schema
   * @param {Object} dsl - DSL JSON object to validate
   * @returns {Object} Validation result with success flag and errors
   */
  validateDSL(dsl) {
    const valid = this.validate(dsl);

    if (valid) {
      return {
        success: true,
        errors: [],
      };
    }

    const errors = this.validate.errors.map((error) => {
      const path = error.instancePath || error.schemaPath;
      return {
        path: path,
        message: error.message,
        data: error.data,
        schema: error.schema,
      };
    });

    return {
      success: false,
      errors: errors,
    };
  }

  /**
   * Validate DSL from file
   * @param {string} filePath - Path to DSL JSON file
   * @returns {Object} Validation result
   */
  validateFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const dsl = JSON.parse(content);
      return this.validateDSL(dsl);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            path: "file",
            message: `Failed to parse file: ${error.message}`,
            data: null,
            schema: null,
          },
        ],
      };
    }
  }

  /**
   * Get human-readable error summary
   * @param {Array} errors - Array of validation errors
   * @returns {string} Formatted error message
   */
  getErrorSummary(errors) {
    if (errors.length === 0) return "No errors";

    return errors
      .map((error) => {
        const location = error.path ? ` at ${error.path}` : "";
        return `• ${error.message}${location}`;
      })
      .join("\n");
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node validator.js <dsl-file.json>");
    process.exit(1);
  }

  const filePath = args[0];
  const validator = new DSLValidator();
  const result = validator.validateFromFile(filePath);

  if (result.success) {
    console.log("✅ DSL validation passed");
  } else {
    console.error("❌ DSL validation failed:");
    console.error(validator.getErrorSummary(result.errors));
    process.exit(1);
  }
}

module.exports = DSLValidator;
