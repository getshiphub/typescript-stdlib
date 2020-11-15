"use strict";

const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const rootDir = path.resolve(__dirname, "../");
const denoReleaseDir = path.join(rootDir, ".deno-release");
const repo = "git@github.com:getshiphub/ts-stdlib.git";
const branch = "deno-latest";

/**
 * @param {unknown} msg
 * @returns {never}
 */
function fail(msg) {
  console.error(msg);
  process.exit(1);
}

/**
 *
 * @param {string} cmd
 * @param {string[]} args
 */
function exec(cmd, args) {
  const result = cp.spawnSync(cmd, args);
  if (result.error != null) {
    console.error(`Failed to run: ${cmd} ${args.join(" ")}`);
    fail(result.error);
  }

  if (result.status !== 0) {
    console.error(`Running command failed: ${cmd} ${args.join(" ")}`);
    fail(result.stderr.toString());
  }
}

/** @param {string} version */
function prepare(version) {
  // Make sure version is a valid semver
  const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!regex.test(version)) {
    fail(`deno_release: prepare: Invalid version: "${version}", must be a valid semver`);
  }

  // Remove release dir if it already exists
  // TODO(@cszatmary): Could make this smarter in the future by just cleaning & pulling
  rimraf.sync(denoReleaseDir);
  exec("git", ["clone", repo, "-b", branch, "--single-branch", denoReleaseDir]);

  // Remove all so that we can copy the new ones and avoid any merge conflicts
  for (const f of fs.readdirSync(denoReleaseDir)) {
    // Don't remove .git (obviously)
    if (f === ".git") {
      continue;
    }

    rimraf.sync(path.join(denoReleaseDir, f));
  }

  // Copy misc files
  // TODO(@cszatmary): It would probably be a good idea to create a special readme
  // for the deno branch with specific details on what the branch is.
  const files = [".circleci", "LICENSE", "README.md"];
  for (const f of files) {
    const src = path.join(rootDir, f);
    const dst = path.join(denoReleaseDir, f);
    // Just shell to cp to make life easy, can make this better later
    exec("cp", ["-r", src, dst]);
  }

  // Copy build files
  const buildPath = path.join(rootDir, "dist/deno");
  for (const f of fs.readdirSync(buildPath)) {
    const src = path.join(buildPath, f);
    const dst = path.join(denoReleaseDir, f);
    exec("cp", ["-r", src, dst]);
  }

  // Commit
  process.chdir(denoReleaseDir);
  exec("git", ["add", "."]);
  exec("git", ["commit", "-m", "Update deno release"]);

  // Create tag for release
  const tag = `deno/${version}`;
  exec("git", ["tag", "--annotate", "--message", version, tag]);
}

function release() {
  process.chdir(denoReleaseDir);
  // --follow-tags is needed to make sure the tag is pushed as well
  exec("git", ["push", "--follow-tags", "origin", branch]);
}

// BEGIN SCRIPT //

const args = process.argv.slice(2);
if (args.length === 0) {
  fail("deno_release: action required as the first argument");
}
const action = args[0];

switch (action) {
  case "prepare": {
    const version = args[1];
    if (version == null) {
      fail("deno_release: release: version required as the second argument");
    }
    prepare(version);
    console.log("Prepared deno release");
    break;
  }
  case "release":
    release();
    console.log("Created deno release");
    break;
  default:
    fail(`Unknown action: ${action}`);
}
