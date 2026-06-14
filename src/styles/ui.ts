export const ui = {
  page: "min-h-screen bg-neutral-950 pb-32 text-neutral-100",
  loginPage:
    "flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100",

  container: "mx-auto w-full max-w-md p-6",
  appHeader: "mb-6 flex items-center justify-between",

  title: "text-2xl font-bold",
  loginTitle: "mb-6 text-3xl font-bold",
  subtitle: "text-sm text-neutral-400",

  card: "mb-6 rounded border border-neutral-800 bg-neutral-900 p-4",
  cardPlain: "rounded border border-neutral-800 bg-neutral-900 p-4",
  innerCard: "rounded border border-neutral-800 bg-neutral-950 p-3",
  innerCardSpaced: "mb-4 rounded border border-neutral-800 bg-neutral-950 p-3",

  sectionHeader: "mb-3 flex items-center justify-between",
  sectionTitle: "font-bold",
  groupTitle: "mb-2 font-semibold",

  message:
    "mb-4 rounded border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-200",

  successMessage:
    "mb-4 rounded border border-green-700 bg-green-950/30 p-3 text-sm font-semibold text-green-400",

  dangerMessage:
    "mb-4 rounded border border-red-700 bg-red-950/30 p-3 text-sm font-semibold text-red-400",

  mutedText: "text-neutral-400",
  mutedTextSmall: "text-sm text-neutral-400",
  mutedTextXs: "text-xs text-neutral-500",
  bodyText: "text-sm text-neutral-300",

  input:
    "w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-neutral-100 outline-none placeholder:text-neutral-500",

  select:
    "w-full rounded border border-neutral-700 bg-neutral-950 p-3 text-neutral-100 outline-none",

  smallSelect:
    "mb-2 w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-neutral-100 outline-none disabled:bg-neutral-800 disabled:text-neutral-500",

  buttonPrimary: "w-full rounded bg-white p-3 font-semibold text-black",
  buttonBlue: "w-full rounded bg-blue-600 p-3 text-white",
  buttonGreen:
    "mt-2 w-full rounded bg-green-600 p-2 text-white disabled:bg-neutral-700 disabled:text-neutral-400",
  buttonSubmit:
    "w-full rounded bg-white p-3 font-semibold text-black disabled:bg-neutral-700 disabled:text-neutral-400",
  buttonYellow: "mt-2 w-full rounded bg-yellow-500 p-2 text-black",
  buttonOrange:
    "w-full rounded bg-orange-500 p-2 text-sm font-semibold text-white",
  buttonSmall:
    "rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-300",
  buttonLogout:
    "rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300",

  adminCard:
    "mb-6 rounded border border-yellow-700 bg-yellow-950/30 p-4",

  bottomNav:
    "fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950 p-2",
  bottomNavGrid: "mx-auto grid max-w-md grid-cols-3 gap-2",
};

export function sectionButtonClass(isActive: boolean) {
  return `rounded px-2 py-2 text-[11px] font-semibold ${
    isActive ? "bg-white text-black" : "bg-neutral-900 text-neutral-300"
  }`;
}