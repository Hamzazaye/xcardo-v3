/**
 * XcardO III: Obsidian Sanctum
 * 6-Tier Single-Player Inquisitor AI & Tactical Oracle Engine
 */

import { previewPlacementScoring } from './pattern-detector.js';
import { getArcanaCardById } from '../data/gothic-config.js';

/**
 * Select the optimal (r, c) stone placement for `aiSymbol` across 6 Inquisitor AI tiers:
 * 1: Acolyte (Novice)
 * 2: Deacon (Apprentice)
 * 3: Canon (Tactical)
 * 4: Prior (Aggressive Shape Seeker)
 * 5: Grand Inquisitor (Ruthless Minimax Lookahead)
 * 6: Hollow Seraph (Omniscient Cathedral Master)
 */
export function selectBestAIMove(engine, aiSymbol = 'O', tier = 3) {
  const { board, boardSize, scoredRegistry } = engine;
  const enemySymbol = aiSymbol === 'O' ? 'X' : 'O';
  const validMoves = [];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = board[r][c];
      if (!cell.symbol && cell.locked === 0 && !cell.obstacle) {
        validMoves.push([r, c]);
      }
    }
  }

  if (validMoves.length === 0) return null;

  // Tier 1 Acolyte occasionally makes an impulsive ritual move
  if (tier === 1 && engine.rng.chance(0.32)) {
    const [r, c] = engine.rng.pick(validMoves);
    return { r, c, score: 1, reason: 'Acolyte Impulse' };
  }

  const center = (boardSize - 1) / 2;
  let bestMove = validMoves[0];
  let bestScore = -Infinity;
  let bestReason = 'Altar Positioning';

  for (const [r, c] of validMoves) {
    let score = 0;
    let moveReason = 'Altar Positioning';

    // 1. Immediate AI Scoring Evaluation
    const aiPatterns = previewPlacementScoring(board, boardSize, r, c, aiSymbol, scoredRegistry);
    const aiPoints = aiPatterns.reduce((sum, p) => sum + p.points, 0);
    if (aiPoints > 0) {
      score += aiPoints * 135;
      const grandShape = aiPatterns.find((p) => p.type === 'SHAPE');
      moveReason = grandShape ? `Sacred Geometry: ${grandShape.name}` : `Complete +${aiPoints} VP Alignment`;
      if ((engine.scores[aiSymbol] || 0) + aiPoints >= engine.targetScore) {
        score += 12000; // Immediate Sanctum Victory
        moveReason = 'Sanctum Lethal Alignment';
      }
    }

    // 2. Blocking Opponent Scoring Threats
    if (tier >= 2) {
      const playerPatterns = previewPlacementScoring(board, boardSize, r, c, enemySymbol, scoredRegistry);
      const playerPoints = playerPatterns.reduce((sum, p) => sum + p.points, 0);
      if (playerPoints > 0) {
        const blockWeight = tier >= 4 ? 128 : 98;
        score += playerPoints * blockWeight;
        if (score > 110 && aiPoints === 0) {
          moveReason = `Deny Enemy +${playerPoints} VP Threat`;
        }
        if ((engine.scores[enemySymbol] || 0) + playerPoints >= engine.targetScore) {
          score += 9500; // Must block lethal enemy alignment
          moveReason = 'Counter Lethal Heresy';
        }
      }
    }

    // 3. Reliquary Coffer & Altar Anomaly awareness
    const cell = board[r][c];
    if (cell.anomaly === 'sanctified_mosaic') score += 32;
    if (cell.anomaly === 'blood_chalice') score += 26;
    if (cell.anomaly === 'cursed_censer') score -= 45; // Avoid detonating self

    // Adjacent Reliquary Coffer cracking bonus
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
          if (board[nr][nc].obstacle === 'reliquary_coffer') {
            score += 22;
          }
        }
      }
    }

    // 4. Adjacency & Cathedral Geometry Clustering
    let friendlyNeighbors = 0;
    let enemyNeighbors = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
          const nSym = board[nr][nc].symbol;
          if (nSym === aiSymbol || nSym === 'W') friendlyNeighbors++;
          else if (nSym === enemySymbol) enemyNeighbors++;
        }
      }
    }
    score += friendlyNeighbors * (tier >= 3 ? 15 : 8);
    score += enemyNeighbors * (tier >= 4 ? 9 : 4);

    // 5. Central Altar Dominance
    const distFromCenter = Math.abs(r - center) + Math.abs(c - center);
    score += Math.max(0, (boardSize - distFromCenter) * 3.2);

    // 6. Tier 5-6 Second-Step Fork Lookahead
    if (tier >= 5 && validMoves.length <= 49) {
      cell.symbol = aiSymbol;
      let forkPotential = 0;
      for (const [nr, nc] of validMoves) {
        if (nr === r && nc === c) continue;
        if (Math.abs(nr - r) <= 2 && Math.abs(nc - c) <= 2) {
          const nextPatterns = previewPlacementScoring(board, boardSize, nr, nc, aiSymbol, scoredRegistry);
          const nextPts = nextPatterns.reduce((s, p) => s + p.points, 0);
          if (nextPts > 0) forkPotential += nextPts * 20;
        }
      }
      cell.symbol = null;
      score += forkPotential;
      if (forkPotential >= 60 && aiPoints === 0 && moveReason === 'Altar Positioning') {
        moveReason = 'Cruciform Fork Setup';
      }
    }

    // Small deterministic jitter for natural variety
    const jitter = tier >= 5 ? engine.rng.nextFloat() * 2.5 : engine.rng.nextFloat() * 10;
    score += jitter;

    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
      bestReason = moveReason;
    }
  }

  return { r: bestMove[0], c: bestMove[1], score: Math.round(bestScore), reason: bestReason };
}

/**
 * Evaluate whether the AI Inquisitor should cast a Dark-Tarot Arcana Card before placing its stone
 */
export function selectBestAICardAction(engine, tier = 3) {
  if (tier <= 1) return null; // Acolyte rarely uses Dark-Tarot cards
  if (tier === 2 && !engine.rng.chance(0.4)) return null;

  const hand = engine.hands.O;
  const tithe = engine.tithe.O;
  const { board, boardSize } = engine;

  const affordable = hand
    .map((inst, idx) => ({ inst, card: getArcanaCardById(inst.cardId), idx }))
    .filter((item) => item.card && item.card.cost <= tithe);

  if (affordable.length === 0) return null;

  const playerCells = [];
  const aiCells = [];
  const emptyCells = [];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = board[r][c];
      if (cell.symbol === 'X' && cell.shield === 0) playerCells.push([r, c]);
      else if (cell.symbol === 'O') aiCells.push([r, c]);
      else if (!cell.symbol && cell.locked === 0 && !cell.obstacle) emptyCells.push([r, c]);
    }
  }

  for (const { inst, card, idx } of affordable) {
    // Shatter & Destruction Arcana against dense player formations
    if (
      (card.effect === 'shatter_single' ||
        card.effect === 'shatter_cross' ||
        card.effect === 'brimstone_3x3' ||
        card.effect === 'transmute_piece') &&
      playerCells.length >= 2
    ) {
      let bestTarget = playerCells[0];
      let bestDensity = -1;
      for (const [pr, pc] of playerCells) {
        let density = 0;
        for (const [or, oc] of playerCells) {
          if (Math.abs(pr - or) <= 1 && Math.abs(pc - oc) <= 1) density++;
        }
        if (density > bestDensity) {
          bestDensity = density;
          bestTarget = [pr, pc];
        }
      }
      if (bestDensity >= 2 || card.effect === 'transmute_piece') {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [bestTarget] };
      }
    }

    if (card.effect === 'guillotine_row' && playerCells.length >= 3) {
      let bestRow = 0;
      let maxCount = 0;
      for (let r = 0; r < boardSize; r++) {
        const count = playerCells.filter(([pr]) => pr === r).length;
        if (count > maxCount) {
          maxCount = count;
          bestRow = r;
        }
      }
      if (maxCount >= 2) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[bestRow, 0]] };
      }
    }

    if (card.effect === 'sanctified_relic' && emptyCells.length > 0 && aiCells.length >= 1) {
      const move = selectBestAIMove(engine, 'O', tier);
      if (move) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[move.r, move.c]] };
      }
    }

    if (card.effect === 'iron_cage' && emptyCells.length > 0 && tier >= 3) {
      const threatMove = selectBestAIMove(engine, 'X', tier);
      if (threatMove && threatMove.score >= 110) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[threatMove.r, threatMove.c]] };
      }
    }

    if (card.effect === 'aegis_gargoyle' && aiCells.length > 0) {
      const unshielded = aiCells.filter(([r, c]) => board[r][c].shield === 0);
      if (unshielded.length > 0) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [engine.rng.pick(unshielded)] };
      }
    }

    if (
      card.targetType === 'none' &&
      (card.effect === 'double_consecration' ||
        card.effect === 'blood_communion' ||
        card.effect === 'eclipse_shroud' ||
        card.effect === 'excommunication' ||
        card.effect === 'cathedral_judgment')
    ) {
      if (tier >= 3 && engine.rng.chance(0.75)) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [] };
      }
    }
  }

  return null;
}

/**
 * Scan all cells where the opponent ('O') would immediately score next turn if unblocked
 */
export function scanEnemyThreatCells(engine, enemySymbol = 'O') {
  const { board, boardSize, scoredRegistry } = engine;
  const threats = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = board[r][c];
      if (!cell.symbol && cell.locked === 0 && !cell.obstacle) {
        const patterns = previewPlacementScoring(board, boardSize, r, c, enemySymbol, scoredRegistry);
        if (patterns.length > 0) {
          const pts = patterns.reduce((s, p) => s + p.points, 0);
          threats.push({ r, c, points: pts, patterns });
        }
      }
    }
  }
  return threats;
}
