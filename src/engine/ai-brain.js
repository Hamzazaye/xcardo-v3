/**
 * XcardO: Warlords of the Obsidian Altar
 * 6-Tier Single-Player Warlord AI — Real Depth-3 Alpha-Beta Minimax, Shop Buyer & Tactical Oracle
 */

import { previewPlacementScoring, cellMatchesSymbol } from './pattern-detector.js';
import { getArcanaCardById, GAME_CONFIG } from '../data/gothic-config.js';

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Fast heuristic evaluation of a candidate move `(r, c)` for move-ordering and 1-ply scoring
 */
function scoreCandidateMove(engine, board, boardSize, scoredRegistry, r, c, sym, enemySym, scores, tier) {
  let score = 0;
  let moveReason = 'Altar Positioning';
  const targetScore = engine.targetScore || 6;

  // 1. Immediate scoring patterns created by placing `sym` at `(r, c)`
  const myPatterns = previewPlacementScoring(board, boardSize, r, c, sym, scoredRegistry);
  const myPts = myPatterns.reduce((s, p) => s + p.points, 0);
  if (myPts > 0) {
    const comboBonus = myPatterns.length >= 2 ? myPatterns.length - 1 : 0;
    const totalGain = myPts + comboBonus;
    score += totalGain * 145;
    const grandShape = myPatterns.find((p) => p.type === 'SHAPE');
    moveReason = grandShape ? `Sacred Geometry: ${grandShape.name}` : `Complete +${totalGain} VP Alignment`;
    if ((scores[sym] || 0) + totalGain >= targetScore) {
      score += 15000;
      moveReason = 'Sanctum Lethal Alignment';
    }
  }

  // 2. Blocking opponent immediate scoring at `(r, c)`
  if (tier >= 2) {
    const oppPatterns = previewPlacementScoring(board, boardSize, r, c, enemySym, scoredRegistry);
    const oppPts = oppPatterns.reduce((s, p) => s + p.points, 0);
    if (oppPts > 0) {
      const oppCombo = oppPatterns.length >= 2 ? oppPatterns.length - 1 : 0;
      const oppGain = oppPts + oppCombo;
      const blockWeight = tier >= 4 ? 138 : 108;
      score += oppGain * blockWeight;
      if (myPts === 0) {
        moveReason = `Deny Enemy +${oppGain} VP Threat`;
      }
      if ((scores[enemySym] || 0) + oppGain >= targetScore) {
        score += 11500;
        moveReason = 'Counter Lethal Heresy';
      }
    }
  }

  // 3. Line-building potential (2-in-a-row open-ended rays)
  if (tier >= 3) {
    for (const [dr, dc] of DIRS) {
      let friendlyRun = 1;
      let openEnds = 0;
      // Forward ray
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && cellMatchesSymbol(board[nr][nc], sym)) {
        friendlyRun++;
        nr += dr;
        nc += dc;
      }
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && !board[nr][nc].symbol && !board[nr][nc].obstacle && board[nr][nc].locked === 0) {
        openEnds++;
      }
      // Backward ray
      nr = r - dr;
      nc = c - dc;
      while (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && cellMatchesSymbol(board[nr][nc], sym)) {
        friendlyRun++;
        nr -= dr;
        nc -= dc;
      }
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && !board[nr][nc].symbol && !board[nr][nc].obstacle && board[nr][nc].locked === 0) {
        openEnds++;
      }
      if (friendlyRun >= 2 && openEnds >= 1) {
        score += friendlyRun * 14 + openEnds * 9;
      }
    }
  }

  // 4. Anomalies, Mystery Chests & Telegraphed Boss Ritual awareness
  const cell = board[r][c];
  if (cell.anomaly === 'sanctified_mosaic') score += 36;
  if (cell.anomaly === 'blood_chalice') score += 28;
  if (cell.anomaly === 'cursed_censer') score -= 55;

  // If player/AI can disrupt or capitalize on a telegraphed boss ritual
  if (engine.pendingBossRitual && engine.pendingBossRitual.r === r && engine.pendingBossRitual.c === c) {
    if (sym === 'X') score += 42; // Player disrupting boss target tile
    else score -= 18; // AI leaves its own boss ritual tile alone
  }

  let friendlyNeighbors = 0;
  let enemyNeighbors = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
        if (board[nr][nc].obstacle === 'reliquary_coffer') {
          score += 24;
        }
        const nSym = board[nr][nc].symbol;
        if (nSym === sym || nSym === 'W') friendlyNeighbors++;
        else if (nSym === enemySym) enemyNeighbors++;
      }
    }
  }
  score += friendlyNeighbors * (tier >= 3 ? 13 : 7);
  score += enemyNeighbors * (tier >= 4 ? 8 : 4);

  const center = (boardSize - 1) / 2;
  const distFromCenter = Math.abs(r - center) + Math.abs(c - center);
  score += Math.max(0, (boardSize - distFromCenter) * 3.4);

  return { score, reason: moveReason, myPatterns, myPts };
}

/**
 * Real Depth-N Alpha-Beta Minimax Search with Beam Move Ordering
 */
function alphaBetaSearch(
  engine,
  board,
  boardSize,
  scoredRegistry,
  depth,
  alpha,
  beta,
  maximizingPlayer,
  aiSymbol,
  enemySymbol,
  scores,
  tier,
  beamWidth
) {
  const targetScore = engine.targetScore || 6;
  if (scores[aiSymbol] >= targetScore) {
    return 10000 + (scores[aiSymbol] - scores[enemySymbol]) * 120 + depth * 200;
  }
  if (scores[enemySymbol] >= targetScore) {
    return -10000 - (scores[enemySymbol] - scores[aiSymbol]) * 120 - depth * 200;
  }
  if (depth <= 0) {
    return (scores[aiSymbol] - scores[enemySymbol]) * 145;
  }

  const activeSym = maximizingPlayer ? aiSymbol : enemySymbol;
  const otherSym = maximizingPlayer ? enemySymbol : aiSymbol;

  // Gather & rank candidate moves
  const candidates = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = board[r][c];
      if (!cell.symbol && cell.locked === 0 && !cell.obstacle) {
        const evalMove = scoreCandidateMove(
          engine,
          board,
          boardSize,
          scoredRegistry,
          r,
          c,
          activeSym,
          otherSym,
          scores,
          tier
        );
        candidates.push({ r, c, ...evalMove });
      }
    }
  }

  if (candidates.length === 0) {
    return (scores[aiSymbol] - scores[enemySymbol]) * 145;
  }

  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, beamWidth);

  if (maximizingPlayer) {
    let value = -Infinity;
    for (const cand of topCandidates) {
      const cell = board[cand.r][cand.c];
      cell.symbol = activeSym;
      const addedKeys = [];
      let ptsGained = 0;
      for (const pat of cand.myPatterns) {
        if (!scoredRegistry.has(pat.key)) {
          scoredRegistry.add(pat.key);
          addedKeys.push(pat.key);
          ptsGained += pat.points;
        }
      }
      if (cand.myPatterns.length >= 2) {
        ptsGained += cand.myPatterns.length - 1;
      }
      const nextScores = {
        ...scores,
        [activeSym]: (scores[activeSym] || 0) + ptsGained,
      };

      const childVal =
        cand.score * 0.18 +
        alphaBetaSearch(
          engine,
          board,
          boardSize,
          scoredRegistry,
          depth - 1,
          alpha,
          beta,
          false,
          aiSymbol,
          enemySymbol,
          nextScores,
          tier,
          Math.max(5, beamWidth - 2)
        );

      cell.symbol = null;
      for (const k of addedKeys) scoredRegistry.delete(k);

      if (childVal > value) value = childVal;
      if (value > alpha) alpha = value;
      if (alpha >= beta) break; // Beta cut-off
    }
    return value;
  } else {
    let value = Infinity;
    for (const cand of topCandidates) {
      const cell = board[cand.r][cand.c];
      cell.symbol = activeSym;
      const addedKeys = [];
      let ptsGained = 0;
      for (const pat of cand.myPatterns) {
        if (!scoredRegistry.has(pat.key)) {
          scoredRegistry.add(pat.key);
          addedKeys.push(pat.key);
          ptsGained += pat.points;
        }
      }
      if (cand.myPatterns.length >= 2) {
        ptsGained += cand.myPatterns.length - 1;
      }
      const nextScores = {
        ...scores,
        [activeSym]: (scores[activeSym] || 0) + ptsGained,
      };

      const childVal =
        -cand.score * 0.18 +
        alphaBetaSearch(
          engine,
          board,
          boardSize,
          scoredRegistry,
          depth - 1,
          alpha,
          beta,
          true,
          aiSymbol,
          enemySymbol,
          nextScores,
          tier,
          Math.max(5, beamWidth - 2)
        );

      cell.symbol = null;
      for (const k of addedKeys) scoredRegistry.delete(k);

      if (childVal < value) value = childVal;
      if (value < beta) beta = value;
      if (alpha >= beta) break; // Alpha cut-off
    }
    return value;
  }
}

/**
 * Select the optimal (r, c) stone placement for `aiSymbol` across 6 Inquisitor AI tiers:
 * 1: Acolyte (Novice)
 * 2: Deacon (Apprentice)
 * 3: Canon (Depth-2 Tactical Lookahead)
 * 4: Prior (Depth-2 Aggressive Shape Seeker)
 * 5: Grand Inquisitor (Real Depth-3 Alpha-Beta Minimax)
 * 6: Hollow Seraph (Omniscient Depth-3 Alpha-Beta Master)
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
  if (tier === 1 && engine.rng.chance(0.28)) {
    const [r, c] = engine.rng.pick(validMoves);
    return { r, c, score: 1, reason: 'Acolyte Impulse' };
  }

  const baseScores = {
    X: engine.scores?.X || 0,
    O: engine.scores?.O || 0,
  };

  // Evaluate 1-ply score for all valid moves to order the search beam
  const rankedMoves = validMoves.map(([r, c]) => {
    const base = scoreCandidateMove(
      engine,
      board,
      boardSize,
      scoredRegistry,
      r,
      c,
      aiSymbol,
      enemySymbol,
      baseScores,
      tier
    );
    return { r, c, ...base };
  });

  rankedMoves.sort((a, b) => b.score - a.score);

  // Immediate lethal win or mandatory lethal block returns immediately on Tier 2+
  if (tier >= 2 && rankedMoves[0].score >= 9500) {
    return {
      r: rankedMoves[0].r,
      c: rankedMoves[0].c,
      score: Math.round(rankedMoves[0].score),
      reason: rankedMoves[0].reason,
    };
  }

  // Tiers 1 & 2 use fast 1-ply evaluation with controlled tier noise
  if (tier <= 2) {
    let best = rankedMoves[0];
    let bestScore = -Infinity;
    for (const m of rankedMoves) {
      const jitter = tier === 1 ? engine.rng.nextFloat() * 18 : engine.rng.nextFloat() * 7;
      if (m.score + jitter > bestScore) {
        bestScore = m.score + jitter;
        best = m;
      }
    }
    return { r: best.r, c: best.c, score: Math.round(bestScore), reason: best.reason };
  }

  // Tiers 3–6: Real Multi-Ply Alpha-Beta Minimax Search (Depth 2 for Tiers 3–4, Depth 3 for Tiers 5–6)
  const searchDepth = tier >= 5 ? 3 : 2;
  const beamWidth = tier === 6 ? 11 : tier === 5 ? 9 : 7;
  const topCandidates = rankedMoves.slice(0, beamWidth);

  let bestMove = topCandidates[0];
  let bestVal = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const cand of topCandidates) {
    const cell = board[cand.r][cand.c];
    cell.symbol = aiSymbol;
    const addedKeys = [];
    let ptsGained = 0;
    for (const pat of cand.myPatterns) {
      if (!scoredRegistry.has(pat.key)) {
        scoredRegistry.add(pat.key);
        addedKeys.push(pat.key);
        ptsGained += pat.points;
      }
    }
    if (cand.myPatterns.length >= 2) {
      ptsGained += cand.myPatterns.length - 1;
    }

    const nextScores = {
      ...baseScores,
      [aiSymbol]: (baseScores[aiSymbol] || 0) + ptsGained,
    };

    const minimaxVal =
      cand.score * 0.35 +
      alphaBetaSearch(
        engine,
        board,
        boardSize,
        scoredRegistry,
        searchDepth - 1,
        alpha,
        beta,
        false,
        aiSymbol,
        enemySymbol,
        nextScores,
        tier,
        Math.max(5, beamWidth - 2)
      );

    cell.symbol = null;
    for (const k of addedKeys) scoredRegistry.delete(k);

    const jitter = tier === 6 ? 0 : tier === 5 ? engine.rng.nextFloat() * 1.2 : engine.rng.nextFloat() * 3.5;
    const totalVal = minimaxVal + jitter;

    if (totalVal > bestVal) {
      bestVal = totalVal;
      bestMove = cand;
    }
    if (totalVal > alpha) alpha = totalVal;
  }

  const finalReason =
    searchDepth >= 3 && bestMove.reason === 'Altar Positioning'
      ? 'Depth-3 Minimax Calculation'
      : bestMove.reason;

  return {
    r: bestMove.r,
    c: bestMove.c,
    score: Math.round(bestVal),
    reason: finalReason,
  };
}

/**
 * Evaluate whether the AI Warlord should buy a War-Scroll from the 3-Slot In-Battle Shop
 * using its own Gold Coin treasury (no free cards!).
 */
export function selectBestAIShopPurchase(engine, tier = 3) {
  if (!engine.cardsEnabled || tier <= 1) return null;
  if (engine.hands.O.length >= GAME_CONFIG.MAX_HAND_SIZE) return null;

  const tithe = engine.tithe.O || 0;
  let bestSlot = -1;
  let bestUtility = -1;

  for (let i = 0; i < (engine.shop || []).length; i++) {
    const slot = engine.shop[i];
    if (!slot || !slot.cardId) continue;
    const card = getArcanaCardById(slot.cardId);
    if (!card) continue;
    const price = engine.getEffectiveCardPrice(card, 'O');
    if (price > tithe) continue;

    let utility = card.cost * 10;
    if (card.rarity === 'legendary') utility += 35;
    else if (card.rarity === 'epic') utility += 24;
    else if (card.rarity === 'rare') utility += 14;

    if (
      card.effect === 'transmute_piece' ||
      card.effect === 'brimstone_3x3' ||
      card.effect === 'double_consecration' ||
      card.effect === 'omni_ascension' ||
      card.effect === 'place_and_draw'
    ) {
      utility += 22;
    }

    if (utility > bestUtility) {
      bestUtility = utility;
      bestSlot = i;
    }
  }

  if (bestSlot >= 0 && (tier >= 3 || engine.rng.chance(0.65))) {
    return { slotIndex: bestSlot };
  }
  return null;
}

/**
 * Evaluate whether the AI Warlord should cast a War-Scroll Card from its hand before placing its stone
 */
export function selectBestAICardAction(engine, tier = 3) {
  if (!engine.cardsEnabled || tier <= 1) return null;
  if (tier === 2 && !engine.rng.chance(0.5)) return null;

  const hand = engine.hands.O || [];
  const tithe = engine.tithe.O || 0;
  const { board, boardSize } = engine;

  const affordable = hand
    .map((inst, idx) => {
      const card = getArcanaCardById(inst.cardId);
      const effectiveCost = inst.paidInShop ? 0 : card ? card.cost : 99;
      return { inst, card, idx, effectiveCost };
    })
    .filter((item) => item.card && item.effectiveCost <= tithe);

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
    // 1. Single or AoE Shatter / Conversion against dense player formations
    if (
      (card.effect === 'shatter_single' ||
        card.effect === 'shatter_cross' ||
        card.effect === 'brimstone_3x3' ||
        card.effect === 'shatter_diag' ||
        card.effect === 'shatter_2x2' ||
        card.effect === 'drain_and_shatter' ||
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
      if (bestDensity >= 2 || card.effect === 'transmute_piece' || card.effect === 'drain_and_shatter') {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [bestTarget] };
      }
    }

    // 2. Row / Column Cleavers
    if (card.effect === 'guillotine_row' && playerCells.length >= 2) {
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

    if (card.effect === 'guillotine_col' && playerCells.length >= 2) {
      let bestCol = 0;
      let maxCount = 0;
      for (let c = 0; c < boardSize; c++) {
        const count = playerCells.filter(([, pc]) => pc === c).length;
        if (count > maxCount) {
          maxCount = count;
          bestCol = c;
        }
      }
      if (maxCount >= 2) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[0, bestCol]] };
      }
    }

    // 3. Empty-cell deployment / Joker / Cage cards
    if (
      (card.effect === 'sanctified_relic' ||
        card.effect === 'place_shielded_joker' ||
        card.effect === 'place_and_draw') &&
      emptyCells.length > 0
    ) {
      const move = selectBestAIMove(engine, 'O', tier);
      if (move) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[move.r, move.c]] };
      }
    }

    if (card.effect === 'iron_cage' && emptyCells.length > 0 && tier >= 3) {
      const threatMove = selectBestAIMove(engine, 'X', tier);
      if (threatMove && threatMove.score >= 105) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [[threatMove.r, threatMove.c]] };
      }
    }

    // 4. Friendly Shield / Empowerment cards
    if (
      (card.effect === 'aegis_gargoyle' || card.effect === 'empower_adjacent') &&
      aiCells.length > 0
    ) {
      const unshielded = aiCells.filter(([r, c]) => board[r][c].shield === 0);
      if (unshielded.length > 0) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [engine.rng.pick(unshielded)] };
      }
    }

    // 5. Global / Targetless Arcana
    if (card.targetType === 'none') {
      if (tier >= 3 || engine.rng.chance(0.75)) {
        return { handIndex: idx, instanceId: inst.instanceId, targets: [] };
      }
    }
  }

  return null;
}

/**
 * Scan all cells where `enemySymbol` would immediately score next turn if unblocked
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
