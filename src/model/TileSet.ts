import type { Size } from './Size';
import type { EdgeType } from './EdgeType';

export interface TileSetOptions {
  defaultUnit?: string;
  cellSize?: string;
  transitiveMatches?: boolean;
}

export interface TileSetConfig {
  name: string;
  options?: TileSetOptions;
  sizes?: Record<string, Size>;
  types?: {
    edge?: EdgeType[];
    tile?: unknown[];
    map?: unknown[];
  };
  boundaries?: string[];
  images?: unknown;
}

export class TileSet {
  public readonly name: string;
  public readonly options: TileSetOptions;
  public readonly sizes: Record<string, Size>;
  public readonly types: {
    edge: EdgeType[];
    tile: unknown[];
    map: unknown[];
  };
  public readonly boundaries: string[];

  constructor(config: TileSetConfig) {
    this.name = config.name;
    this.options = config.options || {};
    this.sizes = config.sizes || {};
    this.types = {
      edge: config.types?.edge || [],
      tile: config.types?.tile || [],
      map: config.types?.map || []
    };
    this.boundaries = config.boundaries || [];
  }
}