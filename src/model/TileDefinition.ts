import { isEdgeType, type EdgeType } from './EdgeType';
import type { Size } from './Size';
import type { TileEdgeMap } from './MapTile';

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
}