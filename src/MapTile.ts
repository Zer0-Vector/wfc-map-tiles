
export type CardinalDirection = "N" | "S" | "E" | "W";
export type Direction = CardinalDirection | (string & {});

export interface MapTile {
  id: string;
  name?: string;
  edges: Record<Direction, EdgeType>;
  fitsWith(tile: MapTile, edgeType: EdgeType): boolean;
}
