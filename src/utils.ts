import { statSync } from "fs";


export function fileExists(path: string) {
  try {
    statSync(path);
  }
  catch (err) {
    if (typeof err !== "object" || err === null) return true;
    if (!("code" in err) || typeof err.code !== "string") return true;
    return err.code !== "ENOENT";
  }
  return true;
}