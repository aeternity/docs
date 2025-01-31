import fs from "fs";
import { simpleGit } from "simple-git";
import configuration from "./configuration.json";

const reposPath = "repos";
const docsPath = "docs";

interface Repository {
  name: string;
  url: string;
}

function createFolderIfNotExists(path: string) {
  fs.existsSync(path) || fs.mkdirSync(path);
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

      createFolderIfNotExists(`${docsPath}/${name}`);
      fs.copyFileSync(
        `${reposPath}/${name}/README.md`,
        `${docsPath}/${name}/README.md`
      );
    })
  );

  console.log("All repositories documents fetched successfully!");
}

function removeRepositories() {
  fs.rmdirSync(reposPath, { recursive: true });
  console.log("All repositories removed!");
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
