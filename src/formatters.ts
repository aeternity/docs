import fs from "fs";

export function formatFileContent(file: string) {
  addGitHubCodeBlocks(file);
}

function addGitHubCodeBlocks(file: string) {
  let content = fs.readFileSync(file, "utf8");

  const ghBlobUrlRegex =
    /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/g;

  for (const match of content.matchAll(ghBlobUrlRegex)) {
    const url = match[0];
    const isGitHubUrl = url.includes("github.com");
    const isBlobUrl = url.includes("blob");
    const hasLines = url.includes("#L");
    const hasDashLine = url.includes("-L");

    if (!isGitHubUrl || !isBlobUrl || !hasLines || !hasDashLine) continue;

    const codeBlockForUrl = `{% @github-files/github-code-block url="${url}" %}`;

    if (
      content.includes(codeBlockForUrl) ||
      content[content.indexOf(url) - 1] !== "\n" // checking if the url is used in a link
    )
      continue;

    content = content.replace(url, codeBlockForUrl);
  }

  fs.writeFileSync(file, content);
}
