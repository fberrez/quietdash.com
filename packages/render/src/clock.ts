import { html } from "satori-html";
import type { SatoriNode } from "./types.js";

const pad = (n: number) => String(n).padStart(2, "0");

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Phase 0 dummy widget (the clock from the DECISIONS first milestone).
 * Plain mono, generous whitespace, a single hairline frame: the calm-object look.
 * Returns a satori-compatible node.
 */
export function clockScene(now: Date): SatoriNode {
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const date = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const node = html`
    <div
      style="display:flex;flex-direction:column;width:100%;height:100%;background:#ffffff;color:#000000;font-family:'IBM Plex Mono';padding:28px;"
    >
      <div
        style="display:flex;flex-direction:column;flex:1;border:2px solid #000000;align-items:center;justify-content:center;"
      >
        <div style="display:flex;font-size:200px;font-weight:700;line-height:1;letter-spacing:-6px;">
          ${time}
        </div>
        <div style="display:flex;font-size:30px;font-weight:400;margin-top:24px;">
          ${date}
        </div>
      </div>
      <div
        style="display:flex;justify-content:space-between;font-size:18px;font-weight:400;margin-top:16px;"
      >
        <div style="display:flex;">QuietDash</div>
        <div style="display:flex;">phase 0 · clock</div>
      </div>
    </div>
  `;
  // satori-html returns its internal VNode; satori accepts it at runtime.
  return node as SatoriNode;
}
