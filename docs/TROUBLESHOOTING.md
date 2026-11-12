# Troubleshooting

**Node.js is not version 26.x** — Install Node.js 26 from https://nodejs.org/, close and reopen the terminal, and verify with `node --version`.

**npm not found** — Reinstall Node.js with npm included. On Windows, check that Node.js is on your PATH and restart VS Code.

**Git not found** — Install Git from https://git-scm.com/downloads and restart your terminal.

**Docker not found** — Install Docker Desktop or Docker Engine and restart your terminal.

**Docker Engine is unavailable** — Open Docker Desktop and wait for the engine to finish starting. On Linux, check the Docker service with `docker info` and verify that your user has permission to access the Docker socket.

**Docker Compose v2 is unavailable** — Run `docker compose version`. The legacy `docker-compose` command alone is not sufficient.

**Port 55432 is already in use** — Stop the application or container using that port. Inspect running containers with `docker ps`, and use your operating system's tools to find local port listeners. Do not stop unknown processes without checking what they are.

**npm package or PostgreSQL image download failed** — Check your Internet connection, VPN, and proxy settings. Run `npm run check` again when downloads are available. If you are using a corporate network, follow your IT department's policies.

**TypeScript or NestJS error** — Make sure the project files are intact. To force a clean dependency installation, delete the local `node_modules` folder and run `npm run check` again.

**VS Code command not detected** — Open VS Code manually. This is not a blocking error: `code` may be absent from your PATH even if VS Code is installed.

**Manual Docker cleanup (this precheck only)** — From the project folder, run:

```bash
docker compose -p node26-interview-precheck -f compose.yaml down --volumes
```

This command targets the Docker Compose project dedicated to the precheck.
