import { ui } from "@/styles/ui";

type MessagesAreaProps = {
  message: string;
  isSubmitted: boolean;
  isQuinielaOpen: boolean;
};

export function MessagesArea({
  message,
  isSubmitted,
  isQuinielaOpen,
}: MessagesAreaProps) {
  return (
    <>
      {message && <p className={ui.message}>{message}</p>}

      {isSubmitted && (
        <p className={ui.successMessage}>
          Quiniela enviada. Tus picks están bloqueados.
        </p>
      )}

      {!isQuinielaOpen && (
        <p className={ui.dangerMessage}>
          La quiniela está cerrada. Ya no se pueden guardar ni enviar picks.
        </p>
      )}
    </>
  );
}