# MZ Smart Tool House — clean install fix

The reported errors are dependency-tree errors inside `node_modules`, not errors in the application's source files:

- `cssstyle/lib/properties.js`: duplicate `parse`
- `acorn/dist/acorn.es.js`: missing `parse_dammit`, `LooseParser`, and `pluginsLoose`

This project archive intentionally does **not** include `node_modules` or a stale lockfile.

## Windows

Open Command Prompt in the project folder and run:

```bat
repair-and-run.cmd
```

Or manually:

```bat
rmdir /s /q node_modules
del /f /q package-lock.json
del /f /q npm-shrinkwrap.json
npm install --no-audit --no-fund
npm run build
npm run dev
```

Do not copy the old `node_modules` folder back into this project.

## Verification performed on the source archive

- 185 project files inspected; no duplicate archive paths.
- Relative JavaScript/JSX imports were checked and no missing local targets were found.
- Calculator test suite: 54 tests passed.
- Tool registry audit: 211 active tools passed.
- The original source tree and directory structure were preserved.

A full Vite production build could not be executed in this environment because the package registry was unavailable long enough to install the dependencies. Therefore the clean-install step above is required on the target Windows machine.
