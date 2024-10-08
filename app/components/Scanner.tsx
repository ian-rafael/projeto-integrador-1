import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useZxing } from "react-zxing";

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);

function Scanner ({ paused, onResult }: { paused: boolean; onResult: (code: string) => void }) {
  const {
    ref,
    torch: { on, off, status },
  } = useZxing({
    hints,
    onDecodeResult: (result) => {
      onResult(result.getText());
    },
    paused,

  });

  return (
    <div className="flex flex-col">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={ref} className="flex-1"/>
      <div className="flex justify-center">
        <button
          className={status === "unavailable" ? "opacity-25" : ""}
          disabled={status === "unavailable"}
          onClick={() => (status === "on" ? off() : on())}
          type="button"
        >
          {status === "on" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 13h-4v-2h4v2zm0-6.5l-3.094 2.188-1.084-1.5 3.094-2.188 1.084 1.5zm-1.084 12.5l-3.094-2.188 1.084-1.5 3.094 2.188-1.084 1.5zm-7.291-13c-1.886 0-4.062 3-6.751 3h-7.067c-.957.221-1.807 1.558-1.807 3.085 0 1.472.812 2.686 1.807 2.915h7.067c2.903 0 4.757 3 6.751 3h2.375v-12h-2.375zm-1.625 9.146c-2.459-1.649-2.878-2.146-5.126-2.146h-6.612c-.111-.145-.262-.458-.262-.915 0-.517.181-.9.312-1.085h6.562c2.107 0 2.648-.477 5.126-2.125v6.271zm2 .854h-1v-8h1v8zm-8-3.25c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 13zm0-6.5zm-1.084 12.5zm-7.291-13c-1.886 0-4.062 3-6.751 3h-7.067c-.957.221-1.807 1.558-1.807 3.085 0 1.472.812 2.686 1.807 2.915h7.067c2.903 0 4.757 3 6.751 3h2.375v-12h-2.375zm-1.625 9.146c-2.459-1.649-2.878-2.146-5.126-2.146h-6.612c-.111-.145-.262-.458-.262-.915 0-.517.181-.9.312-1.085h6.562c2.107 0 2.648-.477 5.126-2.125v6.271zm2 .854h-1v-8h1v8zm-8-3.25c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default Scanner;
