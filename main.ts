import { simpleGit } from "simple-git";

import configuration from "./app-config.json";
import { docsPath, fetchLatestDocuments } from "./src/utils";

await (async function () {
  if (!Bun.env.GH_TOKEN) {
    console.error("GitHub access token is required!");
    process.exit(1);
  }

  const appGit = simpleGit(process.cwd())
    .removeRemote("origin")
    .addRemote(
      "origin",
      `https://${Bun.env.GH_TOKEN}@github.com/aeternity/docs`
    )
    .pull("origin", "master");

  await fetchLatestDocuments(getRepositories());
  await appGit.add(docsPath).commit("Update docs").push("origin", "master");

  console.log("Docs synced successfully!");
})();

function getRepositories() {
  return configuration.repoUrls.map((url) => ({
    url,
    name: url.split("/").pop()!,
  }));
}
