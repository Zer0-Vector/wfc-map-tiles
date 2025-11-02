import { describe, it, expect } from 'vitest';
import { TileSet } from '@/model/TileSet';

describe('TileSet', () => {
  it('should create a tileset with basic properties', () => {
    const tileSet = new TileSet({
      name: 'Test TileSet',
      options: {
        defaultUnit: 'cell',
        cellSize: '70px',
        transitiveMatches: true
      }
    });

    expect(tileSet.name).toBe('Test TileSet');
    expect(tileSet.options.defaultUnit).toBe('cell');
    expect(tileSet.options.cellSize).toBe('70px');
    expect(tileSet.options.transitiveMatches).toBe(true);
  });

  it('should handle size definitions', () => {
    const tileSet = new TileSet({
      name: 'Test TileSet',
      sizes: {
        small: { value: 15 },
        normal: { value: 2, unit: 'small' },
        large: { value: 2, unit: 'normal' }
      }
    });

    expect(tileSet.sizes.small.value).toBe(15);
    expect(tileSet.sizes.normal.value).toBe(2);
    expect(tileSet.sizes.normal.unit).toBe('small');
  });

  it('should handle edge type definitions', () => {
    const tileSet = new TileSet({
      name: 'Test TileSet',
      types: {
        edge: [
          { id: 'wall' },
          { id: '1door', size: { value: 15, unit: 'small' } },
          { id: '2door', size: { value: 30, unit: 'normal' }, matches: ['1door', '1door'] }
        ]
      }
    });

    expect(tileSet.types.edge).toHaveLength(3);
    expect(tileSet.types.edge[0].id).toBe('wall');
    expect(tileSet.types.edge[1].id).toBe('1door');
    expect(tileSet.types.edge[2].matches).toEqual(['1door', '1door']);
  });
});