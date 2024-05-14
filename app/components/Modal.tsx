import clsx from "clsx";
import { useEffect, useRef } from "react";

function Modal ({ children, className, open }: { children: React.ReactNode, className?: string, open: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open]);

  return (
    <dialog
      className={clsx(
        "bg-slate-50 p-2 h-screen w-screen rounded",
        "lg:h-[700px] lg:w-[800px]",
        "backdrop:bg-[rgba(0,0,0,0.5)]",
        className,
      )}
      ref={ref}
    >
      {children}
    </dialog>
  );
}

export default Modal;
