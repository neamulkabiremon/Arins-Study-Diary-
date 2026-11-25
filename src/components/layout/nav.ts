export const NAV_ITEMS = [
  {
    href: "/today",
    label: "Today",
    short: "Today",
    icon: "home" as const,
  },
  {
    href: "/tomorrow",
    label: "Plan Tomorrow",
    short: "Tomorrow",
    icon: "calendar" as const,
  },
  {
    href: "/rewards",
    label: "Rewards",
    short: "Rewards",
    icon: "gift" as const,
  },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
