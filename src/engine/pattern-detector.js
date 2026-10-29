/**
 * XcardO: Warlords of the Obsidian Altar
 * Sacred Gothic Geometry & Line Pattern Detection Engine
 */

const LINE_DIRECTIONS = [
  { name: 'Horizontal Nave', dr: 0, dc: 1 },
  { name: 'Vertical Transept', dr: 1, dc: 0 },
  { name: 'Descending Vault', dr: 1, dc: 1 },
  { name: 'Ascending Vault', dr: 1, dc: -1 },
];

export const SACRED_GEOMETRY_SHAPES = [
  {
    id: 'l_transept',
    name: 'L-Transept Vault',
    points: 2,
    tier: 'minor',
    color: '#d4a853',
    variants: [
      [[0, 0], [1, 0], [2, 0], [2, 1]],
      [[0, 1], [1, 1], [2, 1], [2, 0]],
      [[0, 0], [0, 1], [1, 0], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 0]],
      [[0, 0], [0, 1], [0, 2], [1, 2]],
      [[1, 0], [1, 1], [1, 2], [0, 0]],
      [[1, 0], [1, 1], [1, 2], [0, 2]],
    ],
  },
  {
    id: 'cloister_square',
    name: 'Cloister Square (2x2)',
    points: 2,
    tier: 'minor',
    color: '#38bdf8',
    variants: [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
    ],
  },
  {
    id: 'crux_fidelis',
    name: 'Crux Fidelis (+)',
    points: 3,
    tier: 'major',
    color: '#f59e0b',
    variants: [
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
    ],
  },
  {
    id: 't_altar',
    name: 'Altar T-Cross',
    points: 3,
    tier: 'major',
    color: '#c084fc',
    variants: [
      [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
      [[2, 0], [2, 1], [2, 2], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 2], [1, 2], [2, 2], [1, 0], [1, 1]],
    ],
  },
  {
    id: 'st_andrew_cross',
    name: "St. Andrew's Saltire (X)",
    points: 4,
    tier: 'grand',
    color: '#e11d48',
    variants: [
      [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    ],
  },
  {
    id: 'cathedral_cross',
    name: 'Grand Cathedral Cross',
    points: 4,
    tier: 'grand',
    color: '#fbbf24',
    variants: [
      [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1]],
      [[0, 1], [1, 1], [2, 0], [2, 1], [2, 2], [3, 1]],
      [[1, 0], [1, 1], [0, 2], [1, 2], [2, 2], [1, 3]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]],
    ],
  },
  {
    id: 'rose_window',
    name: 'Rose Window Sanctum (3x3)',
    points: 5,
    tier: 'grand',
    color: '#f43f5e',
    variants: [
      [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]],
    ],
  },
];

export function cellMatchesSymbol(cell, targetSymbol) {
  if (!cell || !cell.symbol) return false;
  if (cell.locked > 0) return false;
  if (cell.symbol === 'W') return true; // Sanctified Wild Relic
  return cell.symbol === targetSymbol;
}

/**
 * Scan the entire board for all scoring Lines (3, 4, 5+) and Sacred Gothic Geometry shapes
 */
export function scanBoardPatterns(board, size, scoredRegistry, options = {}) {
  const results = [];
  const linePointsTable = options.linePoints || { 3: 1, 4: 2, 5: 3 };
  const enableShapes = options.enableShapes !== false;
  const shapeBonus = options.shapeBonus || 0;

  for (const symbol of ['X', 'O']) {
    // 1. Scan Line Formations (3, 4, 5+)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        for (const dir of LINE_DIRECTIONS) {
          const prevR = r - dir.dr;
          const prevC = c - dir.dc;
          if (
            prevR >= 0 &&
            prevR < size &&
            prevC >= 0 &&
            prevC < size &&
            cellMatchesSymbol(board[prevR][prevC], symbol)
          ) {
            continue; // Part of an earlier contiguous segment along this axis
          }

          const lineCells = [];
          let cr = r;
          let cc = c;
          while (
            cr >= 0 &&
            cr < size &&
            cc >= 0 &&
            cc < size &&
            cellMatchesSymbol(board[cr][cc], symbol)
          ) {
            lineCells.push([cr, cc]);
            cr += dir.dr;
            cc += dir.dc;
          }

          if (lineCells.length >= 3) {
            for (let len = 3; len <= Math.min(5, lineCells.length); len++) {
              for (let start = 0; start <= lineCells.length - len; start++) {
                const subCells = lineCells.slice(start, start + len);
                const key = makePatternKey('LINE', symbol, `${dir.name}_${len}`, subCells);
                if (!scoredRegistry.has(key)) {
                  const basePts = linePointsTable[len] || (len >= 5 ? 3 : 1);
                  const hasMosaic = subCells.some(([sr, sc]) => board[sr][sc].anomaly === 'sanctified_mosaic');
                  results.push({
                    key,
                    type: 'LINE',
                    tier: len >= 5 ? 'grand' : len === 4 ? 'major' : 'minor',
                    name: `${len}-Stone ${dir.name}`,
                    symbol,
                    length: len,
                    points: basePts + (hasMosaic ? 2 : 0),
                    hasMosaicBonus: hasMosaic,
                    color: symbol === 'X' ? '#f59e0b' : '#e11d48',
                    cells: subCells,
                  });
                }
              }
            }
          }
        }
      }
    }

    // 2. Scan Sacred Gothic Geometry Formations
    if (enableShapes) {
      for (const shape of SACRED_GEOMETRY_SHAPES) {
        for (let vIdx = 0; vIdx < shape.variants.length; vIdx++) {
          const variant = shape.variants[vIdx];
          const maxR = Math.max(...variant.map(([dr]) => dr));
          const maxC = Math.max(...variant.map(([, dc]) => dc));

          for (let r = 0; r <= size - 1 - maxR; r++) {
            for (let c = 0; c <= size - 1 - maxC; c++) {
              const absCells = variant.map(([dr, dc]) => [r + dr, c + dc]);
              const allMatch = absCells.every(([ar, ac]) => cellMatchesSymbol(board[ar][ac], symbol));

              if (allMatch) {
                const key = makePatternKey('SHAPE', symbol, shape.id, absCells);
                if (!scoredRegistry.has(key)) {
                  const hasMosaic = absCells.some(([sr, sc]) => board[sr][sc].anomaly === 'sanctified_mosaic');
                  results.push({
                    key,
                    type: 'SHAPE',
                    shapeId: shape.id,
                    tier: shape.tier,
                    name: shape.name,
                    symbol,
                    points: shape.points + shapeBonus + (hasMosaic ? 2 : 0),
                    hasMosaicBonus: hasMosaic,
                    color: shape.color,
                    cells: absCells,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Non-mutating preview of patterns that would score if `symbol` were placed at `(r, c)`
 */
export function previewPlacementScoring(board, size, r, c, symbol, scoredRegistry, options = {}) {
  if (r < 0 || r >= size || c < 0 || c >= size) return [];
  const cell = board[r][c];
  if (!cell || cell.symbol !== null || cell.locked > 0 || cell.obstacle) return [];

  const prevSymbol = cell.symbol;
  cell.symbol = symbol;
  const patterns = scanBoardPatterns(board, size, scoredRegistry, options).filter(
    (p) => p.symbol === symbol && p.cells.some(([pr, pc]) => pr === r && pc === c)
  );
  cell.symbol = prevSymbol;
  return patterns;
}

export function makePatternKey(type, symbol, id, cells) {
  const sorted = [...cells]
    .map(([r, c]) => `${r},${c}`)
    .sort()
    .join('|');
  return `${type}:${symbol}:${id}:${sorted}`;
}
