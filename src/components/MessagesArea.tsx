import { ui } from "@/styles/ui";

type MessagesAreaProps = {
  message: string;
};

export function MessagesArea({ message }: MessagesAreaProps) {
  if (!message) {
    return null;
  }

  return <p className={ui.message}>{message}</p>;
}