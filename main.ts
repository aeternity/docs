import fs from "fs";
import path from "path";
import moment from "moment";
import express from "express";
import { CronJob } from "cron";
import { simpleGit } from "simple-git";
import configuration from "./app-config.json";

const app = express();
const port = 3000;
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

async function pullDocuments(repositories: Array<Repository>) {
  createFolderIfNotExists(reposPath);
  createFolderIfNotExists(docsPath);

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
      createFolderIfNotExists(`${docsPath}/${name}`);

      fs.copyFileSync(
        `${reposPath}/${name}/README.md`,
        `${docsPath}/${name}/README.md`
      );
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
  });
}

// JOB FUNCTION
let lastSyncedAt: moment.Moment;
async function syncDocs() {
  await pullDocuments(configuration.repositories);

  await simpleGit(process.cwd())
    .removeRemote("origin")
    .addRemote(
      "origin",
      `https://${Bun.env.GH_ACCESS_TOKEN}@github.com/aeternity/docs`
    )
    .fetch("origin")
    .pull("origin", "master")
    .add(docsPath)
    .commit("Update docs")
    .push("origin", "master");

  console.log("Docs synced successfully!");
  lastSyncedAt = moment();
}

// SERVER
app.get("/", (_, res) => {
  res.send("Last synced " + lastSyncedAt.fromNow());
});

app.listen(port, () => {
  console.log(`Application is started on port ${port}`);
  syncDocs();
});

// CRON JOB
new CronJob("* * * * *", syncDocs, null, true);
