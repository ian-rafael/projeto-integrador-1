import { type LoaderFunctionArgs, json } from "@remix-run/node";
import MenuButton from "~/components/MenuButton";
import { Frame, FrameHeader } from "~/components/frame";
import { requireUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  return json({ });
};

export default function App () {
  return (
    <Frame>
      <FrameHeader>
        <MenuButton/>
        <h2>Dashboard</h2>
      </FrameHeader>
    </Frame>
  );
}
