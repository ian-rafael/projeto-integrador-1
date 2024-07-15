import { Link, redirect } from "@remix-run/react";

export const loader = () => {
  return redirect('/app');
}

export default function Index() {
  return (
    <div>
      <h1>Hello, World</h1>
      <Link to="app">App</Link>
    </div>
  );
}
