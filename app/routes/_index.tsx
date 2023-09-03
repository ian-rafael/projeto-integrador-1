import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div>
      <h1>Hello, World</h1>
      <Link to="app">App</Link>
    </div>
  );
}
