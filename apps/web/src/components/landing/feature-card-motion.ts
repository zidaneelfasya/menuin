import { Quaternion, Vector3 } from "three";

export type CardSide = "top" | "right" | "bottom" | "left";

/** Choose the nearest edge in normalized coordinates, including on rectangular cards. */
export function cardSide(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  clientX: number,
  clientY: number,
): CardSide {
  const x = (clientX - rect.left) / rect.width - 0.5;
  const y = (clientY - rect.top) / rect.height - 0.5;
  return Math.abs(x) > Math.abs(y)
    ? x < 0 ? "left" : "right"
    : y < 0 ? "top" : "bottom";
}

export function sideRotation(side: CardSide): Quaternion {
  const axis = side === "left" || side === "right"
    ? new Vector3(0, 1, 0)
    : new Vector3(1, 0, 0);
  const sign = side === "left" || side === "bottom" ? 1 : -1;
  return new Quaternion().setFromAxisAngle(axis, sign * Math.PI);
}

/** Follow the exit edge, while smoothly correcting any remaining orientation. */
export function exitRotation(start: Quaternion, side: CardSide, progress: number): Quaternion {
  const opposite: Record<CardSide, CardSide> = { top: "bottom", right: "left", bottom: "top", left: "right" };
  const fullTurn = sideRotation(opposite[side]);
  const turn = new Quaternion().slerp(fullTurn, progress);
  const end = fullTurn.clone().multiply(start);
  const correction = new Quaternion().slerp(end.clone().invert(), progress);
  return correction.multiply(turn).multiply(start).normalize();
}
