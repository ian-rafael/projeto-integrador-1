import { CheckIcon, Cross2Icon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Form, Link } from "@remix-run/react";
import clsx from "clsx/lite";
import { formatCurrency, formatDate } from "~/utils/formatters";

export function List ({children}: {children: React.ReactNode}) {
  return <dl>{children}</dl>;
}

export function Item ({children, title}: {children: React.ReactNode, title: string}) {
  return (
    <>
      <dt className="text-sm font-bold inline-block p-1">{title}</dt>
      <dd className="mb-3">{children}</dd>
    </>
  )
}

interface TableProps {
  cols: {
    property: string,
    label: string,
    type: string,
    renderData?: (data: {[key: string]: any}) => React.ReactNode,
  }[],
  rows: {[key: string]: any}[],
  idKey?: string,
}

export function Table ({ cols, rows, idKey = 'id' }: TableProps) {
  const renderData = (value: any, type: string) => {
    switch (type) {
      case "date":
        return formatDate(value);
      case "text":
        return String(value);
      case "currency":
        return formatCurrency(value);
      case "bool":
        return (
          <span className="inline-block">
            {value ? <CheckIcon/> : <Cross2Icon/>}
          </span>
        );
      default:
        return value;
    }
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="text-xs">
          {cols.map((colData) => (
            <th key={colData.property}>
              {colData.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((data) => (
          <tr key={data[idKey]}>
            {cols.map((colData, index) => (
              <td
                key={colData.property}
                className={clsx("py-2", index !== 0 && "text-center")}
              >
                {typeof colData.renderData === "function"
                  ? colData.renderData(data)
                  : renderData(data[colData.property], colData.type)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EditLink () {
  return (
    <Link
      className="text-blue-600 hover:underline flex items-center gap-1"
      to="edit"
    >
      <Pencil1Icon/>
      Editar
    </Link>
  );
}

export function DeleteButton ({action}: {action?: string}) {
  return (
    <Form
      action={action}
      method="post"
      onSubmit={(event) => {
        if (
          !confirm(
            "Favor, confirme que você quer deletar esse registro."
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        className="px-3 py-1 rounded-sm flex items-center gap-1 shadow-sm bg-slate-50 text-red-500 hover:brightness-95"
        name="intent"
        value="delete"
        type="submit"
      >
        <TrashIcon/>
        Deletar
      </button>
    </Form>
  );
}

export function Actions () {
  return (
    <div className="mt-4 flex items-center gap-8">
      <EditLink/>
      <DeleteButton/>
    </div>
  );
}
