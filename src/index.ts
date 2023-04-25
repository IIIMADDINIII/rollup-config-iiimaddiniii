
import type { OutputOptions, RollupOptions } from "rollup";
import { getPlugins } from "./plugins.js";
import { readConfig } from "./readConfig.js";

const config = readConfig();

let exports = config.exports.map(mapExports);
if (config.testsExist) {
  exports.push({
    input: `./src/test/index.ts`,
    output: {
      file: `./test/index.mjs`,
      format: "esm",
      sourcemap: config.sourcemap,
    },
    plugins: getPlugins(config, true),
  });
}

// export all exports defined in package.json exports
export default exports;

// calculate the config for the export
function mapExports(name: string): RollupOptions {
  // transform exports name
  if (name.startsWith("./")) name = name.slice(2);
  if (name == ".") name = "index";
  let output: OutputOptions[] = [];
  if (config.type === "none") output.push({
    file: `./dist/cjs/${name}.js`,
    format: "commonjs",
    sourcemap: config.sourcemap,
  }, {
    file: `./dist/esm/${name}.js`,
    format: "esm",
    sourcemap: config.sourcemap,
  });
  // export commonjs when module is not module
  if (config.type === "commonjs") output.push({
    file: `./dist/${name}.js`,
    format: "commonjs",
    sourcemap: config.sourcemap,
  });
  // export esm when module is not commonjs
  if (config.type === "module") output.push({
    file: `./dist/${name}.js`,
    format: "esm",
    sourcemap: config.sourcemap,
  });
  // Config for export
  return {
    input: `./src/${name}.ts`,
    output,
    plugins: getPlugins(config),
  };
}
