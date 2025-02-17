import { cn } from '@/lib/utils';

interface PackageTagProps  {
  name: string;
  repoCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Generates a pastel color based on the input text.
 * The algorithm hashes the text to generate a hue value,
 * then uses fixed saturation and lightness values to ensure a pastel tone.
 *
 * @param text - The input string to generate a color for.
 * @returns A hex string representing a pastel color.
 */
const uniqueColorGenerator = (text: string): string => {
  // Generate a hash from the text.
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to determine a hue value between 0 and 360.
  const hue = Math.abs(hash) % 360;
  // Fixed saturation and lightness for pastel colors.
  const saturation = 70;
  const lightness = 80;

  return hslToHex(hue, saturation, lightness);
};

/**
 * Converts an HSL color value to a HEX color string.
 *
 * @param h - Hue degree (0 - 360)
 * @param s - Saturation percentage (0 - 100)
 * @param l - Lightness percentage (0 - 100)
 * @returns A hex color string.
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else if (h >= 300 && h < 360) {
    r1 = c; g1 = 0; b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  // Helper to convert a number to a 2-digit hex string.
  const toHex = (n: number): string => n.toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const REPO_NAME_MAX_LENGTH = 100;

export function PackageTag({ name, repoCount, size = 'md', className }: PackageTagProps) {
  const sizeClasses = {
    sm: 'py-0.5 text-xs',
    md: 'py-2 text-sm',
    lg: 'py-2.5 text-base'
  };
  const color = uniqueColorGenerator(name);
  
  if (name.length > REPO_NAME_MAX_LENGTH) {
    name = name.slice(0, REPO_NAME_MAX_LENGTH) + '...';
  }

  return (
    <div
      className={cn(
        'group inline-flex items-center justify-between rounded-sm font-medium transition-all duration-200',
        'hover:bg-opacity-80 text-gray-700',
        'bg-opacity-100 hover:bg-opacity-100',
        'border',
        'relative pl-7 pr-3',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color+'10' || '#94a3b8' }}
    >
      <div 
        className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-200"
        style={{ backgroundColor: color || '#94a3b8' }}
      />
      <span className="tracking-tight truncate">{name}</span>
      {repoCount !== undefined && (
        <span 
          className="text-xs opacity-75 font-normal ml-2 shrink-0"
        >
          {repoCount}
        </span>
      )}
      <div 
        className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"
      />
    </div>
  );
}
