import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const PEOPLE_COUNT = 5;

function PersonFigure({
  angle,
  cx,
  cy,
  radius,
  outward,
  color,
}: {
  angle: number;
  cx: number;
  cy: number;
  radius: number;
  outward: boolean;
  color: string;
}) {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const dir = outward ? 1 : -1;
  const headDist = dir * 12;
  const bodyDist = -dir * 5;
  const headX = x + headDist * Math.cos(angle);
  const headY = y + headDist * Math.sin(angle);
  const bodyX = x + bodyDist * Math.cos(angle);
  const bodyY = y + bodyDist * Math.sin(angle);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);
  const legEnd = -dir * 11;
  const legX = x + legEnd * Math.cos(angle);
  const legY = y + legEnd * Math.sin(angle);

  return (
    <g>
      <circle cx={headX} cy={headY} r={6} fill={color} />
      <line
        x1={x + dir * 5 * Math.cos(angle)}
        y1={y + dir * 5 * Math.sin(angle)}
        x2={legX}
        y2={legY}
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <line
        x1={bodyX + perpX * 7}
        y1={bodyY + perpY * 7}
        x2={bodyX - perpX * 7}
        y2={bodyY - perpY * 7}
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <line
        x1={legX}
        y1={legY}
        x2={legX + perpX * 5 - dir * 3.5 * Math.cos(angle)}
        y2={legY + perpY * 5 - dir * 3.5 * Math.sin(angle)}
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <line
        x1={legX}
        y1={legY}
        x2={legX - perpX * 5 - dir * 3.5 * Math.cos(angle)}
        y2={legY - perpY * 5 - dir * 3.5 * Math.sin(angle)}
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
    </g>
  );
}

export function OpenIcon({ size = 48, color = "currentColor", className }: IconProps) {
  const cx = 50;
  const cy = 50;
  const radius = 26;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {Array.from({ length: PEOPLE_COUNT }).map((_, i) => {
        const angle = (2 * Math.PI * i) / PEOPLE_COUNT - Math.PI / 2;
        return (
          <PersonFigure
            key={i}
            angle={angle}
            cx={cx}
            cy={cy}
            radius={radius}
            outward={true}
            color={color}
          />
        );
      })}
    </svg>
  );
}

export function PrivateIcon({ size = 48, color = "currentColor", className }: IconProps) {
  const cx = 50;
  const cy = 50;
  const radius = 26;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {Array.from({ length: PEOPLE_COUNT }).map((_, i) => {
        const angle = (2 * Math.PI * i) / PEOPLE_COUNT - Math.PI / 2;
        return (
          <PersonFigure
            key={i}
            angle={angle}
            cx={cx}
            cy={cy}
            radius={radius}
            outward={false}
            color={color}
          />
        );
      })}
    </svg>
  );
}
