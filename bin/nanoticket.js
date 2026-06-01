#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const VERSION = packageJson.version;

const REQUIRED_SECTIONS = [
  "Objective",
  "Why",
  "Files Allowed",
  "Files Forbidden",
  "Diff Budget",
  "Allowed Actions",
  "Forbidden Actions",
  "Preflight",
  "Implementation Rules",
  "Verification",
  "Acceptance Criteria",
  "Rollback",
  "Completion Report"
];

function printHelp() {
  console.log(`NanoTicket v${VERSION}

Small, safe, verifiable task contracts for AI coding agents.

Usage:
  nanoticket init
  nanoticket new "Ticket title"
  nanoticket validate <ticket.md>
  nanoticket audit <ticket.md>
  nanoticket help

Commands:
  init       Create .nanoticket config/templates and nanotickets directory
  new        Create a new ticket from the standard template
  validate   Validate ticket format and parseable scope
  audit      Audit current git changes against a ticket
`);
}

function cwd(...parts) {
  return path.join(process.cwd(), ...parts);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFileIfMissing(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

function getOwnDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

function getRootDir() {
  return path.resolve(getOwnDir(), "..");
}

function init() {
  ensureDir(cwd(".nanoticket", "templates"));
  ensureDir(cwd("nanotickets"));

  const root = getRootDir();
  copyFileIfMissing(path.join(root, "templates", "constitution.md"), cwd(".nanoticket", "constitution.md"));
  copyFileIfMissing(path.join(root, "templates", "standard.md"), cwd(".nanoticket", "templates", "standard.md"));
  copyFileIfMissing(path.join(root, "templates", "config.json"), cwd(".nanoticket", "config.json"));

  console.log("Initialized NanoTicket:");
  console.log("  .nanoticket/config.json");
  console.log("  .nanoticket/constitution.md");
  console.log("  .nanoticket/templates/standard.md");
  console.log("  nanotickets/");
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "untitled-ticket";
}

function nextTicketNumber(dir) {
  ensureDir(dir);
  const nums = fs.readdirSync(dir)
    .map((f) => f.match(/^(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return String(next).padStart(3, "0");
}

function makeTicket(title) {
  const ticketDir = cwd("nanotickets");
  const templatePath = fs.existsSync(cwd(".nanoticket", "templates", "standard.md"))
    ? cwd(".nanoticket", "templates", "standard.md")
    : path.join(getRootDir(), "templates", "standard.md");

  const number = nextTicketNumber(ticketDir);
  const slug = slugify(title);
  const out = path.join(ticketDir, `${number}-${slug}.md`);
  const body = fs.readFileSync(templatePath, "utf8")
    .replaceAll("{{NUMBER}}", number)
    .replaceAll("{{TITLE}}", title);

  fs.writeFileSync(out, body);
  console.log(`Created ${path.relative(process.cwd(), out)}`);
}

function readTicket(ticketPath) {
  if (!ticketPath) fail("Missing ticket path.");
  const full = path.resolve(ticketPath);
  if (!fs.existsSync(full)) fail(`Ticket not found: ${ticketPath}`);
  return {
    path: full,
    text: fs.readFileSync(full, "utf8")
  };
}

function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {};
  let current = null;
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      current = match[1].trim();
      sections[current] = "";
    } else if (current) {
      sections[current] += line + "\n";
    }
  }
  return sections;
}

function parseBullets(sectionText = "") {
  return sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseDiffBudget(sectionText = "") {
  const target = sectionText.match(/Target:\s*(\d+)/i)?.[1];
  const soft = sectionText.match(/Soft overrun:\s*\+?(\d+)/i)?.[1];
  const hard = sectionText.match(/Hard max:\s*(\d+)/i)?.[1];

  return {
    target: target ? Number(target) : null,
    soft: soft ? Number(soft) : 0,
    hard: hard ? Number(hard) : null
  };
}

function validateTicket(ticketPath, quiet = false) {
  const ticket = readTicket(ticketPath);
  const sections = parseSections(ticket.text);
  const errors = [];
  const warnings = [];

  for (const name of REQUIRED_SECTIONS) {
    if (!sections[name]) errors.push(`Missing section: ${name}`);
  }

  const allowed = parseBullets(sections["Files Allowed"]);
  const forbidden = parseBullets(sections["Files Forbidden"]);
  const budget = parseDiffBudget(sections["Diff Budget"]);

  if (!allowed.length) errors.push("Files Allowed must include at least one bullet path.");
  if (!forbidden.length) warnings.push("Files Forbidden has no bullet paths.");
  if (!budget.target) errors.push("Diff Budget must include `Target: N changed lines`.");
  if (!budget.hard) errors.push("Diff Budget must include `Hard max: N changed lines`.");
  if (budget.target && budget.hard && budget.hard < budget.target) errors.push("Hard max cannot be lower than Target.");

  const acceptance = sections["Acceptance Criteria"] || "";
  if (!acceptance.includes("[ ]") && !acceptance.includes("[x]") && !acceptance.includes("[X]")) {
    warnings.push("Acceptance Criteria should include checkbox items.");
  }

  if (!quiet) {
    console.log(`NanoTicket Validate: ${path.relative(process.cwd(), ticket.path)}`);
    printIssues(errors, warnings);
    console.log(errors.length ? "Result: FAIL" : warnings.length ? "Result: PASS WITH WARNINGS" : "Result: PASS");
  }

  return { ticket, sections, errors, warnings, allowed, forbidden, budget };
}

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (err) {
    fail(`Git command failed: git ${args.join(" ")}\n${err.stderr?.toString() || err.message}`);
  }
}

function getChangedFiles(baseRef = "HEAD") {
  const names = new Set();

  const staged = git(["diff", "--cached", "--name-only", baseRef]);
  const unstaged = git(["diff", "--name-only"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);

  for (const blob of [staged, unstaged, untracked]) {
    for (const line of blob.split(/\r?\n/).filter(Boolean)) names.add(normalizePath(line));
  }

  return [...names];
}

function getDiffStats(baseRef = "HEAD") {
  const stats = new Map();

  // Staged + unstaged tracked changes.
  const numstat = [
    git(["diff", "--numstat", baseRef]),
    git(["diff", "--cached", "--numstat", baseRef])
  ].join("\n");

  for (const line of numstat.split(/\r?\n/).filter(Boolean)) {
    const [addsRaw, delsRaw, fileRaw] = line.split(/\t/);
    const file = normalizePath(fileRaw || "");
    const adds = Number(addsRaw) || 0;
    const dels = Number(delsRaw) || 0;
    if (!file) continue;
    const prior = stats.get(file) || { added: 0, deleted: 0 };
    prior.added += adds;
    prior.deleted += dels;
    stats.set(file, prior);
  }

  // Untracked files count as all added lines.
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .filter(Boolean);

  for (const fileRaw of untracked) {
    const file = normalizePath(fileRaw);
    let lines = 0;
    try {
      lines = fs.readFileSync(cwd(file), "utf8").split(/\r?\n/).length;
    } catch {
      lines = 1;
    }
    const prior = stats.get(file) || { added: 0, deleted: 0 };
    prior.added += lines;
    stats.set(file, prior);
  }

  return stats;
}

function normalizePath(p) {
  return p.replaceAll("\\", "/").replace(/^\.?\//, "");
}

function globToRegex(pattern) {
  const normalized = normalizePath(pattern);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("**", "__DOUBLE_STAR__")
    .replaceAll("*", "[^/]*")
    .replaceAll("__DOUBLE_STAR__", ".*");
  return new RegExp(`^${escaped}$`);
}

function matchesAny(file, patterns) {
  return patterns.some((p) => {
    const normalized = normalizePath(p);
    return file === normalized || globToRegex(normalized).test(file);
  });
}

function audit(ticketPath) {
  const validation = validateTicket(ticketPath, true);
  const { ticket, errors, warnings, allowed, forbidden, budget } = validation;

  if (errors.length) {
    console.log(`NanoTicket Audit: ${path.relative(process.cwd(), ticket.path)}`);
    printIssues(errors, warnings);
    console.log("Result: FAIL — ticket is invalid");
    process.exitCode = 1;
    return;
  }

  const changed = getChangedFiles();
  const stats = getDiffStats();
  const auditErrors = [];
  const auditWarnings = [...warnings];

  const outsideAllowed = changed.filter((file) => !matchesAny(file, allowed));
  const forbiddenTouched = changed.filter((file) => matchesAny(file, forbidden));
  const totalChangedLines = [...stats.values()].reduce((sum, s) => sum + s.added + s.deleted, 0);

  if (!changed.length) auditWarnings.push("No git changes detected to audit.");
  if (outsideAllowed.length) auditErrors.push(`Changed files outside Files Allowed: ${outsideAllowed.join(", ")}`);
  if (forbiddenTouched.length) auditErrors.push(`Forbidden files changed: ${forbiddenTouched.join(", ")}`);

  if (budget.hard !== null && totalChangedLines > budget.hard) {
    auditErrors.push(`Diff exceeds hard max: ${totalChangedLines} / ${budget.hard} changed lines`);
  } else if (budget.target !== null && totalChangedLines > budget.target) {
    const overrun = totalChangedLines - budget.target;
    if (overrun <= budget.soft) {
      auditWarnings.push(`Diff exceeds target but is within soft overrun: ${totalChangedLines} / ${budget.target} (+${overrun})`);
    } else {
      auditErrors.push(`Diff exceeds target + soft overrun: ${totalChangedLines} / ${budget.target + budget.soft} changed lines`);
    }
  }

  console.log(`NanoTicket Audit: ${path.relative(process.cwd(), ticket.path)}`);
  console.log("");
  console.log("Changed files:");
  if (changed.length) {
    for (const file of changed) {
      const s = stats.get(file) || { added: 0, deleted: 0 };
      console.log(`  ${file} (+${s.added}/-${s.deleted})`);
    }
  } else {
    console.log("  none");
  }

  console.log("");
  console.log("Budget:");
  console.log(`  Target: ${budget.target}`);
  console.log(`  Soft overrun: +${budget.soft}`);
  console.log(`  Hard max: ${budget.hard}`);
  console.log(`  Actual: ${totalChangedLines}`);

  console.log("");
  printIssues(auditErrors, auditWarnings);

  if (auditErrors.length) {
    console.log("Result: FAIL");
    process.exitCode = 1;
  } else if (auditWarnings.length) {
    console.log("Result: PASS WITH WARNINGS");
  } else {
    console.log("Result: PASS");
  }
}

function printIssues(errors, warnings) {
  if (errors.length) {
    console.log("Errors:");
    for (const e of errors) console.log(`  ✗ ${e}`);
  } else {
    console.log("Errors:");
    console.log("  none");
  }

  if (warnings.length) {
    console.log("Warnings:");
    for (const w of warnings) console.log(`  ! ${w}`);
  } else {
    console.log("Warnings:");
    console.log("  none");
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "init":
    init();
    break;
  case "new":
    if (!args.join(" ").trim()) fail('Usage: nanoticket new "Ticket title"');
    makeTicket(args.join(" ").trim());
    break;
  case "validate":
    validateTicket(args[0]);
    break;
  case "audit":
    audit(args[0]);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    printHelp();
    break;
  default:
    fail(`Unknown command: ${cmd}\nRun: nanoticket help`);
}
