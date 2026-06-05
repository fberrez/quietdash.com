import { writeFileSync } from "node:fs";
import { renderClockPng } from "./index.js";

const t0 = Date.now();
const png = await renderClockPng(new Date(2026, 5, 5, 9, 41));
const ms = Date.now() - t0;
const out = "/tmp/qd-clock.out.png";
writeFileSync(out, png);
const w = png.readUInt32BE(16);
const h = png.readUInt32BE(20);
console.log(`OK rendered ${png.length} bytes, ${w}x${h}, in ${ms}ms -> ${out}`);
