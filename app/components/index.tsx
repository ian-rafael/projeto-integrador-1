import { Link } from "@remix-run/react";

type Rows = {id: string, name: string, extra?: any}[];

function List ({ rows }: { rows: Rows }) {
  return (
    <ul className="mt-4 grid gap-2">
      {rows.map((data) => {
        return (
          <li className="bg-slate-300 rounded-md hover:brightness-95" key={data.id}>
            <Link
              className="block p-2"
              to={data.id}
            >
              {data.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CreateLink () {
  return (
    <Link
      className="text-blue-600 hover:underline inline-flex items-center gap-1"
      to="create"
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
      Novo registro
      {/* {createLabel} */}
    </Link>
  )
}

interface IndexProps {
  title: string,
  createLabel: string;
  rows: Rows;
}

export default function Index ({ title, rows }: IndexProps) {
  return (
    <div className="border-r border-slate-300 mr-8 pr-8">
      <h2>{title}</h2>
      <CreateLink/>
      <List rows={rows}/>
    </div>
  )
}
