----
hide: true
---

# Aeternity Docs Updater

This project was created to keep track of the Aeternity ecosystem repositories, and format them under this repo to have a one-of solution for all the documentation that ecosystem provides within various repos.

To install dependencies:

```bash
bun install
```

## Configuration and running

To track the desired repositories, repos links and names should be added to `app-config.json`. Also, application requires a GitHub Access Token with write rights to this repo which should be set in `.env` file as in `.env.example`.

Afterwards, following commands can be used;

to run directly:

```bash
bun run main.ts
```

to run as a docker container:

```
docker compose up --build
```
