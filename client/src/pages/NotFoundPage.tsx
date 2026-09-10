import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <>
      <h1 className="app-title">Page Not Found</h1>
      <Link to="/">Back to converter</Link>
    </>
  );
}
