import fs from "fs";
import path from "path";
import { simpleGit } from "simple-git";
import configuration from "./configuration.json";

const reposPath = "repos";
const docsPath = "docs";

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

async function syncRepositoryDocuments(repositories: Array<Repository>) {
  createFolderIfNotExists(reposPath);
  createFolderIfNotExists(docsPath);

  await Promise.all(
    repositories.map(async (repository: Repository) => {
      const { name, url } = repository;

      if (checkIfRepositoryExists(name)) {
        console.log(`Repository ${name} already exists, pulling changes...`);
        await simpleGit(`${reposPath}/${name}`).pull();
      } else {
        console.log(`Cloning repository ${name}...`);
        await simpleGit(reposPath).clone(url, name);
      }

      findMarkdownFilesAndCopyToDocs(`${reposPath}/${name}`);

      createFolderIfNotExists(`${docsPath}/${name}`);

      fs.copyFileSync(
        `${reposPath}/${name}/README.md`,
        `${docsPath}/${name}/README.md`
      );
    })
  );

  console.log("All repositories documents fetched successfully!");
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
  });
}

// MAIN FUNCTION
(async function () {
  console.log(process.cwd());

  const repos = configuration.repositories;
  await syncRepositoryDocuments(repos);
  // removeRepositories();

  // await simpleGit(process.cwd())
  //   .add(reposPath)
  //   .commit("Update repositories")
  //   .push();
})();
