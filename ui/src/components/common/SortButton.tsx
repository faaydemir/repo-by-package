'use client';

import { Sort } from '@/client';

interface SortButtonProps {
  label: string;
  type: string;
  activeSort: Sort;
  onClick: (sort: Sort) => void;
}

const ascendingSvg = <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" /></svg>
const descendingSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <g transform="rotate(180,480,-480)">
      <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" />
    </g>
  </svg>
);
const nullSvg = <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z" /></svg>;


export function SortButton({ label, type, activeSort, onClick }: SortButtonProps) {
  const isActive = activeSort.field === type;
  const isAscending = isActive && activeSort.direction === 'asc';
  const isDescending = isActive && activeSort.direction === 'desc';

  const handleClick = () => {
    if (!isActive) {
      onClick({ field: type, direction: 'desc' });
    } else {
      onClick({
        field: type,
        direction: activeSort.direction === 'desc' ? 'asc' : 'desc'
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2
        px-2 py-1 text-xs font-semibold
        rounded-sm transition-colors
        ${isActive
          ? 'bg-gray-200 text-gray-900'
          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
        }
      `}
    >
      <span>{label}</span>
      {
        isActive
          ? <>
            {isAscending && ascendingSvg}
            {isDescending && descendingSvg}
          </>
          : nullSvg
      }
    </button>
  );
}
