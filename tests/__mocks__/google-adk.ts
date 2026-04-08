// Test-only stub for @google/adk to bypass its 18 transitive peer-dep imports
// (telemetry exporters, mikro-orm drivers, gcs, etc.) which are not actually
// used by the LlmAgent symbol our code consumes. The real adk is bundled by
// tsup at build time and the runtime in prod has these peers installed via
// npm install (without --legacy-peer-deps).
//
// The stub mirrors the LlmAgent constructor shape we depend on: it spreads
// the config so callers can read `.name`, `.model`, `.instruction`, `.tools`
// directly from the returned instance (matches real ADK behavior).

export class LlmAgent {
  public name?: string;
  public model?: string;
  public instruction?: string;
  public description?: string;
  public tools?: unknown[];
  constructor(config: Record<string, unknown> = {}) {
    Object.assign(this, config);
  }
}
