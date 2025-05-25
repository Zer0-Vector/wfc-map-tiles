type Direction = "N" | "S" | "E" | "W";

interface MapTile {
  id: string;
  name?: string;
  edges: Record<Direction, TileEdge>;
  edge(edgeDirection: Direction): TileEdge;
}