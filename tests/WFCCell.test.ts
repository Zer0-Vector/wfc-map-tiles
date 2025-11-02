import { describe, it, expect } from 'vitest';
import { WFCCell } from '@/model/WFCCell';
import { TileDefinition } from '@/model/TileDefinition';
import type { TileEdgeMap } from '@/model/MapTile';

describe('WFCCell', () => {
  it('should create a cell with coordinates', () => {
    const cell = new WFCCell(2, 3);
    
    expect(cell.x).toBe(2);
    expect(cell.y).toBe(3);
    expect(cell.isCollapsed).toBe(false);
    expect(cell.collapsedTile).toBeUndefined();
    expect(cell.possibleTiles).toHaveLength(0);
  });

  it('should initialize with possible tiles', () => {
    const tile1 = new TileDefinition({ id: 'tile1', edges: {} as TileEdgeMap });
    const tile2 = new TileDefinition({ id: 'tile2', edges: {} as TileEdgeMap });
    const possibleTiles = [tile1, tile2];

    const cell = new WFCCell(0, 0, possibleTiles);
    
    expect(cell.possibleTiles).toHaveLength(2);
    expect(cell.possibleTiles).toContain(tile1);
    expect(cell.possibleTiles).toContain(tile2);
  });

  it('should collapse to a specific tile', () => {
    const tile1 = new TileDefinition({ id: 'tile1', edges: {} as TileEdgeMap });
    const tile2 = new TileDefinition({ id: 'tile2', edges: {} as TileEdgeMap });
    const cell = new WFCCell(0, 0, [tile1, tile2]);

    cell.collapse(tile1);

    expect(cell.isCollapsed).toBe(true);
    expect(cell.collapsedTile).toBe(tile1);
    expect(cell.possibleTiles).toHaveLength(1);
    expect(cell.possibleTiles[0]).toBe(tile1);
  });

  it('should remove impossible tiles', () => {
    const tile1 = new TileDefinition({ id: 'tile1', edges: {} as TileEdgeMap });
    const tile2 = new TileDefinition({ id: 'tile2', edges: {} as TileEdgeMap });
    const tile3 = new TileDefinition({ id: 'tile3', edges: {} as TileEdgeMap });
    const cell = new WFCCell(0, 0, [tile1, tile2, tile3]);

    cell.removePossibility(tile2);

    expect(cell.possibleTiles).toHaveLength(2);
    expect(cell.possibleTiles).toContain(tile1);
    expect(cell.possibleTiles).toContain(tile3);
    expect(cell.possibleTiles).not.toContain(tile2);
  });

  it('should calculate entropy (number of possible tiles)', () => {
    const tile1 = new TileDefinition({ id: 'tile1', edges: {} as TileEdgeMap });
    const tile2 = new TileDefinition({ id: 'tile2', edges: {} as TileEdgeMap });
    const tile3 = new TileDefinition({ id: 'tile3', edges: {} as TileEdgeMap });
    const cell = new WFCCell(0, 0, [tile1, tile2, tile3]);

    expect(cell.entropy).toBe(3);

    cell.removePossibility(tile1);
    expect(cell.entropy).toBe(2);

    cell.collapse(tile2);
    expect(cell.entropy).toBe(1);
  });
});