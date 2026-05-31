import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resolveRepoRoot(): string {
  return process.env.REPO_ROOT ?? path.resolve(__dirname, "../../..");
}

export function resolveFromRepoRoot(...segments: string[]): string {
  return path.join(resolveRepoRoot(), ...segments);
}
