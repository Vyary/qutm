import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const { version } = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

const cargoPath = path.join(root, "src-tauri/Cargo.toml");
const cargo = fs.readFileSync(cargoPath, "utf8");

const re = /(\[package\][^[]*?^version\s*=\s*)"[^"]+"/ms;

if (!re.test(cargo)) {
  console.error("Could not find version in Cargo.toml [package]");
  process.exit(1);
}

fs.writeFileSync(cargoPath, cargo.replace(re, `$1"${version}"`));
console.log(`Synchronized Cargo.toml version: ${version}`);
