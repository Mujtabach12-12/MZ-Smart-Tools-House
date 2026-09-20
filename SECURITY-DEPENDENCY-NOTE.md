# Dependency security note — V10

## Fixed stale dependency crash
The V10 lockfile pins `pptxgenjs` to **4.0.1** and does not contain the obsolete `jquery-node -> jsdom -> request -> form-data/qs/tough-cookie` chain that caused the Vite/Rolldown parse crash in the previous local install.

`repair-and-run.cmd` deletes any old `node_modules` folder, runs a clean `npm ci`, verifies the installed PptxGenJS/Vite versions, then runs tests and the production build before starting the dev server.

Do **not** run `npm audit fix --force`; npm may choose package versions outside the tested dependency range.

## SheetJS / xlsx advisory
This release still uses `xlsx@0.18.5` for real XLSX import/export. npm reports upstream security advisories for the npm-distributed SheetJS Community Edition and currently reports no npm fix. V10 limits spreadsheet imports to 15 MB and performs processing locally in the browser, but this does not make the upstream advisory disappear.

A future security-hardening release should migrate XLSX parsing/writing to a maintained alternative after compatibility tests for formulas, multiple sheets, imports and exports. Until then, do not treat `npm audit` as completely clean, and do not use `--force` to silence it.
