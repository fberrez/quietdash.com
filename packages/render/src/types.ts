/** The node type satori accepts as its first argument. */
export type SatoriNode = Parameters<(typeof import("satori"))["default"]>[0];
