import { DynamicEntropyQueue } from "@/helpers/DynamicEntropyQueue";
import type { WFCGrid } from "./WFCGrid";
import type { WFCCell } from "./WFCCell";

export interface WFCOptions {
  maxIterations?: number;
  rng?: () => number;
}

export interface WFCResult {
  success: boolean;
  iterations: number;
}

export interface WFCStepResult {
  cellCollapsed: WFCCell | null;
  success: boolean;
  completed: boolean;
}

export class WFCSolver {
  public static readonly DEFAULT_MAX_ITERATIONS = 5000;
  private readonly grid: WFCGrid;
  private readonly cellQueue: DynamicEntropyQueue<WFCCell>;
  private readonly options: Required<WFCOptions>;

  constructor(grid: WFCGrid, options: WFCOptions = {}) {
    if (grid.size === 0) {
      throw new Error("Invalid grid: Grid must contain at least one cell.");
    }

    if (options?.maxIterations !== undefined && options.maxIterations <= 0) {
      throw new Error("Invalid options: maxIterations must be a positive integer.");
    }
    
    this.grid = grid;
    this.cellQueue = new DynamicEntropyQueue(grid.cells);
    this.options = { 
      maxIterations: 1000, 
      rng: () => Math.random(),
      ...options 
    };
  }

  solve(): WFCResult {
    const maxIterations = this.options.maxIterations ?? WFCSolver.DEFAULT_MAX_ITERATIONS;

    console.log(`Starting solve with maxIterations = ${maxIterations}`);

    let i = 0;
    for (; i < maxIterations; i++) {
      const stepResult = this.step();

      if (!stepResult.success) {
        return {
          success: false,
          iterations: i + 1
        };
      }

      if (stepResult.completed) {
        return {
          success: true,
          iterations: i + 1
        };
      }
    }

    // Max iterations exceeded
    return {
      success: false,
      iterations: i // doesn't need +1 here
    };
  }

  step(): WFCStepResult {
    // Check if grid is already complete
    if (this.grid.isComplete()) {
      console.warn(`Grid is already complete`);
      return {
        cellCollapsed: null,
        success: true,
        completed: true
      };
    }

    // Check if grid is in invalid state
    if (!this.grid.isValid()) {
      console.warn(`Grid is in invalid state`);
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    console.log(`Performing step ${this.grid.completedCellsCount + 1}`);

    // Find cell with lowest entropy
    const positions = this.grid.getLowestEntropyCells();
    if (positions.length === 0) {
      // Q: is this actually an invalid state? I thought this would mean the grid is complete
      console.warn(`No valid cell found with lowest entropy`);
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    const selectedPosition = positions[Math.floor((this.options.rng()) * positions.length)];

    console.log(`Lowest entropy cell found at (${selectedPosition.x}, ${selectedPosition.y})`);
    
    // Get the cell and collapse it
    const cell = this.grid.getCell(selectedPosition.x, selectedPosition.y);
    if (!cell || cell.isCollapsed) {
      console.warn(`Cell at (${selectedPosition.x}, ${selectedPosition.y}) ${cell ? "is already collapsed" : "not found"}`);
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    console.log(`Collapsing cell at (${selectedPosition.x}, ${selectedPosition.y})`);
    
    // Collapse the cell
    const collapsed = cell.collapse();
    if (!collapsed) {
      console.log(`Failed to collapse cell at (${selectedPosition.x}, ${selectedPosition.y}). ${cell.possibleTiles.length} possible tiles remained.`);
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    console.log(`Cell at (${selectedPosition.x}, ${selectedPosition.y}) collapsed to tile "${cell.finalTile?.id}"`);

    // Propagate constraints
    const propagationSuccess = this.grid.propagateConstraints(selectedPosition.x, selectedPosition.y);
    if (!propagationSuccess) {
      console.warn(`Constraint propagation failed after collapsing cell at (${selectedPosition.x}, ${selectedPosition.y})`);
      return {
        cellCollapsed: cell,
        success: false,
        completed: false
      };
    }

    console.log(`Constraint propagation succeeded after collapsing cell at (${selectedPosition.x}, ${selectedPosition.y})`);

    return {
      cellCollapsed: cell,
      success: true,
      completed: this.grid.isComplete()
    };
  }
}