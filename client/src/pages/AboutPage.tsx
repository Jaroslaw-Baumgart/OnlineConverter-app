import { Link } from "react-router";
import { conversions } from "../config/conversions";

export default function AboutPage() {
  return (
    <article className="about-page">
      <h1 className="app-title">About the application</h1>

      <p>
        Online File Converter converts common images, documents, spreadsheets,
        presentations, and text files. Upload a file, choose the conversion you
        need, then download the result.
      </p>

      <section aria-labelledby="about-how-it-works">
        <h2 id="about-how-it-works">How to use it</h2>

        <ol>
          <li>Upload one file, up to 10 MB.</li>
          <li>Choose one of the available conversion options.</li>
          <li>Set page or image options when they are available.</li>
          <li>Convert the file and download the result.</li>
        </ol>

        <Link to="/">Open converter</Link>
      </section>

      <section aria-labelledby="about-conversions">
        <h2 id="about-conversions">Supported conversions</h2>

        <ul>
          {conversions.map((conversion) => (
            <li key={conversion.conversionType}>
              {conversion.sourceFormat.toUpperCase()}
              {" to "}
              {conversion.targetFormat.toUpperCase()}
            </li>
          ))}
        </ul>

        <p>
          The available options change with the file you upload. The server also
          checks the file before conversion starts.
        </p>
      </section>

      <section aria-labelledby="about-previews">
        <h2 id="about-previews">Previews</h2>

        <p>
          Images, PDFs, text files, CSV files, DOCX documents, XLSX workbooks,
          and PPTX presentations can be previewed before conversion. For XLSX,
          you can preview one sheet or all sheets.
        </p>
      </section>

      <section aria-labelledby="about-settings">
        <h2 id="about-settings">Conversion settings</h2>

        <ul>
          <li>PNG to JPG: image quality and background color.</li>
          <li>JPG, TXT, and CSV to PDF: A4 or A3, portrait or landscape.</li>
          <li>
            XLSX to PDF: one sheet or all sheets, page size, orientation, and
            fit-to-page output.
          </li>
        </ul>
      </section>

      <section aria-labelledby="about-files">
        <h2 id="about-files">Files and results</h2>

        <p>
          Files are processed on the application server. DOCX, XLSX, and PPTX
          PDF conversion uses LibreOffice. Results are temporary, so download
          anything you want to keep. See the <Link to="/privacy">privacy page</Link>
          {" "}for details.
        </p>
      </section>
    </article>
  );
}