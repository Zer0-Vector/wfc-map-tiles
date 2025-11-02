import { describe, it, expect } from 'vitest';
import { TileDefinition } from '@/model/TileDefinition';
import type { EdgeType } from '@/model/EdgeType';

describe('TileDefinition', () => {
  it('should create a basic tile with uniform edges', () => {
    const doorEdge: EdgeType = { id: '2door' };
    const tile = new TileDefinition({
      id: 'central1',
      edges: doorEdge
    });

    expect(tile.id).toBe('central1');
    expect(tile.edges.N).toBe(doorEdge);
    expect(tile.edges.S).toBe(doorEdge);
    expect(tile.edges.E).toBe(doorEdge);
    expect(tile.edges.W).toBe(doorEdge);
  });

  it('should create a tile with different edges per direction', () => {
    const fourDoorEdge: EdgeType = { id: '4door' };
    const twoDoorEdge: EdgeType = { id: '2door' };

    const tile = new TileDefinition({
      id: 'central2',
      width: { value: 2, unit: 'large' },
      height: { value: 1, unit: 'normal' },
      edges: {
        N: fourDoorEdge,
        S: fourDoorEdge,
        E: twoDoorEdge,
        W: twoDoorEdge
      }
    });

    expect(tile.id).toBe('central2');
    expect(tile.width?.value).toBe(2);
    expect(tile.width?.unit).toBe('large');
    expect(tile.height?.value).toBe(1);
    expect(tile.height?.unit).toBe('normal');
    expect(tile.edges.N).toBe(fourDoorEdge);
    expect(tile.edges.E).toBe(twoDoorEdge);
  });

  it('should handle boundary edges', () => {
    const boundaryEdge: EdgeType = { id: '$boundary' };
    const doorEdge: EdgeType = { id: '2door' };
    const smallDoorEdge: EdgeType = { id: '1door' };

    const tile = new TileDefinition({
      id: 'edge1',
      width: { value: 1, unit: 'small' },
      height: { value: 1, unit: 'small' },
      edges: {
        N: doorEdge,
        S: boundaryEdge,
        E: smallDoorEdge,
        W: smallDoorEdge
      }
    });

    expect(tile.edges.S).toBe(boundaryEdge);
    expect(tile.edges.S.id).toBe('$boundary');
  });

  it('should support rotation and reflection metadata', () => {
    const tile = new TileDefinition({
      id: 'central2',
      width: { value: 2, unit: 'large' },
      height: { value: 1, unit: 'normal' },
      edges: { id: '2door' },
      rotation: [90, -90],
      reflection: {
        vertical: false,
        horizontal: true
      }
    });

    expect(tile.rotation).toEqual([90, -90]);
    expect(tile.reflection?.vertical).toBe(false);
    expect(tile.reflection?.horizontal).toBe(true);
  });
});