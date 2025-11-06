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
    const newEdges: TileEdgeMap = { ...this.edges };

    const actualTurns = turns % directions.length;
    const edgeArray = directions.map(dir => this.edges[dir]);
    const rotatedEdges = edgeArray.slice(-actualTurns).concat(edgeArray.slice(0, -actualTurns));

    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      newEdges[dir] = rotatedEdges[i];
    }

    return new TileDefinition({
      id: this.id,
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
    return new TileDefinition({
      id: this.id,
      width: this.width,
      height: this.height,
      edges: newEdges,
      rotation: this.rotation,
      reflection: this.reflection
    });
  }
}