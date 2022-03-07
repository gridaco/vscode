/**
 * parse boolean value from env vars
 *
 * - true: "true" || "1" || "on" || "yes"
 * - false: "false" || "0" || "off" || "no"
 * @param v
 */
export function parseBoolean(v: string): boolean {
  if (v === "true" || v === "1" || v === "on" || v === "yes") {
    return true;
  }
  if (v === "false" || v === "0" || v === "off" || v === "no") {
    return false;
  }
  return undefined;
}

export const tsenv = {
  PREVIEW_FEATURE_INLINECOMPLETION: "true",
};
