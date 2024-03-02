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
            {value ? (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            )}
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
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
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
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
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
