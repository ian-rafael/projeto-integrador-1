import { useState } from "react";
import ScannerButton from "./ScannerButton";
import { Input } from "./form";

type BarcodeInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">;

function BarcodeInput ({defaultValue, ...props}: BarcodeInputProps) {
  const [value, setValue] = useState(defaultValue || "");

  const appendElement = (
    <>
      {props.appendElement}
      <ScannerButton onResult={(code) => setValue(code)}/>
    </>
  );

  return (
    <Input
      {...props}
      appendElement={appendElement}
      onChange={(e) => setValue(e.target.value)}
      type="text"
      value={value}
    />
  );
}

export default BarcodeInput;
