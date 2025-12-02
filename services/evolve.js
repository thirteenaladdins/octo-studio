#!/usr/bin/env node

/**
 * Evolution Script
 * Runs the evolutionary loop: Mutate -> Render -> Evaluate -> Select
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const ScreenshotService = require("./services/screenshotService");
const OpenAIService = require("./services/openaiService");
const { createRandomGenome, mutateGenome, generateRandomPalette } = require("./evolution/genetics");
const { evaluateFitness } = require("./evolution/fitness");

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is missing from environment variables.");
    process.exit(1);
  }

  const screenshotService = new ScreenshotService();
  const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);

  // Configuration
  const GENERATIONS = 100; // Or infinite loop
  const MUTATION_RATE = 0.3;
  const OUTPUT_DIR = path.join(__dirname, "../evolution_output");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("🧬 Starting Evolution Loop...");
  console.log(`   Target: Maximize artistic fitness score (0-100)`);

  // 1. Initialize Parent
  // Start with a completely random genome
  let parent = {
    modules: createRandomGenome(),
    seed: Math.floor(Math.random() * 1000000),
    palette: generateRandomPalette(),
    fitness: 0,
    id: "gen_0_init"
  };

  // Initial evaluation of the parent (optional, but good for baseline)
  console.log("\n--- Initializing Parent ---");
  await processIndividual(parent, screenshotService, openaiService);
  console.log(`   Parent Fitness: ${parent.fitness} (${parent.reason})`);

  let generation = 1;
  let bestIndividual = parent;

  while (generation <= GENERATIONS) {
    console.log(`\n--- Generation ${generation} ---`);

    // 2. Create Offspring (Mutation)
    const offspringModules = mutateGenome(parent.modules, MUTATION_RATE);
    
    // Sometimes mutate palette too
    const offspringPalette = Math.random() < 0.3 
        ? generateRandomPalette() 
        : parent.palette;
        
    // Sometimes new seed (major change), sometimes keep seed (tweak)
    const offspringSeed = Math.random() < 0.5 
        ? Math.floor(Math.random() * 1000000) 
        : parent.seed;

    const offspring = {
      modules: offspringModules,
      seed: offspringSeed,
      palette: offspringPalette,
      fitness: 0,
      id: `gen_${generation}`
    };

    // 3. Process Offspring (Render & Evaluate)
    await processIndividual(offspring, screenshotService, openaiService);
    console.log(`   Offspring Score: ${offspring.fitness} (${offspring.reason})`);

    // 4. Selection
    // If offspring is better (or equal, to encourage drift), it becomes the new parent
    if (offspring.fitness >= parent.fitness) {
      console.log("🚀 Improved! Offspring becomes new Parent.");
      parent = offspring;
      
      // Check global best
      if (parent.fitness > bestIndividual.fitness) {
          bestIndividual = parent;
          console.log("🏆 New All-Time Best!");
          
          // Save the winner to a special folder or file
          saveBest(bestIndividual, OUTPUT_DIR);
      }
    } else {
      console.log("💀 Rejected. Keeping Parent.");
      // Optional: Simulated Annealing could go here (accept worse solutions with decaying probability)
    }

    generation++;
  }
}

/**
 * Render and evaluate a single individual
 */
async function processIndividual(individual, screenshotService, openaiService) {
  const config = {
    modules: individual.modules,
    seed: individual.seed,
    palette: individual.palette,
    gridSize: 20,
    speed: 0.01,
    shape: 'circle',
    background: '#001f3f',
    // Add other standard config params if needed
  };

  try {
    // Capture using UniversalModular template
    const imageBuffer = await screenshotService.captureFromConfig(
      "universalModular", 
      config, 
      `temp_${individual.id}`
    );

    // 2. Evaluate
    const evaluation = await evaluateFitness(imageBuffer, openaiService);
    individual.fitness = evaluation.score;
    individual.reason = evaluation.reason;
    individual.imagePath = `temp_${individual.id}.png`; // Just metadata
    
  } catch (err) {
    console.error("Error processing individual:", err);
    individual.fitness = 0;
    individual.reason = "Error during processing";
  }
}

function saveBest(individual, outputDir) {
    const filename = `best_${individual.id}_score_${individual.fitness}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(individual, null, 2));
    console.log(`   Saved best config to ${filepath}`);
}

main();

