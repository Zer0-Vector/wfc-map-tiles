import { LooseIntersection } from "./helpers/TypeHelpers";

type Direction = LooseIntersection<"N" | "S" | "E" | "W", string>;


export interface MapTile {
  id: string;
  name?: string;
  edges: Record<Direction, EdgeType>;
  fitsWith(tile: MapTile, edgeType: EdgeType): boolean;
}