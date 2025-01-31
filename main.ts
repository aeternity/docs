import fs from "fs";
import { simpleGit } from "simple-git";
import configuration from "./configuration.json";

interface Repository {
  name: string;
  url: string;
}

function createReposFolderIfNotExists() {
  fs.existsSync("repositories") || fs.mkdirSync("repositories");
}

function checkIfRepositoryExists(name: string) {
  if (!fs.existsSync(`repositories/${name}`)) return false;
  return simpleGit(`repositories/${name}`).checkIsRepo();
}

async function fetchRepositories(repositories: Array<Repository>) {
  createReposFolderIfNotExists();

  await Promise.all(
    repositories.map(async (repository: Repository) => {
      const { name, url } = repository;

      if (checkIfRepositoryExists(name)) {
        console.log(`Repository ${name} already exists, pulling changes...`);
        await simpleGit(`repositories/${name}`).pull();
      } else {
        console.log(`Cloning repository ${name}...`);
        await simpleGit("repositories").clone(url, name);
      }
    })
  );
}

// MAIN FUNCTION
(async function () {
  console.log(process.cwd());

  const repos = configuration.repositories;
  await fetchRepositories(repos);

  await simpleGit(process.cwd())
    .add("repositories")
    .commit("Update repositories");
  // .push();

  console.log("All repositories fetched successfully!");
})();
