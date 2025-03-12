"use client";

import { useState } from "react";
import { SearchIcon } from "../common/Icon";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = async (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full">
      <div className="relative w-full">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search packages..."
          className="text-md w-full rounded-sm border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-300 md:text-sm"
        />
      </div>
    </div>
  );
}
