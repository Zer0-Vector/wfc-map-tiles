# Copilot Instructions for WFC Map Tiles

## Project Overview
This is a Wave Function Collapse (WFC) algorithm implementation for generating TTRPG map tiles. The project uses React/TypeScript/Vite and focuses on edge-based tile constraint solving.

## Architecture Patterns

### Core Model Structure
- **MapTile** (`src/model/MapTile.ts`): Defines tiles with directional edges using `CardinalDirection` type ("N"|"S"|"E"|"W")
- **EdgeType** (`src/model/EdgeType.ts`): Simple interface with `id` field - the atomic constraint building block
- **MapTileWFCConfig** (`src/model/MapTileWFCConfig.ts`): Configuration container for tiles and edge types

### YAML Configuration Pattern
The project uses a sophisticated YAML-based tile definition system (`examples/complete.yaml`):
- JSONPath references with `${}` syntax for field reuse
- Array flattening behavior when referencing arrays as elements
- `$defaults` section for type inheritance
- Transitive matching system where A→B + B→C implies A→C
- Size units system with relative sizing (e.g., `2 small`, `normal`)
- Rotation/reflection metadata for tile variants

## Coding Standards and Style
- Use test-driven development (TDD) practices.
- TypeScript with strict typing
- Functional programming principles where applicable
- Clear separation of concerns between model, helpers, and UI components
- Add comprehensive JSDoc comments for public methods and properties
- Prefer arrow functions for callbacks and functional components
- Use async/await for asynchronous code
- Use `get` and `set` keywords for property accessors instead of methods.
- Avoid using `any` type; prefer specific types or generics.
- Use interfaces for data objects instead of classes when no behavior or computation is needed.
- Prefer `for...of` loops over `forEach`.
- Follow Prettier formatting rules
- Use ESLint with recommended TypeScript rules
- Consistent naming conventions (camelCase for variables/functions, PascalCase for types/classes)
- Always prefer `const` over `let` unless reassignment is necessary
- Always use block scoping with `{}` for control structures
- Use double quotes for strings

## Development Workflow

### Build Commands
- `npm run dev` - Start development server with HMR
- `npm run build` - TypeScript compilation followed by Vite build
- `npm run preview` - Preview production build locally
- `npm test` - Run tests with Vitest

### Key File Patterns
- Place domain models in `src/model/` with clear interface definitions
- Use `src/helpers/` for utility types and reusable logic
- Configuration examples go in `examples/` directory
- Follow Vite's React template structure for components

### Edge Constraint Logic
When implementing WFC algorithms:
- Tiles connect via matching edge types on adjacent sides
- Use `fitsWith(tile: MapTile, edgeType: EdgeType)` method pattern
- Consider boundary conditions with special `$boundary` edge type
- Implement transitive matching for flexible constraint propagation

## TTRPG-Specific Considerations
- Wall edges represent impassable boundaries
- Image loading supports WebP/PNG with glob patterns and type-based directory organization