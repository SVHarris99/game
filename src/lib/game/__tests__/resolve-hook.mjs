import { pathToFileURL } from "node:url";
import { resolve as pathResolve } from "node:path";
import { existsSync } from "node:fs";

const projectRoot = pathToFileURL(pathResolve(process.cwd()) + "/").href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const basePath = "src/" + specifier.slice(2);
    const baseUrl = new URL(basePath, projectRoot);
    // Try .ts, .tsx, .js, or as-is (JSON, etc.)
    const candidates = [baseUrl.href + ".ts", baseUrl.href + ".tsx", baseUrl.href + ".js", baseUrl.href];
    for (const candidate of candidates) {
      try {
        if (existsSync(new URL(candidate))) {
          return nextResolve(candidate, context);
        }
      } catch {
        // ignore
      }
    }
    return nextResolve(baseUrl.href, context);
  }
  return nextResolve(specifier, context);
}
