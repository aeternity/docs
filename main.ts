import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";

import configuration from "./app-config.json";

const reposPath = "repos";
const docsPath = "Developer Documentation";

interface Repository {
  name: string;
  url: string;
}

function createFolderIfNotExists(path: string) {
  fs.existsSync(path) || fs.mkdirSync(path, { recursive: true });
}

function checkIfRepositoryExists(name: string) {
  if (!fs.existsSync(`${reposPath}/${name}`)) return false;
  return simpleGit(`${reposPath}/${name}`).checkIsRepo();
}

function prepareFolders() {
  fs.rmSync(docsPath, { recursive: true, force: true });
  createFolderIfNotExists(reposPath);
  createFolderIfNotExists(docsPath);
}

async function fetchLatestDocuments(repositories: Array<Repository>) {
  prepareFolders();

  console.log("Fetching repositories documents...");
  await Promise.all(
    repositories.map(async (repository: Repository) => {
      const { name, url } = repository;

      if (checkIfRepositoryExists(name)) {
        await simpleGit(`${reposPath}/${name}`).pull();
      } else {
        await simpleGit(reposPath).clone(url, name);
      }

      findMarkdownFilesAndCopyToDocs(`${reposPath}/${name}`);
    })
  );

  console.log("Documents fetched successfully!");
}

function findMarkdownFilesAndCopyToDocs(dir: string) {
  const output: string[] = [];
  searchFiles(dir, ".md");

  function searchFiles(dir: string, fileName: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isDirectory()) {
        searchFiles(filePath, fileName);
      } else if (file.endsWith(fileName)) {
        output.push(filePath);
      }
    }
  }

  output.forEach((file) => {
    let destFileDivs = file.split("/");
    destFileDivs.splice(0, 1, docsPath);

    const destFile = destFileDivs.join("/");
    const destFolder = destFileDivs.slice(0, -1).join("/");

    createFolderIfNotExists(destFolder);
    fs.copyFileSync(file, destFile);
    formatFileContent(destFile);
  });
}

function formatFileContent(file: string) {
  let fileChanged = false;
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
    fileChanged = true;
  }

  if (fileChanged) fs.writeFileSync(file, content);
}

// Main function
await (async function () {
  if (!Bun.env.GH_ACCESS_TOKEN) {
    console.error("GitHub access token is required!");
    process.exit(1);
  }

  const appGit = simpleGit(process.cwd())
    .removeRemote("origin")
    .addRemote(
      "origin",
      `https://${Bun.env.GH_ACCESS_TOKEN}@github.com/aeternity/docs`
    )
    .fetch("origin")
    .pull("origin", "master");

  await fetchLatestDocuments(configuration.repositories);
  await appGit.add(docsPath).commit("Update docs").push("origin", "master");

  console.log("Docs synced successfully!");
})();
