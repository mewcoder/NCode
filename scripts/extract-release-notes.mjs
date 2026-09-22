import { readFile } from "node:fs/promises";

const version = process.argv[2]?.trim();
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Usage: node scripts/extract-release-notes.mjs <version>`);
}

const changelog = await readFile("CHANGELOG.md", "utf8");
const lines = changelog.split(/\r?\n/u);
const versionPattern = new RegExp(`^## ${version.replaceAll(".", "\\.")}(?:\\s|$)`, "u");
const headingIndex = lines.findIndex((line) => versionPattern.test(line));
if (headingIndex < 0) {
  throw new Error(`CHANGELOG.md does not contain version ${version}`);
}

const nextHeadingIndex = lines.findIndex(
  (line, index) => index > headingIndex && /^## \S/u.test(line),
);
const section = lines
  .slice(headingIndex, nextHeadingIndex < 0 ? undefined : nextHeadingIndex)
  .join("\n")
  .trim();
const repository = process.env.GITHUB_REPOSITORY?.trim() || "mewcoder/NCode";
const changelogUrl = `https://github.com/${repository}/blob/v${version}/CHANGELOG.md`;

process.stdout.write(`${section}\n\n[查看完整变更记录](${changelogUrl})\n`);
