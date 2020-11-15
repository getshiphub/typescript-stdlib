"use strict";

const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const ts = require("typescript");

/**
 * @param {string} msg
 * @returns {never}
 */
function fail(msg) {
  console.error(msg);
  process.exit(1);
}

/** @enum {number} */
// eslint-disable-next-line @typescript-eslint/naming-convention
const Action = {
  compile: 0,
  transform: 1,
};

// Types

/**
 * @typedef {Object} Entrypoint
 * @property {string} name
 * @property {boolean} includeExtension
 */

/**
 * @typedef {Object} TargetConfig
 * @property {string} action
 * @property {boolean=} requiresRuntime
 * @property {Entrypoint=} entrypoint
 * @property {string[]=} deleteImports
 * @property {Record<string, string>=} replace
 * @property {string=} tsconfigPath
 */

/**
 * @typedef {Object} Config
 * @property {Record<string, TargetConfig>} targets
 * @property {string[]} global
 * @property {Record<string, string>} modules
 */

/**
 * @typedef {Object} Target
 * @property {string} name
 * @property {Action} action
 * @property {boolean} requiresRuntime
 * @property {Entrypoint=} entrypoint
 * @property {string[]} deleteImports
 * @property {Map<string, string>} replace
 * @property {string[]} globals
 * @property {string[]} modules
 * @property {string=} tsconfigPath
 */

/**
 * @param {string} rootDir
 * @param {string} targetName
 * @returns {Target}
 */
function parseConfig(rootDir, targetName) {
  const data = fs.readFileSync(path.join(rootDir, "targets.json"), { encoding: "utf-8" });
  /** @type {Config} */
  const config = JSON.parse(data);
  const targetConfig = config.targets[targetName];
  if (targetConfig === undefined) {
    fail(`No such target: ${targetName}`);
  }

  /** @type {Action} */
  let action;
  switch (targetConfig.action) {
    case "compile":
      action = Action.compile;
      break;
    case "transform":
      action = Action.transform;
      break;
    default:
      fail(`Unrecognized action: "${targetConfig.action}"`);
  }

  /** @type {string[]} */
  const modules = [];
  for (const [m, t] of Object.entries(config.modules)) {
    // Make sure module is supported by target
    if (t === "*" || t.includes(targetName)) {
      modules.push(m);
    }
  }

  /** @type {Map<string, string>} */
  const replace = new Map();
  for (const [k, v] of Object.entries(targetConfig.replace ?? {})) {
    replace.set(k, v);
  }

  /** @type {string | undefined} */
  let tsconfigPath;
  if (targetConfig.tsconfigPath !== undefined) {
    tsconfigPath = path.resolve(rootDir, targetConfig.tsconfigPath);
  }

  return {
    name: targetName,
    action,
    requiresRuntime: targetConfig.requiresRuntime ?? false,
    entrypoint: targetConfig.entrypoint,
    deleteImports: targetConfig.deleteImports ?? [],
    replace,
    globals: config.global,
    modules,
    tsconfigPath,
  };
}

class Source {
  /**
   * @param {string} file
   * @param {string=} module
   */
  constructor(file, module) {
    this.file = file;
    this.module = module;
  }

  /** @param {string} root */
  path(root) {
    return path.join(root, this.module ?? "", this.file);
  }

  toString() {
    if (this.module === undefined) {
      return this.file;
    }
    return `${this.module}/${this.file}`;
  }
}

// BEGIN SCRIPT //

const args = process.argv.slice(2);
if (args.length === 0) {
  fail("target name required as the first argument");
}

const targetName = args[0];
const rootDir = path.resolve(__dirname, "../");
const srcDir = path.join(rootDir, "src");
const dstDir = path.join(rootDir, "dist", targetName);
const runtimeDir = path.join(srcDir, "_runtime");
const target = parseConfig(rootDir, targetName);

/** @type {Source[]} */
const srcs = [];

for (const g of target.globals) {
  srcs.push(new Source(g));
}

for (const m of target.modules) {
  // Module is a dir, need to get all files
  const files = fs.readdirSync(path.join(srcDir, m));
  for (const f of files) {
    srcs.push(new Source(f, m));
  }
}

/** @type {ts.TransformerFactory<ts.SourceFile>} */
const transformer = (context) => {
  return (sourceFile) => {
    /** @type {(node: ts.Node) => ts.Node | undefined} */
    const visitor = (node) => {
      // Add .ts extension to imports
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier == null || !ts.isStringLiteral(node.moduleSpecifier)) {
          return node;
        }

        const module = node.moduleSpecifier.text;

        // Check if any matching imports to delete
        for (const im of target.deleteImports) {
          if (module.includes(im)) {
            return undefined;
          }
        }

        return context.factory.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          context.factory.createStringLiteral(`${module}.ts`, false),
        );
      }

      // Add .ts extension to re-exports
      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier == null || !ts.isStringLiteral(node.moduleSpecifier)) {
          return node;
        }

        const module = node.moduleSpecifier.text;
        return context.factory.updateExportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          false,
          node.exportClause,
          context.factory.createStringLiteral(`${module}.ts`, false),
        );
      }

      if (ts.isIdentifier(node)) {
        const replaceName = target.replace.get(node.text);
        if (replaceName !== undefined) {
          return context.factory.createIdentifier(replaceName);
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
};

// Delete any old files
rimraf.sync(dstDir);
fs.mkdirSync(dstDir, { recursive: true });

const header = "// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY\n";

// Generate target files
if (target.action === Action.compile) {
  const tscArgs = ["--outDir", dstDir];
  if (target.tsconfigPath !== undefined) {
    tscArgs.push("-p", target.tsconfigPath);
  }
  const result = cp.spawnSync("tsc", tscArgs, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Failed to compile ${target.name} target`);
    if (result.error != null) {
      console.error(result.error);
    }
    process.exit(1);
  }
} else {
  const program = ts.createProgram([path.join(srcDir, "index.ts")], {});
  const printer = ts.createPrinter();

  for (const s of srcs) {
    const source = program.getSourceFile(s.path(srcDir));
    if (source === undefined) {
      fail(`Could not find source file ${s}`);
    }

    const result = ts.transform(source, [transformer]);

    const dstPath = s.path(dstDir);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    const contents = `${header}\n${printer.printFile(result.transformed[0])}`;
    fs.writeFileSync(dstPath, contents);
  }
}

// Create entrypoint if needed
if (target.entrypoint !== undefined) {
  const lines = [header];
  let extension = "";
  if (target.entrypoint.includeExtension) {
    extension = ".ts";
  }

  for (const g of target.globals) {
    lines.push(`export * from "./${path.basename(g, ".ts")}${extension}"`);
  }

  for (const m of target.modules) {
    lines.push(`export * as ${m} from "./${m}/mod${extension}"`);
  }

  // Add trailing newline
  lines.push("");

  const filename = path.join(dstDir, target.entrypoint.name);
  fs.writeFileSync(filename, lines.join("\n"));
}

// Create runtime if required
if (target.requiresRuntime) {
  const dstRuntimeDir = path.join(dstDir, "_runtime");
  fs.mkdirSync(dstRuntimeDir, { recursive: true });

  /** @type {string[]} */
  const declarationFiles = [];
  // _target.ts suffix stripped
  /** @type {string[]} */
  const runtimeFiles = [];
  for (const f of fs.readdirSync(runtimeDir)) {
    if (f.endsWith(".d.ts")) {
      declarationFiles.push(path.basename(f));
    }

    // Runtime file names are of the form *_target.ts
    const parts = path.basename(f, ".ts").split("_");
    if (parts.pop() === target.name) {
      runtimeFiles.push(parts.join("_"));
    }
  }

  // If compile we need to copy all .d.ts files and remove any existing ones
  if (target.action === Action.compile) {
    for (const f of fs.readdirSync(dstRuntimeDir)) {
      const srcPath = path.join(dstRuntimeDir, f);
      if (f.endsWith(".d.ts")) {
        // Remove *_target.d.ts
        fs.unlinkSync(srcPath);
        continue;
      }

      // Remove _target suffix from file name
      const parts = path.basename(f, ".js").split("_");
      if (parts.pop() === target.name) {
        const fileName = `${parts.join("_")}.js`;
        fs.renameSync(srcPath, path.join(dstRuntimeDir, fileName));
      }
    }

    for (const df of declarationFiles) {
      const dstPath = path.join(dstRuntimeDir, df);
      fs.copyFileSync(path.join(runtimeDir, df), dstPath);
    }
  } else {
    for (const rf of runtimeFiles) {
      const srcPath = path.join(runtimeDir, `${rf}_${target.name}.ts`);
      // If transform we just need to copy the TS file as is
      const dstPath = path.join(dstRuntimeDir, `${rf}.ts`);
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}
