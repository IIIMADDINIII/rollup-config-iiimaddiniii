import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import type { Plugin } from "rollup";
import { consts } from 'rollup-plugin-consts';
import sourceMaps from 'rollup-plugin-include-sourcemaps';
import { manageDepsPlugin } from "./manageDepsPlugin.js";
import type { Config } from "./readConfig.js";

export function getPlugins(config: Config, discardDeclarations: boolean = false): Plugin[] {
  const generateDeclaration = config.generateDeclaration && !discardDeclarations;
  let plugins = [
    manageDepsPlugin(config),
    consts({ production: config.production, development: !config.production }),
    json(),
    commonjs(),
    typescript({ noEmitOnError: true, outputToFilesystem: true, declaration: generateDeclaration, declarationMap: generateDeclaration }),
    sourceMaps(),
    nodeResolve(),
  ];
  if (config.production) {
    plugins.push(terser({ format: { comments: false } }));
  }
  return plugins;
}