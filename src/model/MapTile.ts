import type { EdgeType } from "./EdgeType";

export const CardinalDirectionValues = ["N", "E", "S", "W"] as const;
export type CardinalDirection = typeof CardinalDirectionValues[number];
export const CardinalDirection = {
  N: {
    opposite: "S",
    offset: { x: 0, y: -1 }
  },
  E: {
    opposite: "W",
    offset: { x: 1, y: 0 }
  },
  S: {
    opposite: "N",
    offset: { x: 0, y: 1 }
  },
  W: {
    opposite: "E",
    offset: { x: -1, y: 0 }
  }
} as const;

export type Direction = CardinalDirection | (string & {});

export type TileEdgeMap = { 
  [key in CardinalDirection]: EdgeType
};

export interface MapTile {
  id: string;
  name?: string;
  edges: TileEdgeMap;
  fitsWith(tile: MapTile, edgeType: EdgeType): boolean;
}
