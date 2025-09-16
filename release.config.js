const plugins = [
  ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
  ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],
  "@semantic-release/changelog",
  [
    "@semantic-release/git",
    {
      assets: ["CHANGELOG.md"],
      message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}",
    },
  ],
  [
    "@semantic-release/github",
    {
      assets: [{ path: "dist/woodpecker-mcp", label: "MCP Server Binary" }],
    },
  ],
];

module.exports = { plugins };
