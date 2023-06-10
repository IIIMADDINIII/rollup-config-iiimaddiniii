
import { normalizePath } from "@rollup/pluginutils";
import { access } from "fs/promises";
import type { Plugin } from "rollup";
import type { Config } from "./readConfig.js";

// Plugin for checking devDependencies and mark dependencies as external
class ManageDependencies extends Error { }

export function manageDepsPlugin(config: Config): Plugin {
  // Calculate external packages
  const externalPackages = [...config.externalPackages];
  if (!config.packageDependencies) {
    externalPackages.push(...config.dependencies);
  }

  // returns true, if the import String is part of a Package
  function matchesPackage(imported: string, packages: string[]): false | null {
    for (let dependency of packages) {
      if (imported === dependency) return false;
      if (imported.startsWith(dependency + "/")) return false;
    }
    return null;
  }

  // returns the path of the related package.json of a file
  async function findPackage(importer: string): Promise<string | null> {
    let importerPath = importer.split("/").slice(0, -1);
    let path = importerPath.join("/");
    if (!importer.startsWith(path)) return null;
    let file;
    while (importerPath.length >= 1) {
      file = path + "/package.json";
      try {
        await access(file);
        return file;
      } catch { }
      importerPath = importerPath.slice(0, -1);
      path = importerPath.join("/");
    }
    return null;
  }

  // Throw on illegal modules and mark es external
  return {
    name: 'manage-dependencies',
    async resolveId(imported, importer, _options) {
      if (importer === undefined) return null;
      if (/\0/.test(imported)) return null;
      if (await findPackage(normalizePath(importer)) !== config.path) return matchesPackage(imported, externalPackages);
      if (matchesPackage(imported, config.devDependencies) !== null) {
        if (config.packageDependencies) {
          console.warn(`Dependency ${imported} is a devDependency and is imported which can lead to errors (${importer})`);
        } else {
          throw new ManageDependencies(`Dependency ${imported} is a devDependency and is not allowed to be imported (${importer})`);
        }
      };
      if (matchesPackage(imported, externalPackages) !== null) return false;
      return null;
    }
  };
};