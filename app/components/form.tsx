import cep, { type CEP } from "cep-promise";
import { useState } from "react";
import { maskCEP, maskCNPJ, maskCPF, maskPhone } from "~/utils/masks";
import { validateCEP } from "~/utils/validators";

interface ContainerProps {
  errorId: string;
  errorMessage?: string;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
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

function Container ({ children, errorMessage, errorId, htmlFor, label }: ContainerProps) {
  return (
    <div className="form-element-container">
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

export function Input ({ appendElement, label, attr, errorMessage, ...inputProps }: InputProps) {
  const {id, name, htmlFor, errorId} = resolveInputAttr(attr);
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
    >
      <div className="input-wrapper">
        <input
          id={id}
          name={name}
          aria-invalid={Boolean(errorMessage)}
          aria-errormessage={errorMessage ? errorId : undefined}
          {...inputProps}
        />
        {appendElement}
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
      className="cep-button"
      type="button"
      onClick={handleSearch}
    >
      🔍
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
    <div className="form-array form-element-container">
      {items.map((k, i) => (
        <div key={k} className="form-array-item">
          <div className="form-array-item-content">
            {children(i)}
          </div>
          {items.length === min ? null : (
            <button
              className="remove-button"
              onClick={() => removeItem(i)}
              type="button"
            >
              &#215;
            </button>
          )}
        </div>
      ))}
      <button
        className="add-button"
        onClick={addItem}
        type="button"
      >
        +
      </button>
    </div>
  );
}
