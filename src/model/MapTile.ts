import type { EdgeType } from "./EdgeType";

export type CardinalDirection = "N" | "S" | "E" | "W";
export type Direction = CardinalDirection | (string & {});

export type TileEdgeMap = { 
  [key in CardinalDirection]: EdgeType
} & Record<string, EdgeType>;

export interface MapTile {
  id: string;
  name?: string;
  edges: TileEdgeMap;
  fitsWith(tile: MapTile, edgeType: EdgeType): boolean;
}
