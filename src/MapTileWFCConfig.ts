import type { EdgeType } from "./EdgeType";
import type { MapTile } from "./MapTile";

export interface MapTileWFCConfig {
  tiles: MapTile[];
  edgeTypes: EdgeType[];
}