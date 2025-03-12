"use client";

import { Sort } from "@/client";
import { AscendingSortIcon, DescendingSortIcon, SortIcon } from "./Icon";

interface SortButtonProps {
  label: string;
  type: string;
  activeSort: Sort;
  onClick: (sort: Sort) => void;
}

export function SortButton({
  label,
  type,
  activeSort,
  onClick,
}: SortButtonProps) {
  const isActive = activeSort.field === type;
  const isAscending = isActive && activeSort.direction === "asc";
  const isDescending = isActive && activeSort.direction === "desc";

  const handleClick = () => {
    if (!isActive) {
      onClick({ field: type, direction: "desc" });
    } else {
      onClick({
        field: type,
        direction: activeSort.direction === "desc" ? "asc" : "desc",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-sm px-2 py-1 text-xs font-semibold transition-colors ${
        isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      } `}
    >
      <span>{label}</span>
      {isActive ? (
        <>
          {isAscending && <AscendingSortIcon />}
          {isDescending && <DescendingSortIcon />}
        </>
      ) : (
        <SortIcon />
      )}
    </button>
  );
}
