export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [2, "never", ["pascal-case", "upper-case", "start-case"]],
    "header-max-length": [2, "always", 100],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "refactor", "test", "docs", "ci", "build", "perf", "revert"]
    ]
  }
};
