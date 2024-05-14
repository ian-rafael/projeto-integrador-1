import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useZxing } from "react-zxing";

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);

function Scanner ({ paused, onResult }: { paused: boolean; onResult: (code: string) => void }) {
  const { ref } = useZxing({
    hints,
    onDecodeResult: (result) => {
      onResult(result.getText());
    },
    paused,
  });

  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video ref={ref} />;
}

export default Scanner;
