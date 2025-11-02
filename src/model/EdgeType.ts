import type { Size } from './Size';

export interface EdgeType {
  readonly id: string;
  readonly size?: Size;
  readonly matches?: string[];
}

export function isEdgeType(obj: unknown): obj is EdgeType {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    typeof obj.id === 'string'
  );
}
