export interface MapTile {
  id: string;
  name?: string;
  edges: Record<string, TileEdge>;
  fitsWith(tile: MapTile, edgeId: string): boolean;
}