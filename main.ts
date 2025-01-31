import fs from "fs";
import { simpleGit } from "simple-git";
import configuration from "./configuration.json";

const reposPath = "docs";

interface Repository {
  name: string;
  url: string;
}

function createReposFolderIfNotExists() {
  fs.existsSync(reposPath) || fs.mkdirSync(reposPath);
}

function checkIfRepositoryExists(name: string) {
  if (!fs.existsSync(`${reposPath}/${name}`)) return false;
  return simpleGit(`${reposPath}/${name}`).checkIsRepo();
}

async function fetchRepositories(repositories: Array<Repository>) {
  createReposFolderIfNotExists();

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
    })
  );
}

// MAIN FUNCTION
(async function () {
  console.log(process.cwd());

  const repos = configuration.repositories;
  await fetchRepositories(repos);

  await simpleGit(process.cwd()).add("docs").commit("Update repositories");
  // .push();

  console.log("All repositories fetched successfully!");
})();
