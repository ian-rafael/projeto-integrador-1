import { Combobox } from "@headlessui/react";
import { useFetcher } from "@remix-run/react";
import cep, { type CEP } from "cep-promise";
import clsx from "clsx/lite";
import { useEffect, useRef, useState } from "react";
import { maskCEP, maskCNPJ, maskCPF, maskPhone } from "~/utils/masks";
import { validateCEP } from "~/utils/validators";

interface ContainerProps {
  className?: string,
  children: React.ReactNode;
  errorId?: string;
  errorMessage?: string;
  htmlFor?: string;
  label?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  appendElement?: React.ReactNode;
  attr: string[];
  errorMessage?: string;
  label: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  attr: string[];
  errorMessage?: string;
  label: string;
}

type Option = {
  id: string | number;
  label: string;
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  attr: string[];
  errorMessage?: string;
  label: string;
  options: Option[];
}

interface FormArrayProps {
  children: (i: number) => React.ReactNode;
  defaultLength?: number;
}

function resolveInputAttr (attr: string[]) {
  const id = attr.join('_');
  const name = attr.reduce((acc, v) => `${acc}[${v}]`);
  const errorId = `${id}-error`;
  return {id, name, htmlFor: id, errorId};
}

function Container ({
  className,
  children,
  errorMessage,
  errorId,
  htmlFor,
  label,
}: ContainerProps) {
  return (
    <div className={clsx("mb-2", className)}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {errorMessage ? (
        <p className="form-validation-error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

const inputClassNames = "w-full p-2 shadow-sm rounded-sm";

export function Input ({ appendElement, label, attr, errorMessage, ...inputProps }: InputProps) {
  const {id, name, htmlFor, errorId} = resolveInputAttr(attr);
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
    >
      <div className="relative">
        <input
          className={clsx(inputClassNames, appendElement && "pr-7")}
          id={id}
          name={name}
          aria-invalid={Boolean(errorMessage)}
          aria-errormessage={errorMessage ? errorId : undefined}
          {...inputProps}
        />
        {appendElement && (
          <span className="absolute right-0 inset-y-0 w-7 grid place-items-center">
            {appendElement}
          </span>
        )}
      </div>
    </Container>
  );
}

export function Textarea ({ label, attr, errorMessage, ...inputProps }: TextareaProps) {
  const {id, name, htmlFor, errorId} = resolveInputAttr(attr);
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
    >
      <textarea
        className={clsx(inputClassNames, "resize-y")}
        id={id}
        name={name}
        aria-invalid={Boolean(errorMessage)}
        aria-errormessage={errorMessage ? errorId : undefined}
        {...inputProps}
      />
    </Container>
  );
}

export function Select ({ label, attr, errorMessage, options, ...selectProps }: SelectProps) {
  const {id, name, htmlFor, errorId} = resolveInputAttr(attr);
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
    >
      <select
        className={inputClassNames}
        id={id}
        name={name}
        aria-invalid={Boolean(errorMessage)}
        aria-errormessage={errorMessage ? errorId : undefined}
        {...selectProps}
      >
        <option value="">Selecione uma opção</option>
        {options.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </Container>
  );
}

export function CpfInput ({defaultValue, ...rest}: Omit<InputProps, "type" | "defaultValue"> & {defaultValue?: string}) {
  const [value, setValue] = useState(maskCPF(defaultValue || ""));
  return (
    <Input
      {...rest}
      maxLength={14}
      onChange={(e) => setValue(maskCPF(e.target.value))}
      type="text"
      value={value}
    />
  );
}

export function CnpjInput ({defaultValue, ...rest}: Omit<InputProps, "type" | "defaultValue"> & {defaultValue?: string}) {
  const [value, setValue] = useState(maskCNPJ(defaultValue || ""));
  return (
    <Input
      {...rest}
      maxLength={18}
      onChange={(e) => setValue(maskCNPJ(e.target.value))}
      type="text"
      value={value}
    />
  );
}

export function CepInput ({defaultValue, onData, ...rest}: Omit<InputProps, "type" | "defaultValue"> & {
  defaultValue?: string,
  onData?: (cep: CEP) => void,
}) {
  const [value, setValue] = useState(maskCEP(defaultValue || ""));

  const handleSearch = () => {
    if (!value) {
      window.alert("CEP está vazio");
      return;
    }
    const error = validateCEP(value);
    if (error) {
      window.alert(error);
      return;
    }
    cep(value)
      .then(onData)
      .catch((reason) => window.alert(reason.message));
  };

  const appendElement = (
    <button
      type="button"
      onClick={handleSearch}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
    </button>
  );

  return (
    <Input
      {...rest}
      appendElement={appendElement}
      maxLength={9}
      onChange={(e) => setValue(maskCEP(e.target.value))}
      type="text"
      value={value}
    />
  );
}

export function PhoneInput ({defaultValue, ...rest}: Omit<InputProps, "type" | "defaultValue"> & {defaultValue?: string}) {
  const [value, setValue] = useState(maskPhone(defaultValue || ""));
  return (
    <Input
      {...rest}
      maxLength={15}
      onChange={(e) => setValue(maskPhone(e.target.value))}
      type="text"
      value={value}
    />
  );
}

function getArrayItems (length: number) {
  return Array.from(Array(length).keys());
}

export function FormArray ({ children, defaultLength = 0 }: FormArrayProps) {
  const min = defaultLength;
  const [items, setItems] = useState<number[]>(getArrayItems(defaultLength));

  const addItem = () => setItems(items.concat(Date.now()));

  const removeItem = (i: number) => {
    if (items.length === min) return;
    const newItems = [...items];
    newItems.splice(i, 1);
    setItems(newItems);
  };

  return (
    <div className="grid gap-1">
      {items.map((k, i) => (
        <div key={k} className="flex gap-2">
          <div className="flex-1">
            {children(i)}
          </div>
          {items.length === min ? null : (
            <button
              className="px-1 bg-slate-300 rounded-sm shadow-sm hover:brightness-95"
              onClick={() => removeItem(i)}
              title="Remover linha"
              type="button"
            >
              &#215;
            </button>
          )}
        </div>
      ))}
      <button
        className="w-full mt-1 bg-slate-300 rounded-sm shadow-sm hover:brightness-95"
        onClick={addItem}
        title="Adicionar linha"
        type="button"
      >
        +
      </button>
    </div>
  );
}

type ComboBoxProps = {
  attr: string[];
  defaultValue?: Option;
  errorMessage?: string;
  label: string;
  required?: boolean;
  url: string;
};

export function ComboBox ({
  attr,
  defaultValue,
  errorMessage,
  label,
  required,
  url,
}: ComboBoxProps) {
  const fetcher = useFetcher<Option[]>();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const {name, errorId} = resolveInputAttr(attr);

  const load = (term: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      fetcher.load(url + "?term=" + term);
    }, 500);
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (    
    <Combobox
      as={Container}
      className="relative"
      defaultValue={defaultValue}
      errorId={errorId}
      errorMessage={errorMessage}
      name={name}
    >
      <Combobox.Label>{label}</Combobox.Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 px-1 w-7 grid place-items-center opacity-15">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
        </span>
        <Combobox.Input
          aria-errormessage={errorMessage ? errorId : undefined}
          aria-invalid={Boolean(errorMessage)}
          autoComplete="off"
          className={clsx(inputClassNames, 'px-7')}
          displayValue={(option: Option) => option ? option.label : ''}
          onBlur={() => load('')}
          onChange={(e) => load(e.target.value)}
          required={required}
        />
        <span className="absolute right-0 inset-y-0 w-7 grid place-items-center">
          <Combobox.Button>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </Combobox.Button>
        </span>
      </div>
      <Combobox.Options className="absolute top-full inset-x-0 grid gap-1 bg-slate-50 z-10 p-1 mt-[2px] rounded-sm shadow-lg max-h-48 overflow-auto">
        {fetcher.data?.map((option) => (
          <Combobox.Option
            className="cursor-pointer bg-slate-100 data-[headlessui-state=active]:brightness-95 p-1"
            key={option.id}
            value={option}
          >
            {option.label}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
}

export function SubmitButton ({children}: {children: React.ReactNode}) {
  return (
    <button
      className="px-6 py-1 mt-4 bg-slate-400 text-slate-50 rounded-sm shadow-sm hover:brightness-95"
      type="submit"
    >
      {children}
    </button>
  );
}
