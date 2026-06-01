import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "nanoticket.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nanoticket-test-"));

function run(cmd, opts = {}) {
  return execFileSync(cmd[0], cmd.slice(1), {
    cwd: opts.cwd || tmp,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

run(["git", "init"]);
run(["git", "config", "user.email", "test@example.com"]);
run(["git", "config", "user.name", "NanoTicket Test"]);
fs.writeFileSync(path.join(tmp, "app.js"), "console.log('hello')\n");
run(["git", "add", "."]);
run(["git", "commit", "-m", "initial"]);

run(["node", bin, "init"]);
assert(fs.existsSync(path.join(tmp, ".nanoticket", "config.json")), "init should create config");

run(["node", bin, "new", "Touch app safely"]);
const ticket = fs.readdirSync(path.join(tmp, "nanotickets")).find((f) => f.endsWith(".md"));
const ticketPath = path.join("nanotickets", ticket);
let content = fs.readFileSync(path.join(tmp, ticketPath), "utf8");
content = content.replace("- path/to/file.ext", "- app.js");
fs.writeFileSync(path.join(tmp, ticketPath), content);

const validate = run(["node", bin, "validate", ticketPath]);
assert(validate.includes("Result: PASS"), "validate should pass");

// Intended workflow: initialize NanoTicket, create the ticket, commit/baseline it,
// then audit only the agent's implementation changes.
run(["git", "add", ".nanoticket", "nanotickets"]);
run(["git", "commit", "-m", "add nanoticket workflow"]);

fs.writeFileSync(path.join(tmp, "app.js"), "console.log('hello')\nconsole.log('safe')\n");
const audit = run(["node", bin, "audit", ticketPath]);
assert(audit.includes("Result: PASS"), "audit should pass");

console.log("All tests passed.");
