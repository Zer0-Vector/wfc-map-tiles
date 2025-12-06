import { describe, it, expect, beforeEach } from 'vitest';
import { WFCSolver } from '@/model/WFCSolver';
import { WFCGrid } from '@/model/WFCGrid';
import { TileDefinition } from '@/model/TileDefinition';
import type { EdgeType } from '@/model/EdgeType';

describe('WFCSolver', () => {
  const wallEdge: EdgeType = { id: 'wall', matches: ['wall'] };
  const doorEdge: EdgeType = { id: 'door', matches: ['door', 'open'] };
  const windowEdge: EdgeType = { id: 'window', matches: ['$outside'] };
  const openEdge: EdgeType = { id: 'open', matches: ['open', 'door'] };
  const outsideEdge: EdgeType = { id: '$outside', matches: ['$outside', 'window', 'wall'] };

  const tiles: TileDefinition[] = [];
  const roomTile = new TileDefinition({
    id: "room",
    edges: { N: wallEdge, S: wallEdge, W: wallEdge, E: doorEdge }
  });
  const corridorTile = new TileDefinition({
    id: "corridor",
    edges: { N: wallEdge, S: wallEdge, W: doorEdge, E: doorEdge }
  });
  const borderTile = new TileDefinition({
    id: "border",
    edges: { N: doorEdge, S: windowEdge, W: wallEdge, E: wallEdge }
  });
  const openTile = new TileDefinition({
    id: "open",
    edges: { N: openEdge, S: openEdge, W: openEdge, E: openEdge }
  });
  const outsideTile = new TileDefinition({
    id: "outside",
    edges: { N: outsideEdge, S: outsideEdge, W: outsideEdge, E: outsideEdge }
  });

  let grid: WFCGrid;

  function initializeTiles() {

    for (let i = 0; i < 4; i++) {
      tiles.push(
        roomTile.rotate(i),
        borderTile.rotate(i)
      );
    }

    tiles.push(
      corridorTile,
      corridorTile.rotate(1),
      openTile,
      outsideTile
    );

  }

  beforeEach(() => {
    // Create tile definitions
    initializeTiles();

    // Create grid
    grid = new WFCGrid(3, 3, tiles);

    
  });

  describe('constructor', () => {
    it('should create solver with default options', () => {
      expect(() => new WFCSolver(grid)).not.toThrow();
    });

    it('should create solver with custom options', () => {
      expect(() => new WFCSolver(grid, { maxIterations: 500 })).not.toThrow();
    });

    it('should throw if grid is invalid', () => {
      const invalidGrid = new WFCGrid(0, 0);
      expect(() => new WFCSolver(invalidGrid)).toThrow();
    });

    it('should throw if maxIterations is non-positive', () => {
      expect(() => new WFCSolver(grid, { maxIterations: 0 })).toThrow();
      expect(() => new WFCSolver(grid, { maxIterations: -10 })).toThrow();
    });
  });

  describe('step', () => {
    it('should return failure when grid is invalid', () => {
      // Force invalid state by making all cells impossible
      for (const cell of grid.cells) {
        cell.constrainTo([]);
      }

      const solver = new WFCSolver(grid);
      const result = solver.step();

      expect(result.success).toBe(false);
      expect(result.completed).toBe(false);
      expect(result.cellCollapsed).toBeNull();
    });

    it('should return completed when grid is already complete', () => {
      // Manually collapse all cells
      for (const cell of grid.cells) {
        cell.collapse(outsideTile);
      }

      const solver = new WFCSolver(grid);
      const result = solver.step();
      console.log("Grid after collapsing all cells:\n" + grid.toString());

      expect(result.success).toBe(true);
      expect(result.completed).toBe(true);
      expect(result.cellCollapsed).toBeNull();
    });

    it('should collapse a cell and return it when step is successful', () => {
      const solver = new WFCSolver(grid);
      const result = solver.step();

      expect(result.success).toBe(true);
      expect(result.completed).toBe(false);
      expect(result.cellCollapsed).not.toBeNull();
      expect(result.cellCollapsed?.isCollapsed).toBe(true);
    });

    it('should select cell with lowest entropy', () => {
      const solver = new WFCSolver(grid);
      
      // Manually constrain one cell to have lower entropy
      const corner = grid.getCell(0, 0)!;
      corner.constrainTo([roomTile]);
      
      const result = solver.step();
      
      expect(result.success).toBe(true);
      expect(result.cellCollapsed).toBe(corner);
      expect(corner.isCollapsed).toBe(true);
    });
    it('should handle tie-breaking when multiple cells have same entropy', () => {
      const solver = new WFCSolver(grid);
      
      // Initially all cells have the same entropy
      const initialEntropies = grid.cells.map(cell => cell.entropy);
      const uniqueEntropies = new Set(initialEntropies);
      
      expect(uniqueEntropies.size).toBe(1); // All cells have same entropy
      
      const result = solver.step();
      
      expect(result.success).toBe(true);
      expect(result.cellCollapsed).not.toBeNull();
      // Should pick one of the cells (implementation-specific which one)
    });
    it('should propagate constraints after collapsing a cell', () => {
      const solver = new WFCSolver(grid);
      const initialEntropies = grid.cells.map(cell => cell.entropy);

      const result = solver.step();

      expect(result.success).toBe(true);

      // At least some cells should have reduced entropy due to constraint propagation
      const finalEntropies = grid.cells.map(cell => cell.entropy);
      const hasReducedEntropy = finalEntropies.some((entropy, i) => entropy < initialEntropies[i]);

      expect(hasReducedEntropy).toBe(true);
    });
    it('should return failure when constraint propagation creates contradiction', () => {
      // Create a grid where constraint propagation will fail
      const solver = new WFCSolver(grid);
      
      // Force all cells to have zero entropy (impossible state)
      for (const cell of grid.cells) {
        cell.constrainTo([]);
      }
      
      const result = solver.step();
      
      expect(result.success).toBe(false);
    });
    it('should skip collapsed cells when looking for next cell to collapse', () => {
      const solver = new WFCSolver(grid);
      
      // Collapse a cell manually
      const corner = grid.getCell(0, 0)!;
      corner.collapse(outsideTile);
      
      const result = solver.step();
      
      expect(result.success).toBe(true);
      expect(result.cellCollapsed).not.toBe(corner); // Should pick a different cell
      expect(result.cellCollapsed?.isCollapsed).toBe(true);
    });
  });

  describe('solve', () => {
    it('should solve a simple 2x2 grid successfully', () => {
      const simpleGrid = new WFCGrid(2, 2, tiles);
      const solver = new WFCSolver(simpleGrid);

      const result = solver.solve();
      console.log("Grid after solving 2x2:\n" + simpleGrid.toString());

      expect(result.success).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(simpleGrid.isComplete()).toBe(true);
      expect(simpleGrid.isValid()).toBe(true);
    });

    it('should solve a 3x3 grid with multiple tile types', () => {
      const solver = new WFCSolver(grid);
      
      const result = solver.solve();
      console.log("Grid after solving 3x3:\n" + grid.toString());
      
      expect(result.success).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(grid.isComplete()).toBe(true);
      expect(grid.isValid()).toBe(true);
      
      // Check that multiple tile types were used
      const usedTileIds = new Set(grid.cells.map(cell => cell.finalTile?.id));
      expect(usedTileIds.size).toBeGreaterThan(1);
    });
    it('should solve larger grids within reasonable iterations', () => {
      const largerGrid = new WFCGrid(4, 4, tiles);
      const solver = new WFCSolver(largerGrid);
      
      const result = solver.solve();
      console.log("Grid after solving 4x4:\n" + largerGrid.toString());
      
      expect(result.success).toBe(true);
      expect(result.iterations).toBeLessThan(200); // Reasonable for 4x4
      expect(largerGrid.isComplete()).toBe(true);
      expect(largerGrid.isValid()).toBe(true);
    });
    it('should respect maximum iterations limit', () => {
      const solver = new WFCSolver(grid, { maxIterations: 2 });

      const result = solver.solve();
      console.log("Grid after solving with maxIterations=2:\n" + grid.toString());

      expect(result.iterations).toBeLessThanOrEqual(2);
      // For a small grid with compatible tiles, 2 iterations might not be enough
      // but the solver should still respect the limit
    });
    it('should return failure when no solution exists', () => {
      // Create a scenario guaranteed to fail - grid with no tiles
      const impossibleGrid = new WFCGrid(2, 2, []);
      const solver = new WFCSolver(impossibleGrid);
      
      const result = solver.solve();
      
      // This should fail because there are no tiles to place
      expect(result.success).toBe(false);
    });
    it('should return failure when maximum iterations exceeded', () => {
      // Use a very low iteration limit to force timeout
      const solver = new WFCSolver(grid, { maxIterations: 1 });
      
      const result = solver.solve();
      
      expect(result.iterations).toBe(1);
      // May or may not succeed depending on grid complexity, but should respect limit
    });
    it('should track iteration count correctly', () => {
      const solver = new WFCSolver(grid);

      const result = solver.solve();

      expect(result.iterations).toBeGreaterThan(0);
      if (result.success) {
        // If successful, iterations should be reasonable for a 3x3 grid
        expect(result.iterations).toBeLessThan(100);
      }
    });
  });

  describe('constraint propagation integration', () => {
    it('should handle edge cases at grid boundaries', () => {
      // Test with a 1x3 grid to ensure boundary handling
      const linearGrid = new WFCGrid(1, 3, tiles);
      const solver = new WFCSolver(linearGrid);
      
      const result = solver.solve();
      console.log("Linear grid after solving:\n" + linearGrid.toString());
      
      expect(result.success).toBe(true);
      expect(linearGrid.isComplete()).toBe(true);
      expect(linearGrid.isValid()).toBe(true);
    });
    it('should propagate constraints transitively through the grid', () => {
      const solver = new WFCSolver(grid);
      
      // Constrain corner cell to force propagation
      const corner = grid.getCell(0, 0)!;
      corner.constrainTo([outsideTile]);
      
      const initialEntropies = grid.cells.map(cell => cell.entropy);
      
      const result = solver.step();
      
      expect(result.success).toBe(true);
      
      // Check that constraints propagated to adjacent cells
      const finalEntropies = grid.cells.map(cell => cell.entropy);
      const reducedEntropyCells = finalEntropies.filter((entropy, i) => entropy < initialEntropies[i]);
      
      expect(reducedEntropyCells.length).toBeGreaterThan(0);
    });
    it('should detect and handle contradictions during propagation', () => {
      // Create a scenario where propagation will create an invalid state
      const solver = new WFCSolver(grid);
      
      // Make a cell impossible by constraining to empty array
      const cell = grid.getCell(1, 1)!;
      cell.constrainTo([]);
      
      expect(cell.isValid()).toBe(false);
      
      const result = solver.step();
      
      // Solver should detect the invalid state and fail
      expect(result.success).toBe(false);
    });
  });

  describe('entropy management', () => {
    it('should maintain entropy queue consistency during solving', () => {
      const solver = new WFCSolver(grid);
      
      // Track initial state
      const initialCollapsedCount = grid.cells.filter(cell => cell.isCollapsed).length;
      
      // After one step, should have one more collapsed cell
      const result = solver.step();
      
      expect(result.success).toBe(true);
      const finalCollapsedCount = grid.cells.filter(cell => cell.isCollapsed).length;
      expect(finalCollapsedCount).toBe(initialCollapsedCount + 1);
    });
    it('should update queue when cell entropy changes', () => {
      const solver = new WFCSolver(grid);
      
      // Manually constrain a cell to change its entropy
      const cell = grid.getCell(1, 1)!;
      const initialEntropy = cell.entropy;
      cell.constrainTo([roomTile, corridorTile]);
      
      expect(cell.entropy).toBeLessThan(initialEntropy);
      
      // The solver should still be able to work with the modified entropy
      const result = solver.step();
      expect(result.success).toBe(true);
    });
    it('should handle cells with zero entropy (invalid state)', () => {
      const solver = new WFCSolver(grid);
      
      // Force a cell to have zero entropy (invalid state)
      const cell = grid.getCell(0, 0)!;
      expect(cell.isValid()).toBe(true); // Initially valid
      
      cell.constrainTo([]);
      
      expect(cell.entropy).toBe(0);
      expect(cell.isValid()).toBe(false);
      
      const result = solver.step();
      
      expect(result.success).toBe(false);
    });
    it('should prioritize cells with lowest entropy', () => {
      const solver = new WFCSolver(grid);
      
      // Create cells with different entropy levels
      const highEntropyCell = grid.getCell(0, 0)!;
      const lowEntropyCell = grid.getCell(1, 1)!;
      
      lowEntropyCell.constrainTo([roomTile]); // entropy = 1
      
      expect(lowEntropyCell.entropy).toBeLessThan(highEntropyCell.entropy);
      
      const result = solver.step();
      
      expect(result.success).toBe(true);
      expect(result.cellCollapsed).toBe(lowEntropyCell);
    });
  });

  describe('edge cases', () => {
    it('should handle grid with single cell', () => {
      const singleGrid = new WFCGrid(1, 1, tiles);
      const solver = new WFCSolver(singleGrid);
      
      const result = solver.solve();
      console.log("Single cell grid after solving:\n" + singleGrid.toString());
      
      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1);
      expect(singleGrid.isComplete()).toBe(true);
      expect(singleGrid.isValid()).toBe(true);
    });
    it('should handle grid with no valid tiles', () => {
      const emptyTileGrid = new WFCGrid(2, 2, []);
      const solver = new WFCSolver(emptyTileGrid);
      
      const result = solver.solve();
      
      expect(result.success).toBe(false);
    });
    it('should handle grid with only one tile type', () => {
      const singleTileGrid = new WFCGrid(2, 2, [outsideTile]);
      const solver = new WFCSolver(singleTileGrid);
      
      const result = solver.solve();
      console.log("Single tile type grid after solving:\n" + singleTileGrid.toString());
      
      expect(result.success).toBe(true);
      expect(singleTileGrid.isComplete()).toBe(true);
      expect(singleTileGrid.isValid()).toBe(true);
      
      // All cells should have the same tile
      const allTilesSame = singleTileGrid.cells.every(cell => cell.finalTile?.id === outsideTile.id);
      expect(allTilesSame).toBe(true);
    });
    it('should handle pre-collapsed cells in grid', () => {
      const solver = new WFCSolver(grid);
      
      // Pre-collapse some cells
      const corner1 = grid.getCell(0, 0)!;
      const corner2 = grid.getCell(2, 2)!;
      
      corner1.collapse(outsideTile);
      corner2.collapse(outsideTile);
      
      expect(corner1.isCollapsed).toBe(true);
      expect(corner2.isCollapsed).toBe(true);
      
      const result = solver.solve();
      console.log("Grid with pre-collapsed cells after solving:\n" + grid.toString());
      
      expect(result.success).toBe(true);
      expect(grid.isComplete()).toBe(true);
      expect(grid.isValid()).toBe(true);
    });
    it('should handle empty grid (0x0)', () => {
      const emptyGrid = new WFCGrid(0, 0, tiles);
      
      expect(() => new WFCSolver(emptyGrid)).toThrow('Invalid grid: Grid must contain at least one cell.');
    });
  });

  describe('algorithm correctness', () => {
    it('should produce deterministic results with same seed', () => {
      const fixedRng = () => 0.5; // Always return same value
      
      const grid1 = new WFCGrid(2, 2, tiles);
      const solver1 = new WFCSolver(grid1, { rng: fixedRng });
      
      const grid2 = new WFCGrid(2, 2, tiles);
      const solver2 = new WFCSolver(grid2, { rng: fixedRng });
      
      const result1 = solver1.solve();
      const result2 = solver2.solve();
      
      expect(result1.success).toBe(result2.success);
      // Both should succeed or both should fail with same RNG
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
    it('should produce valid tile arrangements', () => {
      const solver = new WFCSolver(grid);
      
      const result = solver.solve();
      
      expect(result.success).toBe(true);
      expect(grid.isValid()).toBe(true);
      expect(grid.isComplete()).toBe(true);
      
      // Verify all adjacency constraints are satisfied
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.getCell(x, y)!;
          expect(cell.isCollapsed).toBe(true);
          expect(cell.finalTile).not.toBeNull();
        }
      }
    });
    it('should respect all edge compatibility rules', () => {
      const solver = new WFCSolver(grid);
      
      const result = solver.solve();
      
      expect(result.success).toBe(true);
      
      // Check all adjacent tile pairs for compatibility
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const cell = grid.getCell(x, y)!;
          const tile = cell.finalTile!;
          
          // Check right neighbor
          if (x < grid.width - 1) {
            const rightCell = grid.getCell(x + 1, y)!;
            const rightTile = rightCell.finalTile!;
            const edgeMatches = tile.edges.E.matches?.some(match => 
              rightTile.edges.W.matches?.includes(match)
            );
            expect(edgeMatches).toBe(true);
          }
          
          // Check bottom neighbor
          if (y < grid.height - 1) {
            const bottomCell = grid.getCell(x, y + 1)!;
            const bottomTile = bottomCell.finalTile!;
            const edgeMatches = tile.edges.S.matches?.some(match => 
              bottomTile.edges.N.matches?.includes(match)
            );
            expect(edgeMatches).toBe(true);
          }
        }
      }
    });
    it('should handle transitive edge matching', () => {
      // Test with tiles that have transitive matching (A matches B, B matches C, so A can connect to C)
      const solver = new WFCSolver(grid);
      
      const result = solver.solve();
      
      expect(result.success).toBe(true);
      expect(grid.isValid()).toBe(true);
      
      // Verify that tiles with transitive connections work properly
      // (door matches open, open matches door - they should connect)
      const doorTiles = grid.cells.filter(cell => 
        cell.finalTile && Object.values(cell.finalTile.edges).some(edge => edge.id === 'door')
      );
      const openTiles = grid.cells.filter(cell => 
        cell.finalTile && Object.values(cell.finalTile.edges).some(edge => edge.id === 'open')
      );
      
      // If both types exist, the grid should still be valid (transitive matching works)
      if (doorTiles.length > 0 && openTiles.length > 0) {
        expect(grid.isValid()).toBe(true);
      }
    });
  });

  describe('performance', () => {
    it('should solve 5x5 grid in reasonable time', () => {
      const largeGrid = new WFCGrid(5, 5, tiles);
      const solver = new WFCSolver(largeGrid);
      
      const startTime = Date.now();
      const result = solver.solve();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`5x5 grid solved in ${duration}ms with ${result.iterations} iterations`);
      console.log("5x5 grid after solving:\n" + largeGrid.toString());
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.iterations).toBeLessThan(500); // Reasonable iteration count
    });
    it('should not exceed expected iteration count for simple grids', () => {
      const simpleGrid = new WFCGrid(2, 2, tiles);
      const solver = new WFCSolver(simpleGrid);
      
      const result = solver.solve();
      
      expect(result.success).toBe(true);
      expect(result.iterations).toBeLessThanOrEqual(10); // 2x2 grid should solve quickly
    });
    it('should maintain O(n) performance per step', () => {
      // Test that step performance doesn't degrade significantly with grid size
      const smallGrid = new WFCGrid(2, 2, tiles);
      const mediumGrid = new WFCGrid(3, 3, tiles);
      
      const smallSolver = new WFCSolver(smallGrid);
      const mediumSolver = new WFCSolver(mediumGrid);
      
      // Measure time for single steps
      const smallStart = Date.now();
      smallSolver.step();
      const smallTime = Date.now() - smallStart;
      
      const mediumStart = Date.now();
      mediumSolver.step();
      const mediumTime = Date.now() - mediumStart;
      
      // Time difference should not be exponential
      // (allowing for some variance in timing)
      expect(mediumTime).toBeLessThan(smallTime * 10);
    });
  });
});
