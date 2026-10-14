# Online File Converter

Online File Converter is a local full-stack application for converting common
document and image formats. It validates an uploaded file, shows a preview,
lets the user choose conversion settings, and provides downloadable results.

The project is designed to run on the user's own computer. It is not a hosted
file-conversion service.

## Features

- File validation by extension, detected MIME type, and conversion type.
- Source previews for images, PDF, TXT, CSV, DOCX, XLSX, and PPTX files.
- XLSX sheet selection, including an **All sheets** preview.
- XLSX previews parsed in a cancellable Web Worker, with bounded preview data.
- Settings for PNG to JPG quality and background color.
- Page size and orientation settings for PDF output.
- Downloadable results, including ZIP download for multi-file conversions.
- Result previews use downloaded files, so they remain available after server cleanup.
- English and Polish UI with the selected language stored locally.
- Keyboard-accessible conversion workflow and an expandable preview dialog.
- Temporary upload and output cleanup on the server.
- CSV-to-PDF tables preserve long cell contents across multiple pages.

## Supported conversions

| Source | Target |
| --- | --- |
| PDF | JPG, TXT |
| JPG | PNG, PDF |
| PNG | JPG |
| TXT | PDF |
| CSV | PDF |
| DOCX | PDF |
| XLSX | PDF |
| PPTX | PDF |

DOCX, XLSX, and PPTX conversions use LibreOffice. XLSX conversion can use one
selected sheet or every sheet, together with page settings.

## Tech stack

- **Client:** React, Vite, TypeScript, React Router, React Hook Form, Zod,
  i18next, CSS Modules
- **Server:** Express, TypeScript, Multer, Zod
- **File processing:** Sharp, PDFKit, Papa Parse, SheetJS, docx-preview,
  Office Kit, LibreOffice, pdf-poppler
- **Testing:** Vitest, Testing Library, MSW, Supertest, Playwright
- **CI:** GitHub Actions

## Requirements

- Node.js 22 or newer and npm
- LibreOffice for DOCX, XLSX, and PPTX to PDF conversion
- Poppler on `PATH` on Linux/macOS (`pdfinfo`, `pdftocairo`, `pdftotext`)

The default server configuration expects portable LibreOffice here:

```text
tools/libreoffice/program/soffice.com
```

The repository includes an empty `tools/` directory. Copy a portable
LibreOffice build into that directory before using Office-to-PDF conversions.
Its contents are ignored by Git, so converter binaries are never committed.
Alternatively, set the `LIBRE_OFFICE_PATH` environment variable to a local
executable (for example `/usr/bin/libreoffice` on Linux). Windows uses Poppler
binaries bundled by `pdf-poppler`; `POPPLER_BIN_DIR` can override their location.
PDF conversions run external tools with a two-minute timeout.

## Setup

Install dependencies and the Playwright browser:

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
npx playwright install chromium
```

Start the client and server together:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

The API binds to `127.0.0.1`. CORS permits the local Vite development and preview
origins; set `CLIENT_ORIGIN` to allow a different frontend origin.

## Processing limits

| Operation | Limit |
| --- | --- |
| Upload | 10 MB per file |
| Image conversion (JPG/PNG and JPG to PDF) | 40 million pixels, checked before conversion |
| PDF inputs and TXT/CSV PDF outputs | 100 pages |
| Office archive processing on the server | 50 MB of decompressed data and 2,000 entries |
| CSV conversion | 10,000 rows, 50 columns, 50,000 characters per cell or header |
| XLSX preview archive | 50 MB of decompressed data and 500 entries |
| XLSX preview table | 20 sheets, 50 columns, first 100 rows per sheet; up to 100,000 cells |
| Downloaded conversion results | 100 MB total per conversion |

The server admits at most two requests to upload, validation and conversion at
a time. LibreOffice jobs run one at a time. Removing a file cancels browser
requests and XLSX preview parsing; server processing already started may
continue until completion or its timeout.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run test:e2e
```

`check` runs frontend linting, type checks for both applications, unit and
integration tests (including actual PDF and LibreOffice output checks), and the
client production build. `test:e2e` starts the development servers when needed
and tests the application in Chromium, including real conversions and ZIP
contents. Both commands require the external tools listed above. GitHub Actions
runs both checks for pushes and pull requests to `main`.

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution policy
blocks `npm.ps1`. To run tests for each application separately:

```powershell
npm.cmd run test:run --prefix client
npm.cmd run test:run --prefix server
```

The latest full verification passed 185 frontend tests, 101 backend tests and
6 Chromium E2E tests, along with linting, type checks and the production build.

## File handling and privacy

Source uploads are deleted after the request finishes. Generated files are
available temporarily for download; a later upload removes results older than
30 minutes. Temporary upload and output folders are also cleared when the
server stops normally.

Only upload files you are allowed to process. For sensitive documents, run the
application and server on your own computer. The in-app Privacy page explains
the same handling in the user interface.

## Project structure

```text
client/       React application
server/       Express API and conversion logic
shared/       API response types and backend error codes used by both applications
e2e/          Playwright scenarios and deterministic fixtures
tools/        Local LibreOffice location; binaries are ignored by Git
docs/         Local learning documentation; ignored by Git
```

## License and third-party software

The project is licensed under MIT. LibreOffice is distributed separately under
its own licenses. If the application is later packaged with LibreOffice, the
release must include the required third-party notices.
