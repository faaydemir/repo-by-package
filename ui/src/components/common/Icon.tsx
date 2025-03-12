type IconProps = {
  size?: number;
  className?: string;
};

export function SeachMenuIcon({ size = 5, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      stroke="currentColor"
    >
      <path d="m720-430 80 80v190q0 33-23.5 56.5T720-80H160q-33 0-56.5-23.5T80-160v-560q0-33 23.5-56.5T160-800h220q-8 18-12 38.5t-6 41.5H160v560h560v-270Zm52-174 128 128-56 56-128-128q-21 12-45 20t-51 8q-75 0-127.5-52.5T440-700q0-75 52.5-127.5T620-880q75 0 127.5 52.5T800-700q0 27-8 51t-20 45Zm-152 4q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29ZM160-430v270-560 280-12 22Z" />
    </svg>
  );
}

export function BackIcon({ size = 5, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

export function NextIcon({ size = 5, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export function AscendingSortIcon({ size = 4, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" />
    </svg>
  );
}

export function DescendingSortIcon({ size = 4, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <g transform="rotate(180,480,-480)">
        <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" />
      </g>
    </svg>
  );
}

export function SortIcon({ size = 4, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z" />
    </svg>
  );
}

export function OpenPageIcon({ size = 4, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      fill="#5f6368"
    >
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
    </svg>
  );
}

export function StarIcon({ size = 4, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      className={`${sizeClasses} ${className}`.trim()}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.327.668A.75.75 0 0 1 12 .25Z" />
    </svg>
  );
}

export function SearchIcon({ size = 5, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses} ${className}`.trim()}
      fill="currentColor"
      viewBox="0 -960 960 960"
    >
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
    </svg>
  );
}

export function PackageIcon({ size = 5, className = "" }: IconProps) {
  const sizeClasses = `h-${size} w-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses} ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-80 92L160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11Zm200-528 77-44-237-137-78 45 238 136Zm-160 93 78-45-237-137-78 45 237 137Z" />
    </svg>
  );
}
