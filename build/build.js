const pkg = require("../package.json");
const fs = require("fs-extra");
const path = require("path");
const { rollup } = require("rollup");
const commonjs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const { uglify } = require("rollup-plugin-uglify");
const ts = require("typescript");

// Configure any functions/properties used by the drawing tools and 
// exported by a dependency that rollup can't automatically detect.
const namedExports = {
};

// Parse the command line.
const args = require("yargs").options({
    "isNpmBuild": {
        describe: "Whether the build is for NPM.",
        type: "boolean"
    }
}).help().argv;

// Host for formating typescript diagnostics.
const formatDiagnosticHost = {
    getCanonicalFileName: path.normalize,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};

// Host for parsing the config file host.
const parseConfigFileHost = {
    useCaseSensitiveFileNames: false,
    fileExists: ts.sys.fileExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile,
    onUnRecoverableConfigFileDiagnostic: (diag) =>
        console.error(ts.formatDiagnostic(diag, formatDiagnosticHost))
};

// Define and immediately execute the main build function.
let rollupError = false;
(async function build() {
    // Cleanup the dist folder where the js packages will be output
    const distDirPath = "./dist";
    fs.emptyDirSync(distDirPath);

    // Get the major and minor version for the output folder name
    //const [majorVersion, minorVersion] = pkg.version.split(".");

    // File name and path for non-minified browser js
    const outFilePath = `${distDirPath}/azure-maps-animations.js`;
    const outMinFilePath = `${distDirPath}/azure-maps-animations.min.js`;

    const inputPath = "./js/index.js";

    // Ensure that all necessary output folders are created.
    await fs.ensureDir(path.dirname(outFilePath));
    await fs.ensureDir(path.dirname(outMinFilePath));
 
    // Parse the typescript config file.
    console.log("Parsing tsconfig.json");
    const tsConfig = ts.getParsedCommandLineOfConfigFile("./tsconfig.json", {}, parseConfigFileHost);
    if (tsConfig.errors.length > 0) {
        for (const error of tsConfig.errors) {
            console.error(ts.formatDiagnostic(error, formatDiagnosticHost));
        }

        process.exit(-1);
    }

    // Empty the directory for storing the compiled typescript.
    console.log("Clearing the typescript output folder");
    await fs.emptyDir(tsConfig.options.outDir);

    // Compile the typescript source.
    console.log("Compiling typescript to javascript");
    const tsProgram = ts.createProgram(tsConfig.fileNames, tsConfig.options);
    const tsResult = tsProgram.emit();
    const tsDiag = ts.getPreEmitDiagnostics(tsProgram).concat(tsResult.diagnostics);
    if (tsDiag.length > 0) {
        for (const error of tsDiag) {
            console.error(ts.formatDiagnostic(error, formatDiagnosticHost));
        }

        process.exit(-1);
    }

    // Read license.txt to define the banner for the packages.
    let banner = "/*\n";
    banner += (await fs.readFile("./license.md", "utf8")).trim();
    banner += "\n*/\n";

    let rollupInputOps, rollupOutputOps;
    if (!args.isNpmBuild) {
        // Set rollup options for browser builds.
        rollupInputOps = {
            external: ["azure-maps-control"],
            onwarn: rollupWarn,
            input: inputPath,
            plugins: [
                nodeResolve({
                    browser: true,
                    preferBuiltins: false
                }),
                commonjs({
                    namedExports: namedExports
                })
            ]
        };

        rollupOutputOps = {
            exports: "named",
            file: outFilePath,
            format: "iife",
            name: "atlas",
            extend: true,
            globals: {
                "azure-maps-control": "atlas"
            }
        };
    } else {
        rollupInputOps = {
            external: ["azure-maps-control"],
            onwarn: rollupWarn,
            input: inputPath,
            plugins: [
                nodeResolve(),
                commonjs({
                    namedExports: namedExports
                })
            ]
        };

        rollupOutputOps = {
            file: outFilePath,
            format: "cjs"
        };
    }

    // Rollup non-minified version.
    console.log("Bundling non-minified javascript package");
    await bundle(rollupInputOps, rollupOutputOps, banner);

    // Add uglify to the rollup input plugins.
    // Update the output file path for the minified version.
    rollupOutputOps.file = outMinFilePath;
    rollupInputOps.plugins.push(uglify());

    // Rollup minified version.
    console.log("Bundling minified javascript package");

    const minifiedLicense = "/* MIT License - Copyright (c) Microsoft Corporation. */\n\n"

    await bundle(rollupInputOps, rollupOutputOps, minifiedLicense);

    //Remove js folder.
    await fs.remove("./js");

    // Build is done!
    console.log(rollupError ? "Build failed" : "Build completed successfully!");
    process.exit(rollupError ? -1 : 0);
})()

async function bundle(inputOptions, outputOptions) {
    const bundle = await rollup(inputOptions);
    await bundle.write(outputOptions);
}

function rollupWarn(warning) {
    // Print the warning to the console.
    console.warn(warning.toString());

    // If the warning is about missing export provide more info.
    if (warning.code === "MISSING_EXPORT") {
        console.warn(
            `  if '${warning.missing}' is exported by '${warning.exporter}' then try adding\n` +
            `  "${warning.exporter}": [${warning.missing}] to namedExports in ${__filename}`
        );
    }
}

async function bundle(rollupInputOps, rollupOutputOps, banner) {
    try {
        const bundle = await rollup(rollupInputOps);
        const { output } = await bundle.generate(rollupOutputOps);

        const chunk = output.find((chunk) =>
            chunk.fileName === path.basename(rollupOutputOps.file)
        );

        await fs.writeFile(rollupOutputOps.file, banner + "\n" + chunk.code, "utf8");
    } catch (error) {
        throw new Error(`Failed to bundle the javascript package:\n${error.message}\n` +
            JSON.stringify(error, null, 2));
    }
}

function rollupWarn(warning) {
    // If the warning is about missing export provide more info.
    if (warning.code === "MISSING_EXPORT") {
        rollupError = true;
        console.error("ERROR: " + warning.toString() + "\n" +
            `  if '${warning.missing}' is exported by '${warning.exporter}' then try adding\n` +
            `  "${warning.exporter}": [${warning.missing}] to namedExports in ${__filename}`
        );
    } else {
        // Print the warning to the console.
        console.warn("WARNING: " + warning.toString());
    }
}