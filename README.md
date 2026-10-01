# Online File Converter

A full-stack application for converting common files in a local development
setup. It provides a preview before conversion, validates uploads on the
server, and creates downloadable results.

## Features

- One uploaded file per conversion, up to 10 MB.
- File validation based on the extension, detected MIME type, and supported
  conversion type.
- Source previews for images, PDF, TXT, CSV, DOCX, XLSX, and PPTX files.
- XLSX preview with sheet selection, including an All sheets option.
- Settings for PNG to JPG quality and background color.
- PDF page settings for JPG, TXT, CSV, and XLSX conversions.
- ZIP download when a conversion produces more than one file.
- Temporary upload cleanup after every request.
- Output cleanup: files older than 30 minutes are removed when a new upload is
  received. Temporary folders are also cleared when the server starts and
  stops normally.

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

DOCX, XLSX, and PPTX to PDF conversion uses LibreOffice. XLSX files are
prepared before conversion so the chosen sheet and page settings can be used.

## Tech stack

- Client: React, Vite, TypeScript, React Router, React Hook Form, Zod
- Server: Express, TypeScript, Multer, Zod
- File processing: Sharp, PDFKit, Papa Parse, SheetJS, docx-preview,
  Office Kit, LibreOffice, Poppler
- Tests: Vitest, Testing Library, MSW, Supertest

## Local setup

### Requirements

- Node.js and npm
- LibreOffice for DOCX, XLSX, and PPTX to PDF conversion
- Poppler utilities for PDF to JPG and the PDF-to-text fallback

The current server configuration expects LibreOffice at:

```text
tools/libreoffice/program/soffice.com
```

`tools/` is intentionally ignored by Git. Put a portable LibreOffice build in
that directory for local development, or change `LIBRE_OFFICE_PATH` in
`server/src/utils/constants.ts` to match your installation. Make sure Poppler
is available to the server process.

### Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### Run the application

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000

## Tests and type checks

```bash
npm.cmd run test:run --prefix client
npm.cmd run typecheck --prefix client

npm.cmd run test:run --prefix server
npm.cmd run typecheck --prefix server
```

## File handling

Uploads are stored only while the request is being processed and are deleted
when it ends. Generated files are served from the temporary output directory.
Download any file you want to keep: on the next upload, results older than 30
minutes are removed.

For sensitive documents, run both the client and server on your own computer.
The privacy page in the app describes temporary file handling in more detail.

## Project structure

```text
client/       React application
server/       Express API and conversion logic
tools/        Local converter binaries, not committed to Git
docs/         Local mentoring and project documentation, not committed to Git
```

## License and third-party software

The project is licensed under MIT. LibreOffice is distributed separately under
its own licenses. Before packaging and distributing LibreOffice with an
installer, add the required third-party license notices to the release.