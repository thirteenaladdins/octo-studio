#!/usr/bin/env node

const { z } = require("zod");
const templateRegistry = require("../src/templates/registry");

const TEMPLATE_KEYS = Object.keys(templateRegistry);
if (TEMPLATE_KEYS.length === 0) {
  throw new Error("Template registry is empty – cannot build concept schema.");
}

const TemplateEnum = z.enum([...TEMPLATE_KEYS]);

/**
 * Zod schema for validating AI-generated art concepts
 * Ensures all required fields are present and properly typed
 */
const ConceptSchema = z.object({
  title: z.string().min(1).max(80),
  template: TemplateEnum,
  description: z.string().min(10).max(200),
  mood: z.string().max(50),
  shapes: z.array(z.string()).min(1).max(5),
  colors: z
    .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .min(3)
    .max(8),
  movement: z.string().min(5).max(100),
  density: z.number().int().min(10).max(200),
  hashtags: z.array(z.string()).min(1).max(8),
});

/**
 * Extended schema that includes metadata for reproducibility
 */
const ConceptWithMetadataSchema = ConceptSchema.extend({
  seed: z.number().int().optional(),
  timestamp: z.string().datetime(),
  model: z.string(),
  promptTokens: z.number().int(),
  completionTokens: z.number().int(),
  totalTokens: z.number().int(),
});

function validateConcept(rawConcept) {
  try {
    return ConceptSchema.parse(rawConcept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Schema validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid concept schema");
    }
    throw error;
  }
}

function validateConceptWithMetadata(rawConcept) {
  try {
    return ConceptWithMetadataSchema.parse(rawConcept);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Metadata validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid concept metadata");
    }
    throw error;
  }
}

module.exports = {
  ConceptSchema,
  ConceptWithMetadataSchema,
  validateConcept,
  validateConceptWithMetadata,
};
