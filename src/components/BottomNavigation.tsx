"use client";

import { sectionButtonClass, ui } from "@/styles/ui";
import type { SectionId } from "@/types/sections";

type BottomNavigationProps = {
  activeSection: SectionId;
  isAdmin: boolean;
  onSectionChange: (section: SectionId) => void;
};

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "ranking", label: "Ranking" },
  { id: "actual", label: "Actual" },
  { id: "historial", label: "Historial" },
  { id: "picks", label: "Picks" },
  { id: "admin", label: "Admin" },
];

export function BottomNavigation({
  activeSection,
  isAdmin,
  onSectionChange,
}: BottomNavigationProps) {
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.id === "admin") {
      return isAdmin;
    }

    return true;
  });

  return (
    <nav className={ui.bottomNav}>
      <div className={ui.bottomNavGrid}>
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={sectionButtonClass(activeSection === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}