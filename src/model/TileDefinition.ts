import { isEdgeType, type EdgeType } from './EdgeType';
import type { Size } from './Size';
import { CardinalDirectionValues, type TileEdgeMap } from './MapTile';

export interface ReflectionOptions {
  vertical?: boolean;
  horizontal?: boolean;
}

export interface TileDefinitionConfig {
  readonly id: string;
  readonly width?: Size;
  readonly height?: Size;
  readonly edges: TileEdgeMap | EdgeType;
  readonly rotation?: number[];
  readonly reflection?: ReflectionOptions;
}

export type ReflectionCode = 'V' | 'H';

/**
 * Dihedral group D4 operations for square tiles.
 * Represents rotations and reflections as group elements.
 */
export const D4Operation = {
  IDENTITY: 0,    // e - identity
  R2: 1,  // r² - 180°
  R1: 2,   // r - 90° clockwise
  R3: 3,  // r³ - 270° clockwise
  VR2: 4,   // sr² - horizontal reflection (flip top-bottom)
  V: 5,   // s - vertical reflection (flip left-right)
  VR3: 6, // sr³ - diagonal reflection (flip SW-NE)
  VR1: 7, // sr - diagonal reflection (flip SE-NW)

} as const;

export type D4Operation = typeof D4Operation[keyof typeof D4Operation];

/**
 * Multiplication table for D4 group operations.
 * Table[a][b] gives the result of applying operation a followed by operation b.
 */
const D4_MULTIPLICATION_TABLE: D4Operation[][] = [
  //  column after row →    e    r2   r    r3   vr2  v    vr3  vr1
  /*             e   */ [   0,   1,   2,   3,   4,   5,   6,   7 ],
  /*             r2  */ [   1,   0,   3,   2,   5,   4,   7,   6 ],
  /*             r   */ [   2,   3,   1,   0,   7,   6,   5,   4 ],
  /*             r3  */ [   3,   2,   0,   1,   6,   7,   4,   5 ],
  /*         (h) vr2 */ [   4,   5,   6,   7,   0,   1,   2,   3 ],
  /*             v   */ [   5,   4,   7,   6,   1,   0,   3,   2 ],
  /*        (d') vr3 */ [   6,   7,   5,   4,   3,   1,   0,   1 ],
  /*         (d) vr1 */ [   7,   6,   4,   5,   1,   3,   1,   0 ],
];

/**
 * Converts rotation turns to D4Operation.
 */
export function rotationToD4Operation(turns: number): D4Operation {
  return normalizeRotation(turns) as D4Operation;
}

/**
 * Converts reflection axis to D4Operation.
 */
export function reflectionToD4Operation(axis: 'vertical' | 'horizontal'): D4Operation {
  return axis === 'vertical' ? D4Operation.V : D4Operation.VR2;
}

/**
 * Multiplies two D4 operations (applies first, then second).
 * Returns the minimal representation of the combined operation.
 */
export function multiplyD4Operations(first: D4Operation, second: D4Operation): D4Operation {
  return D4_MULTIPLICATION_TABLE[first][second];
}

/**
 * Converts a D4Operation back to its string representation for IDs.
 */
export function d4OperationToSuffix(operation: D4Operation): string {
  switch (operation) {
    case D4Operation.IDENTITY: return '';
    case D4Operation.R1: return 'R1';
    case D4Operation.R2: return 'R2';
    case D4Operation.R3: return 'R3';
    case D4Operation.V: return 'V';
    case D4Operation.VR2: return 'VR2';
    case D4Operation.VR1: return 'VR1';
    case D4Operation.VR3: return 'VR3';
    default: return '';
  }
}

/**
 * Parses a transformation suffix back to D4Operation.
 */
export function suffixToD4Operation(suffix: string): D4Operation {
  switch (suffix) {
    case '': return D4Operation.IDENTITY;
    case 'R1': return D4Operation.R1;
    case 'R2': return D4Operation.R2;
    case 'R3': return D4Operation.R3;
    case 'V': return D4Operation.V;
    case 'VR2': return D4Operation.VR2;
    case 'VR1': return D4Operation.VR1;
    case 'VR3': return D4Operation.VR3;
    default: return D4Operation.IDENTITY;
  }
}

export const normalizeRotation = (turns: number) => ((turns % 4) + 4) % 4;

/**
 * Extracts the base ID and current transformation from a tile ID.
 * Handles well-formed IDs with at most one transformation suffix.
 */
export function parseTransformedId(id: string): { baseId: string; operation: D4Operation } {
  // Match pattern: baseId OR baseId__validSuffix
  // Valid suffixes: R1, R2, R3, V (no compound suffixes)
  const match = /^(.+?)(?:__(R[123]|V(?:R[123])?))?$/.exec(id);
  if (!match) {
    // If the pattern doesn't match, assume it's a base ID
    return { baseId: id, operation: D4Operation.IDENTITY };
  }
  
  const baseId = match[1];
  const suffix = match[2] || '';
  const operation = suffixToD4Operation(suffix);
  
  return { baseId, operation };
}

/**
 * Computes a new tile ID by applying a transformation operation.
 * Uses D4 group multiplication to find the minimal representation.
 */
export function computeTransformedId(originalId: string, newOperation: D4Operation): string {
  const { baseId, operation: currentOperation } = parseTransformedId(originalId);
  
  // Multiply current transformation with new transformation
  const resultOperation = multiplyD4Operations(currentOperation, newOperation);
  
  // Generate new ID with minimal representation
  const suffix = d4OperationToSuffix(resultOperation);
  return suffix === '' ? baseId : `${baseId}__${suffix}`;
}

export class TileDefinition {
  public readonly id: string;
  public readonly width?: Size;
  public readonly height?: Size;
  public readonly edges: TileEdgeMap;
  public readonly rotation?: number[];
  public readonly reflection?: ReflectionOptions;

  constructor(config: TileDefinitionConfig) {
    this.id = config.id;
    this.width = config.width;
    this.height = config.height;
    this.rotation = config.rotation;
    this.reflection = config.reflection;


    // Handle uniform edges or directional edges
    if (isEdgeType(config.edges)) {
      // Uniform edge for all directions
      const uniformEdge = config.edges;
      this.edges = {
        N: uniformEdge,
        S: uniformEdge,
        E: uniformEdge,
        W: uniformEdge
      };
    } else {
      // Directional edges
      this.edges = config.edges;
    }
  }

  rotate(turns: number): TileDefinition {
    const directions = CardinalDirectionValues
    const actualTurns = normalizeRotation(turns);

    if (actualTurns === 0) {
      return this; // No rotation needed
    }

    const newEdges: TileEdgeMap = { ...this.edges };

    const edgeArray = directions.map(dir => this.edges[dir]);
    const rotatedEdges = edgeArray.slice(-actualTurns).concat(edgeArray.slice(0, -actualTurns));

    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      newEdges[dir] = rotatedEdges[i];
    }

    const operation = rotationToD4Operation(actualTurns);
    
    return new TileDefinition({
      id: computeTransformedId(this.id, operation),
      width: this.width,
      height: this.height,
      edges: newEdges,
      rotation: this.rotation,
      reflection: this.reflection
    });
  }

  reflect(axis: 'vertical' | 'horizontal'): TileDefinition {
    const newEdges: TileEdgeMap = { ...this.edges };
    if (axis === 'vertical') {
      // Swap East and West
      [newEdges.E, newEdges.W] = [newEdges.W, newEdges.E];
    } else if (axis === 'horizontal') {
      // Swap North and South
      [newEdges.N, newEdges.S] = [newEdges.S, newEdges.N];
    }
    
    const operation = reflectionToD4Operation(axis);
    
    return new TileDefinition({
      id: computeTransformedId(this.id, operation),
      width: this.width,
      height: this.height,
      edges: newEdges,
      rotation: this.rotation,
      reflection: this.reflection
    });
  }
}