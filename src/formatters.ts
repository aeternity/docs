import fs from "fs";

export function formatFileContent(file: string) {
  addGitHubCodeBlocks(file);
}

function addGitHubCodeBlocks(file: string) {
  let content = fs.readFileSync(file, "utf8");

  const ghBlobUrlRegex =
    /https:\/\/github\.com\/[A-Za-z]+\/([A-Za-z]+(-[A-Za-z]+)+)\/blob\/[A-Za-z0-9]+\/([A-Za-z]+(\/[A-Za-z]+)+)\.[A-Za-z]+#L[0-9]+-L[0-9]+/g;

  for (const match of content.matchAll(ghBlobUrlRegex)) {
    const url = match[0];
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
