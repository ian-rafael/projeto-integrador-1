import { CameraIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Scanner from "./Scanner";
import Modal from "./Modal";

function ScannerButton ({ className, onResult }: { className?: string, onResult: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const onScannerResult = (code: string) => {
    setIsOpen(false);
    onResult(code);
  };

  return (
    <>
      <button
        className={className}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <CameraIcon/>
      </button>
      <Modal className="open:grid grid-rows-[auto_1fr]" open={isOpen}>
        <header className="mb-1 flex justify-between text-xl">
          <span>Escaneie o código de barras</span>
          <button
            className="block p-1"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <Cross1Icon/>
          </button>
        </header>
        <ClientOnly>
          {() => (
            <Scanner
              paused={!isOpen}
              onResult={onScannerResult}
            />
          )}
        </ClientOnly>
      </Modal>
    </>
  );
}

export default ScannerButton;
