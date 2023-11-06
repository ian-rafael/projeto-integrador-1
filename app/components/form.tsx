interface ContainerProps {
  errorId: string;
  errorMessage?: string;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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

export function Input ({ label, attr, errorMessage, ...inputProps }: InputProps) {
  const {id, name, htmlFor, errorId} = resolveInputAttr(attr);
  return (
    <Container
      label={label}
      htmlFor={htmlFor}
      errorId={errorId}
      errorMessage={errorMessage}
    >
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(errorMessage)}
        aria-errormessage={errorMessage ? errorId : undefined}
        {...inputProps}
      />
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
