import { PlusIcon } from "@radix-ui/react-icons";
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
      <PlusIcon/>
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
