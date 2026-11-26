// Checks the repository's files: nothing private is committed and nothing referred to is missing.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const readable = /\.(js|mjs|json|md|html|css|ps1|svg|yml|yaml|txt)$|(^|\/)\.[a-z]+(ignore|attributes)$/i;

const secrets = [
  ["a GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/],
  ["an AWS access key", /AKIA[0-9A-Z]{16}/],
  ["a secret API key", /\bsk-[A-Za-z0-9_-]{32,}/],
  ["a private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["a path from someone's computer", /[A-Za-z]:\\Users\\[^\\\s"'<>]+/]
];
const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Addresses that identify no person.
const allowedEmail = /^noreply@|@users\.noreply\.github\.com$|@example\.(com|org)$/i;

const problems = [];

for (const file of files) {
  if (/(^|\/)\.env(\.|$)/.test(file)) problems.push(`${file}: environment files must not be committed`);
  if (!readable.test(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const [what, pattern] of secrets) {
    if (pattern.test(content)) problems.push(`${file}: looks like it contains ${what}`);
  }
  // The address itself isn't printed, because these logs are public.
  if ((content.match(email) || []).some(address => !allowedEmail.test(address))) {
    problems.push(`${file}: contains an email address`);
  }
}

// Local files named by the pages and the brand settings. Names are case sensitive on the web.
const referenced = new Set();
for (const page of files.filter(f => /^[^/]+\.html$/.test(f))) {
  for (const [, path] of readFileSync(page, "utf8").matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|png|svg|jpg))"/g)) {
    if (!/^(https?:|data:)/.test(path)) referenced.add(path);
  }
}
for (const [, path] of readFileSync("js/brand.js", "utf8").matchAll(/"(brand\/[^"]+)"/g)) referenced.add(path);

for (const path of referenced) {
  if (!existsSync(path) || !files.includes(path)) problems.push(`${path}: referred to but not in the repository`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Checked ${files.length} files and ${referenced.size} references. No problems.`);
