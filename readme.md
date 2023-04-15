Rollup Config
=============
Configuration through the package.json file in the current directory.
If the environment variable prod == true the package is compiled/bundled for production.

Currently the following fields are read from the package.json:
* type: if missing both types will be emitted
* exports.*: used to create the bundles ("." => index.js/ts)
* dependencies.*: to declare them external when needed
* devDependencies.*: to make sure no dev dependencies are imported
* rollup:
  * doNotGenerateDeclarationInProduction: bool = it is descriptive
  * packageDependencies: bool = package dependencies
  * inlineSourceMaps: bool = if sourceMaps should be inline
  * externalPackages: string[] = a list of additional packages wich should not be bundled