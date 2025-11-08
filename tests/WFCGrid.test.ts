import { describe, it, expect } from 'vitest';
import { WFCGrid } from '@/model/WFCGrid';

describe('WFCGrid', () => {
  it('should create a grid with specified dimensions', () => {
    const grid = new WFCGrid(3, 3);
    
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(3);
    expect(grid.cells).toHaveLength(9);
  });

  it('should initialize all cells as uncollapsed', () => {
    const grid = new WFCGrid(2, 2);
    
    for (const cell of grid.cells) {
      expect(cell.isCollapsed).toBe(false);
      expect(cell.possibleTiles).toHaveLength(0); // Will be populated when we set tileset
    }
  });

  it('should get cell at coordinates', () => {
    const grid = new WFCGrid(3, 3);
    
    const cell = grid.getCell(1, 1);
    expect(cell).toBeDefined();
    expect(cell?.x).toBe(1);
    expect(cell?.y).toBe(1);
  });

  it('should return undefined for out of bounds coordinates', () => {
    const grid = new WFCGrid(3, 3);
    
    expect(grid.getCell(-1, 0)).toBeUndefined();
    expect(grid.getCell(3, 0)).toBeUndefined();
    expect(grid.getCell(0, -1)).toBeUndefined();
    expect(grid.getCell(0, 3)).toBeUndefined();
  });

  it('should get neighbors of a cell', () => {
    const grid = new WFCGrid(3, 3);
    
    const neighbors = grid.getNeighbors(1, 1);
    expect(neighbors).toHaveLength(4);
    expect(neighbors.some(n => n.x === 0 && n.y === 1)).toBe(true); // W
    expect(neighbors.some(n => n.x === 2 && n.y === 1)).toBe(true); // E
    expect(neighbors.some(n => n.x === 1 && n.y === 0)).toBe(true); // N
    expect(neighbors.some(n => n.x === 1 && n.y === 2)).toBe(true); // S
  });

  it('should get fewer neighbors for edge cells', () => {
    const grid = new WFCGrid(3, 3);
    
    const cornerNeighbors = grid.getNeighbors(0, 0);
    expect(cornerNeighbors).toHaveLength(2);

    const edgeNeighbors = grid.getNeighbors(1, 0);
    expect(edgeNeighbors).toHaveLength(3);
  });
});
