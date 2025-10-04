/**
 * @type {import("prettier").Config}
 */
export const config = {
  semi: false,
  tabWidth: 4,
  printWidth: 130,
  trailingComma: "es5",
  overrides: [
    {
      files: ["*.json", "*.md", "*.mdx", "*.yaml", "*.yml"],
      options: {
        tabWidth: 2,
      },
    },
  ],
};
