import { Combobox } from "@headlessui/react";
import { CaretSortIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useFetcher } from "@remix-run/react";
import cep, { type CEP } from "cep-promise";
import { clsx } from "clsx/lite";
import { useEffect, useId, useRef, useState } from "react";
import { maskCEP, maskCNPJ, maskCPF, maskPhone } from "~/utils/masks";
import { validateCEP } from "~/utils/validators";

interface ContainerProps {
  className?: string,
  children: React.ReactNode;
  errorId?: string;
  errorMessage?: string;
  htmlFor?: string;
  label?: string;
  labelPosition?: "pre" | "post";
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

export type Option = {
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

function useInputAttr (attr: string[]) {
  const prefix = useId();
  const id = prefix + '-' + attr.join('_');
  // não tá sendo usado attr com mais de uma string por enquanto
  const name = attr.reduce((acc, v) => `${acc}[${v}]`);
  const errorId = `${id}-error`;
  return {id, name, htmlFor: id, errorId};
}

export function ValidationError ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx("text-xs text-red-500", className)}
      role="alert"
      {...props}
    >
      {children}
    </p>
  )
}

function Container ({
  className,
  children,
  errorMessage,
  errorId,
  htmlFor,
  label,
  labelPosition = "pre",
}: ContainerProps) {
  return (
    <div className={clsx("mb-2", className)}>
      {labelPosition === "pre" && label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {labelPosition === "post" && label && <label htmlFor={htmlFor}>{label}</label>}
      {errorMessage ? (
        <ValidationError id={errorId}>
          {errorMessage}
        </ValidationError>
      ) : null}
    </div>
  );
}

const inputClassNames = "w-full p-2 shadow-sm rounded-sm";

export function Input ({ appendElement, label, attr, errorMessage, ...inputProps }: InputProps) {
  const {id, name, htmlFor, errorId} = useInputAttr(attr);
  const isRadioInput = inputProps.type === "radio";
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
      labelPosition={isRadioInput ? "post" : "pre"}
    >
      <div className={clsx("relative", isRadioInput && "inline-block mr-1")}>
        <input
          className={clsx(inputClassNames, appendElement && "pr-7", isRadioInput && "shadow-none")}
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
  const {id, name, htmlFor, errorId} = useInputAttr(attr);
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
  const {id, name, htmlFor, errorId} = useInputAttr(attr);
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
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    cep(value)
      .then(onData)
      .catch((reason) => window.alert(reason.message))
      .finally(() => setIsLoading(false));
  };

  const appendElement = (
    <button
      disabled={isLoading}
      className={clsx(isLoading && "opacity-15")}
      type="button"
      onClick={handleSearch}
    >
      <MagnifyingGlassIcon/>
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

interface ComboBoxProps <TOption> {
  attr: string[];
  defaultValue?: TOption;
  errorMessage?: string;
  label: string;
  onChange?: (value: TOption | null) => void;
  renderOption?: (option: TOption) => React.ReactNode;
  required?: boolean;
  url: string;
}

export function ComboBox <TOption extends Option>({
  attr,
  defaultValue,
  errorMessage,
  label,
  onChange,
  renderOption,
  required,
  url,
}: ComboBoxProps<TOption>) {
  const fetcher = useFetcher<Option[]>();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const {name, errorId} = useInputAttr(attr);

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
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (    
    <Combobox
      as={Container}
      className="relative"
      defaultValue={defaultValue}
      onChange={onChange}
      errorId={errorId}
      errorMessage={errorMessage}
      name={name}
      nullable={true}
    >
      <Combobox.Label>{label}</Combobox.Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 px-1 w-7 grid place-items-center opacity-15">
          <MagnifyingGlassIcon/>
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
            <CaretSortIcon/>
          </Combobox.Button>
        </span>
      </div>
      <Combobox.Options className="absolute top-full inset-x-0 grid gap-1 bg-slate-50 z-10 p-1 mt-[2px] rounded-sm shadow-lg max-h-48 overflow-y-auto">
        {fetcher.data?.map((option) => (
          <Combobox.Option
            className="cursor-pointer bg-slate-100 data-[headlessui-state=active]:brightness-95 p-1 overflow-x-hidden"
            key={option.id}
            value={option}
          >
            {typeof renderOption === "function"
              ? renderOption(option as unknown as TOption)
              : option.label}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
}

export function SubmitButton ({className, children}: {children: React.ReactNode, className?: string}) {
  return (
    <button
      className={clsx(className, "px-6 py-1 mt-4 bg-slate-400 text-slate-50 rounded-sm shadow-sm hover:brightness-95")}
      type="submit"
    >
      {children}
    </button>
  );
}
