export const ROUND_BANK = [
  {
    id: "metano",
    name: "Metano",
    type: "alkane",
    difficulty: 1,
    graph: chainGraph(1)
  },
  {
    id: "etano",
    name: "Etano",
    type: "alkane",
    difficulty: 1,
    graph: chainGraph(2)
  },
  {
    id: "propano",
    name: "Propano",
    type: "alkane",
    difficulty: 1,
    graph: chainGraph(3)
  },
  {
    id: "butano",
    name: "Butano",
    type: "alkane",
    difficulty: 1,
    graph: chainGraph(4)
  },
  {
    id: "hexano",
    name: "Hexano",
    type: "alkane",
    difficulty: 1,
    graph: chainGraph(6)
  },
  {
    id: "heptano",
    name: "Heptano",
    type: "alkane",
    difficulty: 2,
    graph: chainGraph(7)
  },
  {
    id: "octano",
    name: "Octano",
    type: "alkane",
    difficulty: 2,
    graph: chainGraph(8)
  },
  {
    id: "pent-1-eno",
    name: "pent-1-eno",
    type: "alkene",
    difficulty: 2,
    graph: graph(5, [[1, 2, 2], [2, 3, 1], [3, 4, 1], [4, 5, 1]])
  },
  {
    id: "2-metilpentano",
    name: "2-metilpentano",
    type: "alkane",
    difficulty: 2,
    graph: graph(6, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [2, 6, 1]])
  },
  {
    id: "hex-2-eno",
    name: "hex-2-eno",
    type: "alkene",
    difficulty: 2,
    graph: graph(6, [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 6, 1]])
  },
  {
    id: "hex-3-eno",
    name: "hex-3-eno",
    type: "alkene",
    difficulty: 2,
    graph: graph(6, [[1, 2, 1], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 6, 1]])
  },
  {
    id: "but-1-ino",
    name: "but-1-ino",
    type: "alkyne",
    difficulty: 2,
    graph: graph(4, [[1, 2, 3], [2, 3, 1], [3, 4, 1]])
  },
  {
    id: "pent-2-ino",
    name: "pent-2-ino",
    type: "alkyne",
    difficulty: 3,
    graph: graph(5, [[1, 2, 1], [2, 3, 3], [3, 4, 1], [4, 5, 1]])
  },
  {
    id: "hept-3-ino",
    name: "hept-3-ino",
    type: "alkyne",
    difficulty: 3,
    graph: graph(7, [[1, 2, 1], [2, 3, 1], [3, 4, 3], [4, 5, 1], [5, 6, 1], [6, 7, 1]])
  },
  {
    id: "3-metilhexano",
    name: "3-metilhexano",
    type: "alkane",
    difficulty: 3,
    graph: graph(7, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [3, 7, 1]])
  },
  {
    id: "3-metilheptano",
    name: "3-metilheptano",
    type: "alkane",
    difficulty: 3,
    graph: graph(8, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [3, 8, 1]])
  },
  {
    id: "4-metiloctano",
    name: "4-metiloctano",
    type: "alkane",
    difficulty: 3,
    graph: graph(9, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [7, 8, 1], [4, 9, 1]])
  },
  {
    id: "2-metilhex-2-eno",
    name: "2-metilhex-2-eno",
    type: "alkene",
    difficulty: 4,
    graph: graph(7, [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 6, 1], [2, 7, 1]])
  },
  {
    id: "3-metilhex-1-eno",
    name: "3-metilhex-1-eno",
    type: "alkene",
    difficulty: 4,
    graph: graph(7, [[1, 2, 2], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [3, 7, 1]])
  },
  {
    id: "2-3-dimetilpentano",
    name: "2,3-dimetilpentano",
    type: "alkane",
    difficulty: 4,
    graph: graph(7, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [2, 6, 1], [3, 7, 1]])
  },
  {
    id: "2-2-dimetilpentano",
    name: "2,2-dimetilpentano",
    type: "alkane",
    difficulty: 4,
    graph: graph(7, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [2, 6, 1], [2, 7, 1]])
  },
  {
    id: "3-3-dimetilhexano",
    name: "3,3-dimetilhexano",
    type: "alkane",
    difficulty: 4,
    graph: graph(8, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [3, 7, 1], [3, 8, 1]])
  },
  {
    id: "4-metilhept-2-ino",
    name: "4-metilhept-2-ino",
    type: "alkyne",
    difficulty: 4,
    graph: graph(8, [[1, 2, 1], [2, 3, 3], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [4, 8, 1]])
  },
  {
    id: "3-metilhex-2-eno",
    name: "3-metilhex-2-eno",
    type: "alkene",
    difficulty: 5,
    graph: graph(7, [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 6, 1], [3, 7, 1]])
  },
  {
    id: "2-3-dimetilhex-2-eno",
    name: "2,3-dimetilhex-2-eno",
    type: "alkene",
    difficulty: 5,
    graph: graph(8, [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 6, 1], [2, 7, 1], [3, 8, 1]])
  },
  {
    id: "3-etil-2-metilhexano",
    name: "3-etil-2-metilhexano",
    type: "alkane",
    difficulty: 5,
    graph: graph(9, [[1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [2, 7, 1], [3, 8, 1], [8, 9, 1]])
  },
  {
    id: "3-etilhept-2-eno",
    name: "3-etilhept-2-eno",
    type: "alkene",
    difficulty: 5,
    graph: graph(9, [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [3, 8, 1], [8, 9, 1]])
  },
  {
    id: "5-etil-4-metiloct-2-ino",
    name: "5-etil-4-metiloct-2-ino",
    type: "alkyne",
    difficulty: 5,
    graph: graph(11, [[1, 2, 1], [2, 3, 3], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [7, 8, 1], [4, 9, 1], [5, 10, 1], [10, 11, 1]])
  }
];

function chainGraph(size) {
  return graph(size, Array.from({ length: size - 1 }, (_, index) => [index + 1, index + 2, 1]));
}

function graph(size, edges) {
  return {
    nodes: Array.from({ length: size }, (_, index) => ({ id: index + 1 })),
    edges: edges.map(([from, to, order]) => ({ from, to, order }))
  };
}

export function selectRounds(count, maxDifficulty = 5) {
  const candidates = ROUND_BANK
    .filter((round) => round.difficulty <= Number(maxDifficulty))
    .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
  const total = Math.max(1, Number(count) || 1);
  if (candidates.length === 0) return ROUND_BANK.slice(0, total);
  return Array.from({ length: total }, (_, index) => candidates[index % candidates.length]);
}

export function getRoundById(id) {
  return ROUND_BANK.find((round) => round.id === id);
}

export function roundLabel(round) {
  const type = { alkane: "Alcano", alkene: "Alqueno", alkyne: "Alquino" }[round.type] || round.type;
  return `${round.name} · dificultad:${round.difficulty} · ${type}`;
}
