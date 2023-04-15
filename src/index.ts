
import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { consts } from 'rollup-plugin-consts';
import sourceMaps from 'rollup-plugin-include-sourcemaps';
import { manageDepsPlugin } from "./manageDepsPlugin.js";
import { readConfig } from "./readConfig.js";

const config = readConfig();

// list of all the plugins to use
let plugins = [
  manageDepsPlugin(config),
  consts({ production: config.production, development: !config.production }),
  json(),
  commonjs(),
  typescript({ noEmitOnError: true, outputToFilesystem: true, declaration: config.generateDeclaration, declarationMap: config.generateDeclaration }),
  sourceMaps(),
  nodeResolve(),
];
if (config.production) {
  plugins.push(terser({ format: { comments: false } }));
}

// export all exports defined in package.json exports
export default config.exports.map(mapExports);

// calculate the config for the export
function mapExports(name: string) {
  // transform exports name
  if (name.startsWith("./")) name = name.slice(2);
  if (name == ".") name = "index";
  let output = [];
  // export commonjs when module is not module
  if (config.type !== "module") output.push({
    file: `./dist/${name}.${config.type !== "commonjs" ? "c" : ""}js`,
    format: "commonjs",
    sourcemap: config.sourcemap,
  });
  // export esm when module is not commonjs
  if (config.type !== "commonjs") output.push({
    file: `./dist/${name}.${config.type !== "module" ? "m" : ""}js`,
    format: "esm",
    sourcemap: config.sourcemap,
  });
  // Config for export
  return {
    input: `./src/${name}.ts`,
    output,
    plugins
  };
}
