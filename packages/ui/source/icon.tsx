import { cn } from "utilities";

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: number;
}

export function Icon({
  name,
  className,
  size = 24,
  fill = false,
  weight = 400,
  grade = 0,
}: IconProps) {
  return (
    <span
      className={cn("material-symbols-rounded", className)}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
