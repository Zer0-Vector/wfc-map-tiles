import { describe, it, expect } from 'vitest';
import { 
  TileDefinition,
  computeTransformedId,
  D4Operation,
} from '@/model/TileDefinition';
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

  it("should rotate edges correctly", () => {
    const tile = new TileDefinition({
      id: 'testTile',
      edges: {
        N: { id: '2door' },
        S: { id: 'south' },
        E: { id: 'east' },
        W: { id: 'west' }
      }
    });
    let rotatedTile = tile.rotate(1);

    expect(rotatedTile.edges.N.id).toBe('west');
    expect(rotatedTile.edges.E.id).toBe('2door');
    expect(rotatedTile.edges.S.id).toBe('east');
    expect(rotatedTile.edges.W.id).toBe('south');
    
    rotatedTile = tile.rotate(5); // 5 % 4 == 1
    
    expect(rotatedTile.edges.N.id).toBe('west');
    expect(rotatedTile.edges.E.id).toBe('2door');
    expect(rotatedTile.edges.S.id).toBe('east');
    expect(rotatedTile.edges.W.id).toBe('south');

    rotatedTile = tile.rotate(-3); // -3 % 4 == 1
    
    expect(rotatedTile.edges.N.id).toBe('west');
    expect(rotatedTile.edges.E.id).toBe('2door');
    expect(rotatedTile.edges.S.id).toBe('east');
    expect(rotatedTile.edges.W.id).toBe('south');

    // return to initial position
    rotatedTile = rotatedTile.rotate(-1);

    expect(rotatedTile.edges.N.id).toBe('2door');
    expect(rotatedTile.edges.E.id).toBe('east');
    expect(rotatedTile.edges.S.id).toBe('south');
    expect(rotatedTile.edges.W.id).toBe('west');

    rotatedTile = tile.rotate(2);

    expect(rotatedTile.edges.N.id).toBe('south');
    expect(rotatedTile.edges.E.id).toBe('west');
    expect(rotatedTile.edges.S.id).toBe('2door');
    expect(rotatedTile.edges.W.id).toBe('east');

    rotatedTile = tile.rotate(3);

    expect(rotatedTile.edges.N.id).toBe('east');
    expect(rotatedTile.edges.E.id).toBe('south');
    expect(rotatedTile.edges.S.id).toBe('west');
    expect(rotatedTile.edges.W.id).toBe('2door');

    rotatedTile = tile.rotate(4);

    expect(rotatedTile.edges.N.id).toBe('2door');
    expect(rotatedTile.edges.E.id).toBe('east');
    expect(rotatedTile.edges.S.id).toBe('south');
    expect(rotatedTile.edges.W.id).toBe('west');
  });

  it("should reflect edges correctly", () => {
    const tile = new TileDefinition({
      id: 'testTile',
      edges: {
        N: { id: '2door' },
        S: { id: 'south' },
        E: { id: 'east' },
        W: { id: 'west' }
      }
    });
    let reflectedTile = tile.reflect('vertical');

    expect(reflectedTile.edges.N.id).toBe('2door');
    expect(reflectedTile.edges.S.id).toBe('south');
    expect(reflectedTile.edges.E.id).toBe('west');
    expect(reflectedTile.edges.W.id).toBe('east');
   
    reflectedTile = tile.reflect('horizontal');

    expect(reflectedTile.edges.N.id).toBe('south');
    expect(reflectedTile.edges.S.id).toBe('2door');
    expect(reflectedTile.edges.E.id).toBe('east');
    expect(reflectedTile.edges.W.id).toBe('west');

    reflectedTile = tile.reflect("vertical").reflect("vertical");

    expect(reflectedTile.edges.N.id).toBe('2door');
    expect(reflectedTile.edges.S.id).toBe('south');
    expect(reflectedTile.edges.E.id).toBe('east');
    expect(reflectedTile.edges.W.id).toBe('west');
  });

});

describe("D4 group operations", () => {
  it("should compute rotated IDs correctly with minimal representation", () => {
    const baseId = "tileA";
    
    // Basic rotations
    expect(computeTransformedId(baseId, D4Operation.IDENTITY)).toBe("tileA");
    expect(computeTransformedId(baseId, D4Operation.R1)).toBe("tileA__R1");
    expect(computeTransformedId(baseId, D4Operation.R2)).toBe("tileA__R2");
    expect(computeTransformedId(baseId, D4Operation.R3)).toBe("tileA__R3");
  });

  it("should compute reflected IDs correctly with minimal representation", () => {
    const baseId = "tileB";

    expect(computeTransformedId(baseId, D4Operation.V)).toBe("tileB__V");
    expect(computeTransformedId(baseId, D4Operation.VR2)).toBe("tileB__VR2");
  });

  it("should compose transformations using D4 group multiplication", () => {
    const baseId = "tileC";
    
    // Double vertical reflection = identity
    let transformed = computeTransformedId(baseId, D4Operation.V);
    transformed = computeTransformedId(transformed, D4Operation.V);
    expect(transformed).toBe("tileC");
    
    // Vertical then horizontal reflection = 180° rotation
    transformed = computeTransformedId(baseId, D4Operation.V);
    transformed = computeTransformedId(transformed, D4Operation.VR2);
    expect(transformed).toBe("tileC__R2");
    
    // 90° rotation then vertical reflection
    transformed = computeTransformedId(baseId, 1);
    transformed = computeTransformedId(transformed, D4Operation.V);
    expect(transformed).toBe("tileC__VR2"); // Should be horizontal reflection
  });

  it("should handle complex transformation chains", () => {
    const baseId = "complex";
    
    // Start with R1, add R3, should get R0 (identity)
    console.log("baseId:", baseId);
    let transformed = computeTransformedId(baseId, D4Operation.R1);
    console.log("after R1:", transformed);
    transformed = computeTransformedId(transformed, D4Operation.R3);
    console.log("after R3:", transformed);
    expect(transformed).toBe("complex");
    
    // Start with R2, add V, should compose correctly
    console.log("baseId:", baseId);
    transformed = computeTransformedId(baseId, D4Operation.V);
    console.log("after V:", transformed);
    transformed = computeTransformedId(transformed, D4Operation.R2);
    console.log("after R2:", transformed);
    expect(transformed).toBe("complex__VR2"); // R2 ∘ V = VR2 (based on D4 multiplication)

    transformed = computeTransformedId(transformed, D4Operation.VR2);
    console.log("after VR2:", transformed);
    expect(transformed).toBe("complex"); // back to 0
  });
});