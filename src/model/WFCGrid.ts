import type { TileDefinition } from './TileDefinition';
import { WFCCell } from './WFCCell';
import type { EdgeType } from './EdgeType';
import { CardinalDirection, CardinalDirectionValues } from './MapTile';

export interface GridPosition {
  x: number;
  y: number;
}

export class WFCGrid {
  private readonly grid: WFCCell[][]; // column-major order, i.e. grid[y][x]
  private readonly _width: number;
  private readonly _height: number;
  private _allTiles: TileDefinition[] = [];

  constructor(width: number, height: number, tiles?: TileDefinition[]) {
    this._width = width;
    this._height = height;
    this._allTiles = tiles || [];
    
    // Initialize grid with all possible tiles
    this.grid = new Array(height).fill(null).map((_, y) =>
      new Array(width).fill(null).map((_, x) => new WFCCell(x, y, this._allTiles))
    );
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get cells(): WFCCell[] {
    return this.grid.flat();
  }

  get allTiles(): TileDefinition[] {
    return this._allTiles;
  }

  setTileSet(tiles: TileDefinition[]): void {
    this._allTiles = tiles;
    // Update all cells with new possible tiles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Reset cell with new tiles
        this.grid[y][x] = new WFCCell(x, y, tiles);
      }
    }
  }

  getCell(x: number, y: number): WFCCell | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    return this.grid[y][x];
  }

  getNeighbor(x: number, y: number, direction: CardinalDirection): WFCCell | undefined {
    const offset = CardinalDirection[direction].offset;
    return this.getCell(x + offset.x, y + offset.y);
  }

  getNeighbors(x: number, y: number): WFCCell[] {
    const neighbors: WFCCell[] = [];
    
    for (const direction of CardinalDirectionValues) {
      const neighbor = this.getNeighbor(x, y, direction);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }

  getLowestEntropyCell(): GridPosition | null {
    let minEntropy = Infinity;
    let candidates: GridPosition[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        if (!cell.isCollapsed && cell.entropy > 0) {
          if (cell.entropy < minEntropy) {
            minEntropy = cell.entropy;
            candidates = [{ x, y }];
          } else if (cell.entropy === minEntropy) {
            candidates.push({ x, y });
          }
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Random selection among candidates with same entropy
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  propagateConstraints(startX: number, startY: number): boolean {
    const queue: GridPosition[] = [{ x: startX, y: startY }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;
      
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      const cell = this.getCell(x, y);
      if (!cell) continue;

      // Check each direction
      for (const direction of CardinalDirectionValues) {
        const neighbor = this.getNeighbor(x, y, direction);
        if (!neighbor || neighbor.isCollapsed) continue;

        // Get compatible tiles for this direction
        const compatibleTiles = this.getCompatibleTiles(cell, direction);
        const wasConstrained = neighbor.constrainTo(compatibleTiles);

        if (wasConstrained) {
          if (!neighbor.isValid()) {
            return false; // Contradiction found
          }
          
          // Add neighbor to queue for further propagation
          const offset = CardinalDirection[direction].offset;
          queue.push({ x: x + offset.x, y: y + offset.y });
        }
      }
    }

    return true;
  }

  private getCompatibleTiles(cell: WFCCell, direction: CardinalDirection): TileDefinition[] {
    const compatible: TileDefinition[] = [];

    for (const neighborTile of this.allTiles) {
      for (const cellTile of cell.possibleTiles) {
        if (this.tilesCanConnect(cellTile, neighborTile, direction)) {
          if (!compatible.includes(neighborTile)) {
            compatible.push(neighborTile);
          }
        }
      }
    }

    return compatible;
  }  

  private tilesCanConnect(tile1: TileDefinition, tile2: TileDefinition, direction: CardinalDirection): boolean {
    const oppositeDirection = CardinalDirection[direction].opposite;
    const edge1 = tile1.edges[direction];
    const edge2 = tile2.edges[oppositeDirection];
    
    return this.edgesMatch(edge1, edge2);
  }

  private edgesMatch(edge1: EdgeType, edge2: EdgeType): boolean {
    // Simple match - edges must have same ID
    if (edge1.id === edge2.id) {
      return true;
    }

    // Check if edges have matching constraints
    if (edge1.matches?.includes(edge2.id)) {
      return true;
    }
    if (edge2.matches?.includes(edge1.id)) {
      return true;
    }

    return false;
  }

  isComplete(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[y][x].isCollapsed) {
          return false;
        }
      }
    }
    return true;
  }

  isValid(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[y][x].isValid()) {
          return false;
        }
      }
    }
    return true;
  }
}