import { Link } from "react-router";
import { conversions } from "../config/conversions";

export default function AboutPage() {
  return (
    <article className="about-page">
      <h1 className="app-title">About the application</h1>

      <p>
        Online File Converter helps you convert documents and images,
        preview supported files, and download the results.
      </p>

      <p>
        <strong>Development version</strong> — the application is actively
        being improved.
      </p>

      <section aria-labelledby="about-how-it-works">
        <h2 id="about-how-it-works">How it works</h2>

        <ol>
          <li>
            Choose a file or drag it into the upload area. You can convert
            one source file at a time, with a maximum size of 10 MB.
          </li>
          <li>
            Choose an enabled conversion. Available options depend on
            the source file format.
          </li>
          <li>
            For conversions with additional settings, open
            {" "}Customize output to adjust the result.
          </li>
          <li>
            Select Convert and wait for the result.
          </li>
          <li>
            Preview the output and select Download File. When a conversion
            produces multiple files, you can select individual results
            or use Download all to download a ZIP archive.
          </li>
        </ol>

        <Link to="/">Open converter</Link>
      </section>

      <section aria-labelledby="about-conversions">
        <h2 id="about-conversions">Conversion options</h2>

        <p>The converter currently lists the following conversions:</p>

        <ul>
          {conversions.map((conversion) => (
            <li key={conversion.conversionType}>
              {conversion.sourceFormat.toUpperCase()}
              {" → "}
              {conversion.targetFormat.toUpperCase()}
            </li>
          ))}
        </ul>

        <p>
          Conversion availability depends on the file and the tools
          installed on the server. Some document conversions are still
          being improved.
        </p>
      </section>

      <section aria-labelledby="about-settings">
        <h2 id="about-settings">Output settings</h2>

        <ul>
          <li>
            <strong>PNG → JPG:</strong> choose quality from 1 to 100 and
            a background color to replace transparent areas.
            Defaults are quality 85 and a white background.
          </li>
          <li>
            <strong>JPG → PDF and TXT → PDF:</strong> choose portrait
            or landscape orientation. Portrait is the default.
          </li>
        </ul>
      </section>

      <section aria-labelledby="about-limits">
        <h2 id="about-limits">Before you start</h2>

        <ul>
          <li>
            Files are sent to the application server for conversion.
            To process files on your own computer, run both the
            application and its server locally.
          </li>
          <li>
            DOCX files do not have a direct preview. Convert them to PDF
            to view the result.
          </li>
          <li>
            Document conversions may require additional server tools,
            such as LibreOffice or Poppler.
          </li>
          <li>
            Download the results you want to keep. The application
            does not yet provide a conversion history.
          </li>
        </ul>
      </section>

      <section aria-labelledby="about-updates">
        <h2 id="about-updates">Recent improvements</h2>

        <ul>
          <li>
            Shared navigation with an active-page indicator and
            a visible keyboard focus.
          </li>
          <li>
            ZIP downloads for conversions that produce multiple files.
          </li>
          <li>
            Selection, preview, and individual download of multiple
            conversion results.
          </li>
          <li>
            PNG → JPG quality and background settings.
          </li>
          <li>
            Page orientation settings for JPG → PDF and TXT → PDF.
          </li>
        </ul>
      </section>

      <section aria-labelledby="about-plans">
        <h2 id="about-plans">Planned improvements</h2>

        <p>
          These features are planned and are not available yet.
          Priorities may change as development continues.
        </p>

        <ul>
          <li>Better recovery from unexpected interface errors.</li>
          <li>More reliable document conversions and improved previews.</li>
          <li>CSV support.</li>
          <li>Multiple-file uploads with individual conversion jobs.</li>
          <li>Conversion history for the current session.</li>
          <li>Further keyboard accessibility and mobile layout improvements.</li>
        </ul>
      </section>
    </article>
  );
}