import { build } from "vite";

try {
  await build();
  console.log("\nCI build validation passed.");
} catch (error) {
  console.error("\nCI build validation failed.");
  console.error(error);
  process.exitCode = 1;
}
