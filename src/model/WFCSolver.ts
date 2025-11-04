import { DynamicEntropyQueue } from "@/helpers/DynamicEntropyQueue";
import type { WFCGrid } from "./WFCGrid";
import type { WFCCell } from "./WFCCell";

export interface WFCOptions {
  maxIterations?: number;
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
  private readonly options: WFCOptions;

  constructor(grid: WFCGrid, options: WFCOptions = {}) {
    if (grid.size === 0) {
      throw new Error("Invalid grid: Grid must contain at least one cell.");
    }
    this.grid = grid;
    this.cellQueue = new DynamicEntropyQueue(grid.cells);
    this.options = { maxIterations: 1000, ...options };
  }

  solve(): WFCResult {
    let iterations = 0;
    const maxIterations = this.options.maxIterations ?? WFCSolver.DEFAULT_MAX_ITERATIONS;

    while (iterations < maxIterations) {
      const stepResult = this.step();
      iterations++;

      if (!stepResult.success) {
        return {
          success: false,
          iterations
        };
      }

      if (stepResult.completed) {
        return {
          success: true,
          iterations
        };
      }
    }

    // Max iterations exceeded
    return {
      success: false,
      iterations
    };
  }

  step(): WFCStepResult {
    // Check if grid is already complete
    if (this.grid.isComplete()) {
      return {
        cellCollapsed: null,
        success: true,
        completed: true
      };
    }

    // Check if grid is in invalid state
    if (!this.grid.isValid()) {
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    // Find cell with lowest entropy
    const position = this.grid.getLowestEntropyCell();
    if (!position) {
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    // Get the cell and collapse it
    const cell = this.grid.getCell(position.x, position.y);
    if (!cell || cell.isCollapsed) {
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    // Collapse the cell
    const collapsed = cell.collapse();
    if (!collapsed) {
      return {
        cellCollapsed: null,
        success: false,
        completed: false
      };
    }

    // Propagate constraints
    const propagationSuccess = this.grid.propagateConstraints(position.x, position.y);
    if (!propagationSuccess) {
      return {
        cellCollapsed: cell,
        success: false,
        completed: false
      };
    }

    return {
      cellCollapsed: cell,
      success: true,
      completed: this.grid.isComplete()
    };
  }
}