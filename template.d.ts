/**
 * Template API Definition
 * Strict TypeScript interface for all generative art templates
 */

export type InputType = "number" | "int" | "boolean" | "string" | "color[]" | "enum";

export type TemplateInput = {
  key: string;                    // Parameter name (e.g., "palette", "speed", "density")
  type: InputType;               // Data type
  default?: any;                 // Default value
  min?: number;                  // Minimum value (for numbers)
  max?: number;                  // Maximum value (for numbers)
  step?: number;                 // Step size (for numbers)
  options?: string[];            // Valid options (for enum)
};

export type TemplateBudget = {
  maxDrawMs?: number;            // Target render budget in milliseconds
  maxParticles?: number;        // Maximum particle/element count
};

export type TemplateMeta = {
  id: string;                    // Unique identifier (e.g., "orbitals_v3")
  version: string;               // Semantic version (e.g., "1.0.0")
  description: string;           // Human-readable description
  inputs: TemplateInput[];       // Parameter definitions
  budget?: TemplateBudget;       // Performance constraints
};

export type TemplateRuntime = {
  /** 
   * Deterministic render entry point
   * @param p5 - p5.js instance
   * @param params - Runtime parameters matching meta.inputs
   * @param seed - Deterministic seed for reproducible results
   */
  render: (p5: any, params: Record<string, any>, seed: number) => void;
};

export type Template = {
  meta: TemplateMeta;
} & TemplateRuntime;

/**
 * Template export contract
 * Every template must export default tpl: Template
 */
declare const tpl: Template;
export default tpl;
