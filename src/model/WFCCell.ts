import type { TileDefinition } from './TileDefinition';

export class WFCCell {
  private readonly _possibleTiles: Set<TileDefinition>;
  private _collapsed: boolean = false;
  private _finalTile?: TileDefinition;
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y = 0, possibleTiles?: TileDefinition[]) {
    this.x = x;
    this.y = y;
    this._possibleTiles = new Set(possibleTiles || []);
  }

  get possibleTiles(): TileDefinition[] {
    return Array.from(this._possibleTiles);
  }

  get isCollapsed(): boolean {
    return this._collapsed;
  }

  get finalTile(): TileDefinition | undefined {
    return this._finalTile;
  }

  get collapsedTile(): TileDefinition | undefined {
    return this._finalTile;
  }

  get entropy(): number {
    return this._possibleTiles.size;
  }

  collapse(specificTile?: TileDefinition): boolean {
    if (this._collapsed || this._possibleTiles.size === 0) {
      return false;
    }

    if (specificTile) {
      // Collapse to specific tile if provided and it's possible
      if (!this._possibleTiles.has(specificTile)) {
        return false;
      }
      this._finalTile = specificTile;
    } else {
      // Random selection from possible tiles
      const tilesArray = Array.from(this._possibleTiles);
      const randomIndex = Math.floor(Math.random() * tilesArray.length);
      this._finalTile = tilesArray[randomIndex];
    }

    this._collapsed = true;
    this._possibleTiles.clear();
    this._possibleTiles.add(this._finalTile);

    return true;
  }

  removePossibility(tile: TileDefinition): boolean {
    if (this._collapsed) {
      return false;
    }
    return this._possibleTiles.delete(tile);
  }

  constrainTo(allowedTiles: TileDefinition[]): boolean {
    const allowedSet = new Set(allowedTiles);
    const initialSize = this._possibleTiles.size;
    
    // Remove tiles that are not in the allowed set
    for (const tile of this._possibleTiles) {
      if (!allowedSet.has(tile)) {
        this._possibleTiles.delete(tile);
      }
    }

    // Return true if constraints were applied
    return this._possibleTiles.size < initialSize;
  }

  isValid(): boolean {
    return this._possibleTiles.size > 0;
  }

  setPossibleTiles(tiles: TileDefinition[]): void {
    this._possibleTiles.clear();
    for (const tile of tiles) {
      this._possibleTiles.add(tile);
    }
    this._collapsed = false;
    this._finalTile = undefined;
  }
}