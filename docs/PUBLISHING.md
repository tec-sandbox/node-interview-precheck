# Publishing on GitHub (for interview organizers)

1. Create a new, empty repository named `node-interview-precheck` under the GitHub account or organization. Do not generate a README or `.gitignore` on GitHub; these files are already included.
2. Extract the ZIP archive on your computer and open a terminal in the `node-interview-precheck` folder.
3. Run:

```bash
git init
git add .
git commit -m "Initial environment precheck"
git branch -M main
git remote add origin https://github.com/USERNAME/node-interview-precheck.git
git push -u origin main
```

Replace `USERNAME` with your account or organization name. GitHub may prompt you to authenticate via your browser or a Git credential helper. Never put personal passwords in scripts.

## Visibility

The environment precheck repository can be public: it does not contain the actual interview exercise. Keep the technical challenge in a separate repository.

## Before sending it to candidates

1. Run `npm install` with Node.js 26 and Internet access.
2. Commit and push the generated `package-lock.json` (`git add package-lock.json`, then commit and push) to lock dependency versions.
3. Run `npm run check` with Docker running on a test computer.
4. Share the repository URL and the instruction to run `npm run check`.

Do not include personal credentials or customer data.

## Updating an existing repository

If this project has already been uploaded, clone the existing repository and copy the **contents** of this updated project into the cloned folder, preserving the `.git` directory in the clone. Then run:

```bash
git add -A
git commit -m "Translate environment precheck to English"
git push
```
