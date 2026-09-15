export function normalizeGraph(graph) {
  return {
    nodes: (graph.nodes || []).map((node) => ({ id: String(node.id) })),
    edges: (graph.edges || []).map((edge) => ({
      from: String(edge.from),
      to: String(edge.to),
      order: Number(edge.order)
    }))
  };
}

export function validateCarbonValence(graph) {
  const normalized = normalizeGraph(graph);
  const valence = Object.fromEntries(normalized.nodes.map((node) => [node.id, 0]));

  for (const edge of normalized.edges) {
    if (!valence.hasOwnProperty(edge.from) || !valence.hasOwnProperty(edge.to)) {
      return { ok: false, message: "Hay un enlace con un carbono inexistente." };
    }
    if (edge.from === edge.to) {
      return { ok: false, message: "Un carbono no puede enlazarse consigo mismo." };
    }
    if (![1, 2, 3].includes(edge.order)) {
      return { ok: false, message: "Hay un enlace con orden inválido." };
    }
    valence[edge.from] += edge.order;
    valence[edge.to] += edge.order;
  }

  const overloaded = Object.entries(valence).find(([, value]) => value > 4);
  if (overloaded) {
    return { ok: false, message: "Un carbono supera valencia 4." };
  }

  return { ok: true, message: "Estructura químicamente posible." };
}

export function isSameMolecule(answerGraph, targetGraph) {
  const answer = normalizeGraph(answerGraph);
  const target = normalizeGraph(targetGraph);

  if (answer.nodes.length !== target.nodes.length || answer.edges.length !== target.edges.length) {
    return false;
  }
  if (!validateCarbonValence(answer).ok) return false;

  const answerIds = answer.nodes.map((node) => node.id);
  const targetIds = target.nodes.map((node) => node.id);
  const answerAdj = adjacency(answer);
  const targetAdj = adjacency(target);
  const answerSignatures = signatures(answerIds, answerAdj);
  const targetSignatures = signatures(targetIds, targetAdj);

  const candidates = Object.fromEntries(answerIds.map((id) => [
    id,
    targetIds.filter((targetId) => answerSignatures[id] === targetSignatures[targetId])
  ]));

  if (Object.values(candidates).some((items) => items.length === 0)) return false;

  const orderedAnswerIds = [...answerIds].sort((a, b) => candidates[a].length - candidates[b].length);
  return backtrack(0, orderedAnswerIds, candidates, {}, new Set(), answerAdj, targetAdj);
}

function adjacency(graph) {
  const map = Object.fromEntries(graph.nodes.map((node) => [node.id, new Map()]));
  for (const edge of graph.edges) {
    map[edge.from].set(edge.to, edge.order);
    map[edge.to].set(edge.from, edge.order);
  }
  return map;
}

function signatures(ids, adj) {
  return Object.fromEntries(ids.map((id) => {
    const orders = [...adj[id].values()].sort().join(",");
    const valence = [...adj[id].values()].reduce((sum, order) => sum + order, 0);
    return [id, `${adj[id].size}|${valence}|${orders}`];
  }));
}

function backtrack(index, answerIds, candidates, map, usedTargets, answerAdj, targetAdj) {
  if (index === answerIds.length) return true;

  const answerId = answerIds[index];
  for (const targetId of candidates[answerId]) {
    if (usedTargets.has(targetId)) continue;
    if (!isCompatible(answerId, targetId, map, answerAdj, targetAdj)) continue;

    map[answerId] = targetId;
    usedTargets.add(targetId);
    if (backtrack(index + 1, answerIds, candidates, map, usedTargets, answerAdj, targetAdj)) {
      return true;
    }
    usedTargets.delete(targetId);
    delete map[answerId];
  }
  return false;
}

function isCompatible(answerId, targetId, map, answerAdj, targetAdj) {
  for (const [mappedAnswerId, mappedTargetId] of Object.entries(map)) {
    const answerOrder = answerAdj[answerId].get(mappedAnswerId) || 0;
    const targetOrder = targetAdj[targetId].get(mappedTargetId) || 0;
    if (answerOrder !== targetOrder) return false;
  }
  return true;
}
