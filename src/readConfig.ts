
import { normalizePath } from "@rollup/pluginutils";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface Config {
  type: "commonjs" | "module" | "none";
  doNotGenerateDeclarationInProduction: boolean;
  packageDependencies: boolean;
  inlineSourceMaps: boolean;
  production: boolean;
  generateDeclaration: boolean;
  sourcemap: boolean | "inline";
  path: string;
  externalPackages: string[];
  exports: string[];
  dependencies: string[];
  devDependencies: string[];
}

export function getDefaultConfig(): Config {
  return {
    type: "none",
    doNotGenerateDeclarationInProduction: false,
    packageDependencies: false,
    inlineSourceMaps: false,
    production: false,
    generateDeclaration: true,
    sourcemap: true,
    path: "",
    externalPackages: [],
    exports: ["."],
    dependencies: [],
    devDependencies: [],
  };
};

export function readConfig(): Config {
  let packageConfig: Config = getDefaultConfig();
  readEnvironment(packageConfig);
  readPackageJson(packageConfig);
  computedOptions(packageConfig);
  return packageConfig;
}

function readEnvironment(packageConfig: Config) {
  packageConfig.path = normalizePath(resolve("./package.json"));
  if (process.env["prod"]?.trim() === "true") {
    packageConfig.production = true;
  }
}

function readPackageJson(packageConfig: Config): void {
  let packageJson = getPackageJson();
  if ((typeof packageJson !== "object") || (packageJson === null)) throw new Error("package.json does not contain an object");
  readPackageType(packageConfig, packageJson);
  readPackageExports(packageConfig, packageJson);
  readPackageDeps(packageConfig, packageJson);
  readPackageDevDeps(packageConfig, packageJson);
  readPackageRollup(packageConfig, packageJson);
}

function computedOptions(packageConfig: Config) {
  packageConfig.generateDeclaration = !(packageConfig.production && packageConfig.doNotGenerateDeclarationInProduction);
  packageConfig.sourcemap = packageConfig.production ? false : packageConfig.inlineSourceMaps ? "inline" : true;
}

function readPackageType(packageConfig: Config, packageJson: object): void {
  if (!("type" in packageJson) || (typeof (packageJson.type) !== "string")) return;
  if (packageJson.type.toLowerCase() === "module") { packageConfig.type = "module"; }
  else if (packageJson.type.toLowerCase() === "commonjs") { packageConfig.type = "commonjs"; }
  else { throw new Error("Package.json type parameter is not commonjs or module"); }
}

function readPackageExports(packageConfig: Config, packageJson: object): void {
  if (!("exports" in packageJson) || (typeof packageJson.exports !== "object") || (packageJson.exports === null)) return;
  packageConfig.exports = Object.entries(packageJson.exports)
    .filter(([_key, value]) => {
      let keys = Object.keys(value);
      return keys.length > 1 || !keys.includes("types");
    })
    .map(([key, _value]) => key);
}

function readPackageDeps(packageConfig: Config, packageJson: object): void {
  if (!("dependencies" in packageJson) || (typeof packageJson.dependencies !== "object") || (packageJson.dependencies === null)) return;
  packageConfig.dependencies = Object.keys(packageJson.dependencies);
}

function readPackageDevDeps(packageConfig: Config, packageJson: object): void {
  if (!("devDependencies" in packageJson) || (typeof packageJson.devDependencies !== "object") || (packageJson.devDependencies === null)) return;
  packageConfig.devDependencies = Object.keys(packageJson.devDependencies);
}

function readPackageRollup(packageConfig: Config, packageJson: object): void {
  if (!("rollup" in packageJson) || (typeof packageJson.rollup !== "object") || (packageJson.rollup === null)) return;
  let rollup = packageJson.rollup;
  readRollupEmitDecl(packageConfig, rollup);
  readRollupPackageDeps(packageConfig, rollup);
  readRollupSourceMaps(packageConfig, rollup);
  readRollupExtPackages(packageConfig, rollup);
}

function readRollupEmitDecl(packageConfig: Config, rollup: object): void {
  if (!("doNotGenerateDeclarationInProduction" in rollup)) return;
  if (typeof rollup.doNotGenerateDeclarationInProduction !== "boolean") throw new Error("rollup.doNotGenerateDeclarationInProduction in Package.json needs to be boolean");
  packageConfig.doNotGenerateDeclarationInProduction = rollup.doNotGenerateDeclarationInProduction;
}

function readRollupPackageDeps(packageConfig: Config, rollup: object): void {
  if (!("packageDependencies" in rollup)) return;
  if (typeof rollup.packageDependencies !== "boolean") throw new Error("rollup.packageDependencies in Package.json needs to be boolean");
  packageConfig.packageDependencies = rollup.packageDependencies;
}

function readRollupSourceMaps(packageConfig: Config, rollup: object): void {
  if (!("inlineSourceMaps" in rollup)) return;
  if (typeof rollup.inlineSourceMaps !== "boolean") throw new Error("rollup.inlineSourceMaps in Package.json needs to be boolean");
  packageConfig.sourcemap = rollup.inlineSourceMaps;
}

function readRollupExtPackages(packageConfig: Config, rollup: object): void {
  if (!("externalPackages" in rollup)) return;
  if ((typeof rollup.externalPackages !== "object") || !isArray(rollup.externalPackages) || !rollup.externalPackages.every((v): v is string => typeof v === "string")) throw new Error("rollup.externalPackages in Package.json needs to be a string array");
  packageConfig.externalPackages = rollup.externalPackages;
}

function getPackageJson(): unknown {
  let data;
  try {
    data = readFileSync("./package.json", { encoding: "utf-8" });
  } catch (e) {
    throw new Error("package.json is not readable");
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error("package.json does not contain valid JSON data");
  }
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}