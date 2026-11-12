# Node.js Backend — Environment Precheck

This repository is **only for checking your development environment before the interview**. It does not contain the technical challenge.

## Requirements

- **Node.js 26.x** and npm: https://nodejs.org/
- **Git**: https://git-scm.com/downloads
- **Docker Desktop** (running), or Docker Engine with **Docker Compose v2**: https://docs.docker.com/get-docker/
- **Visual Studio Code**: https://code.visualstudio.com/ (open it manually; automatic detection is advisory only)
- An Internet connection for the initial download of npm packages and the PostgreSQL Docker image

NestJS 11, TypeScript 5.9, and TypeORM 0.3 are **project dependencies**. You do not need to install them globally.

## Instructions for candidates

1. Install the tools listed above and **start Docker Desktop** if you are using it.
2. Clone this repository (or download it as a ZIP), then open the project folder in VS Code.
3. Open a terminal in the project folder and run **one command**:

   ```bash
   npm run check
   ```

4. If you see **`READY FOR INTERVIEW`**, your environment is ready. Otherwise, follow the error message and run the command again.
5. Share the result with the recruiter. A screenshot of the final summary is sufficient; please avoid including personal information.

**What the command does:** `npm run check` installs missing npm dependencies, starts a temporary PostgreSQL instance in Docker, compiles TypeScript, starts NestJS, executes a real two-table JOIN through TypeORM, and **stops the database** when it finishes. The first run may need to download packages and a Docker image.

### Expected output (example)

```text
✓ Node.js 26.x
✓ npm available
✓ Git available
✓ Docker CLI
✓ Docker Engine running
✓ Docker Compose v2
✓ npm dependencies installed
✓ NestJS 11 / TypeScript 5.9 / TypeORM 0.3 / pg 8
✓ PostgreSQL ready (Docker)
✓ TypeScript compilation
✓ NestJS running and HTTP responding
✓ TypeORM: JOIN customers + purchases

✓ READY FOR INTERVIEW
```

The script also checks whether the VS Code command-line tool is available, but **does not fail** if `code` is missing from your PATH. The editor may still be installed and working correctly.

## Technical details

- Database: PostgreSQL 17 Alpine in a temporary Docker container, bound to `127.0.0.1:55432` only.
- Tables: `customers` and `purchases`.
- Sample data: Ada (two purchases totaling 3,000 cents) and Grace (one purchase totaling 4,900 cents).
- Checks: HTTP GET `/health`, followed by GET `/join`, with validation of the expected results.
- No cloud account, remote database, or Oracle installation is required.
- The temporary database is stopped and removed at the end of the check. **Do not use this setup to store real data.**

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for help with common issues, including Docker Desktop not running and local port 55432 already in use.
