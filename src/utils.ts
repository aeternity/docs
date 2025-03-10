import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";
import { formatFileContent } from "./formatters";

export const reposPath = "repos";
export const docsPath = "Developer Documentation";

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

export async function fetchLatestDocuments(repositories: Array<Repository>) {
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

  fs.copyFileSync("README.md", `${docsPath}/README.md`);

  console.log("Documents fetched and placed to the docs folder.");
}
