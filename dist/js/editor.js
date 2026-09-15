import { validateCarbonValence } from "./chemistry.js";

export class MoleculeEditor {
  constructor(mount) {
    this.mount = mount;
    this.nodes = [];
    this.edges = [];
    this.selected = [];
    this.nextId = 1;
    this.dragging = null;
    this.drawingBond = null;
    this.tool = "move";
    this.bondOrder = 1;
    this.render();
    this.addCarbon();
    this.addCarbon();
  }

  getGraph() {
    return {
      nodes: this.nodes.map(({ id }) => ({ id })),
      edges: this.edges.map(({ from, to, order }) => ({ from, to, order }))
    };
  }

  reset() {
    this.nodes = [];
    this.edges = [];
    this.selected = [];
    this.drawingBond = null;
    this.nextId = 1;
    this.addCarbon();
    this.addCarbon();
  }

  lock(locked) {
    this.locked = locked;
    this.mount.classList.toggle("locked", locked);
  }

  addCarbon() {
    if (this.locked) return;
    const index = this.nodes.length;
    const columns = 7;
    const spacingX = 86;
    const spacingY = 78;
    const startX = 62;
    const startY = 150;
    const row = Math.floor(index / columns);
    const column = index % columns;
    this.nodes.push({
      id: String(this.nextId++),
      x: startX + column * spacingX,
      y: Math.min(388, startY + row * spacingY)
    });
    this.draw();
  }

  removeSelected() {
    if (this.locked || this.selected.length === 0) return;
    const selectedSet = new Set(this.selected);
    this.nodes = this.nodes.filter((node) => !selectedSet.has(node.id));
    this.edges = this.edges.filter((edge) => !selectedSet.has(edge.from) && !selectedSet.has(edge.to));
    this.selected = [];
    this.draw();
  }

  connectSelected() {
    if (this.locked || this.selected.length !== 2) return;
    const [from, to] = this.selected;
    const existing = this.findEdge(from, to);
    const previousOrder = existing?.order;
    if (existing) {
      existing.order = this.bondOrder;
    } else {
      this.edges.push({ from, to, order: this.bondOrder });
    }
    const validation = validateCarbonValence(this.getGraph());
    if (!validation.ok) {
      if (existing) {
        existing.order = previousOrder;
      } else {
        this.edges = this.edges.filter((edge) => !sameEdge(edge, from, to));
      }
      this.status.textContent = validation.message;
    } else {
      this.status.textContent = "Enlace actualizado.";
    }
    this.draw();
  }

  connectNodes(from, to) {
    if (this.locked || from === to) return;
    const existing = this.findEdge(from, to);
    const previousOrder = existing?.order;
    if (existing) {
      existing.order = this.bondOrder;
    } else {
      this.edges.push({ from, to, order: this.bondOrder });
    }

    const validation = validateCarbonValence(this.getGraph());
    if (!validation.ok) {
      if (existing) {
        existing.order = previousOrder;
      } else {
        this.edges = this.edges.filter((edge) => !sameEdge(edge, from, to));
      }
      this.status.textContent = validation.message;
    } else {
      this.status.textContent = `Enlace ${bondName(this.bondOrder)} creado.`;
      this.selected = [from, to];
    }
    this.draw();
  }

  cycleSelectedBond() {
    if (this.locked || this.selected.length !== 2) return;
    const edge = this.findEdge(this.selected[0], this.selected[1]);
    if (!edge) return;
    const previous = edge.order;
    edge.order = edge.order === 3 ? 1 : edge.order + 1;
    const validation = validateCarbonValence(this.getGraph());
    if (!validation.ok) {
      edge.order = previous;
      this.status.textContent = validation.message;
    } else {
      this.status.textContent = `Enlace ${bondName(edge.order)}.`;
    }
    this.draw();
  }

  removeSelectedBond() {
    if (this.locked || this.selected.length !== 2) return;
    const [a, b] = this.selected;
    this.edges = this.edges.filter((edge) => !sameEdge(edge, a, b));
    this.draw();
  }

  render() {
    this.mount.innerHTML = `
      <section class="editor">
        <div class="toolbar" role="toolbar" aria-label="Herramientas de molécula">
          <button type="button" data-action="add" title="Añadir carbono">C+</button>
          <button type="button" data-action="move" class="active" title="Mover carbonos">Mover</button>
          <button type="button" data-action="single" title="Dibujar enlace simple">-</button>
          <button type="button" data-action="double" title="Enlace doble">=</button>
          <button type="button" data-action="triple" title="Enlace triple">≡</button>
          <button type="button" data-action="cycle" title="Cambiar enlace">↻</button>
          <button type="button" data-action="remove-bond" title="Eliminar enlace">⌫</button>
          <button type="button" data-action="remove-node" title="Eliminar carbono">C-</button>
        </div>
        <svg class="molecule-board" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid meet" aria-label="Editor de molécula"></svg>
        <p class="editor-status"></p>
      </section>
    `;
    this.board = this.mount.querySelector(".molecule-board");
    this.status = this.mount.querySelector(".editor-status");
    this.mount.querySelector(".toolbar").addEventListener("click", (event) => {
      const action = event.target.closest("button")?.dataset.action;
      if (!action) return;
      this.handleAction(action);
    });
    window.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    window.addEventListener("pointerup", (event) => {
      this.handlePointerUp(event);
    });
  }

  handleAction(action) {
    if (action === "add") this.addCarbon();
    if (action === "move") this.setTool("move");
    if (action === "single") this.setBondOrder(1);
    if (action === "double") this.setBondOrder(2);
    if (action === "triple") this.setBondOrder(3);
    if (action === "connect") this.connectSelected();
    if (action === "cycle") this.cycleSelectedBond();
    if (action === "remove-bond") this.removeSelectedBond();
    if (action === "remove-node") this.removeSelected();
  }

  setBondOrder(order) {
    this.bondOrder = order;
    this.setTool("bond");
    this.mount.querySelector(`[data-action="${["", "single", "double", "triple"][order]}"]`).classList.add("active");
    this.status.textContent = `Arrastra desde un carbono hasta otro para crear enlace ${bondName(order)}.`;
  }

  setTool(tool) {
    this.tool = tool;
    this.drawingBond = null;
    this.mount.querySelectorAll(".toolbar button").forEach((button) => button.classList.remove("active"));
    if (tool === "move") {
      this.mount.querySelector('[data-action="move"]').classList.add("active");
      this.status.textContent = "Modo mover: arrastra carbonos o tócalos para seleccionarlos.";
    }
    this.draw();
  }

  draw() {
    if (!this.board) return;
    this.board.innerHTML = "";
    for (const edge of this.edges) this.drawEdge(edge);
    if (this.drawingBond) this.drawDraftBond();
    for (const node of this.nodes) this.drawNode(node);
  }

  drawEdge(edge) {
    const from = this.nodes.find((node) => node.id === edge.from);
    const to = this.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const group = svg("g", { class: "bond", "data-order": edge.order });
    const lines = edgeOffsets(edge.order);
    for (const offset of lines) {
      const points = offsetLine(from, to, offset);
      group.appendChild(svg("line", {
        x1: points.x1,
        y1: points.y1,
        x2: points.x2,
        y2: points.y2,
        class: "bond-line"
      }));
    }
    this.board.appendChild(group);
  }

  drawNode(node) {
    const group = svg("g", {
      class: `atom ${this.selected.includes(node.id) ? "selected" : ""} ${this.tool === "bond" ? "bond-ready" : ""}`,
      transform: `translate(${node.x} ${node.y})`
    });
    group.appendChild(svg("circle", { r: 27 }));
    const text = svg("text", { "text-anchor": "middle", y: 8 });
    text.textContent = "C";
    group.appendChild(text);
    group.addEventListener("pointerdown", (event) => {
      if (this.locked) return;
      event.preventDefault();
      const point = this.pointerPoint(event);
      if (this.tool === "bond") {
        this.drawingBond = { from: node.id, x: point.x, y: point.y, moved: false };
        group.setPointerCapture?.(event.pointerId);
        this.draw();
        return;
      }
      this.dragging = { id: node.id, dx: point.x - node.x, dy: point.y - node.y, moved: false };
      group.setPointerCapture?.(event.pointerId);
    });
    group.addEventListener("pointerup", (event) => {
      if (this.tool === "bond") {
        this.finishBond(event);
        return;
      }
      if (!this.dragging?.moved) this.toggleSelect(node.id);
    });
    this.board.appendChild(group);
  }

  drawDraftBond() {
    const from = this.nodes.find((node) => node.id === this.drawingBond.from);
    if (!from) return;
    const draft = svg("line", {
      x1: from.x,
      y1: from.y,
      x2: this.drawingBond.x,
      y2: this.drawingBond.y,
      class: "bond-line draft-bond"
    });
    this.board.appendChild(draft);
  }

  handlePointerMove(event) {
    if (this.locked) return;
    if (this.drawingBond) {
      const point = this.pointerPoint(event);
      this.drawingBond.x = clamp(point.x, 0, 640);
      this.drawingBond.y = clamp(point.y, 0, 420);
      this.drawingBond.moved = true;
      this.draw();
      return;
    }

    if (!this.dragging) return;
    const node = this.nodes.find((item) => item.id === this.dragging.id);
    if (!node) return;
    const point = this.pointerPoint(event);
    node.x = clamp(point.x - this.dragging.dx, 32, 608);
    node.y = clamp(point.y - this.dragging.dy, 32, 388);
    this.dragging.moved = true;
    this.draw();
  }

  handlePointerUp(event) {
    if (this.drawingBond) {
      this.finishBond(event);
      return;
    }
    this.dragging = null;
  }

  finishBond(event) {
    if (!this.drawingBond) return;
    const start = this.drawingBond.from;
    const point = this.pointerPoint(event);
    const target = this.nodeAtPoint(point, start);
    this.drawingBond = null;
    if (target) {
      this.connectNodes(start, target.id);
    } else {
      this.status.textContent = "Suelta sobre otro carbono para crear el enlace.";
      this.draw();
    }
  }

  toggleSelect(id) {
    if (this.selected.includes(id)) {
      this.selected = this.selected.filter((item) => item !== id);
    } else {
      this.selected = [...this.selected, id].slice(-2);
    }
    this.draw();
  }

  pointerPoint(event) {
    const point = this.board.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(this.board.getScreenCTM().inverse());
  }

  findEdge(a, b) {
    return this.edges.find((edge) => sameEdge(edge, a, b));
  }

  nodeAtPoint(point, exceptId) {
    return this.nodes.find((node) => (
      node.id !== exceptId && Math.hypot(node.x - point.x, node.y - point.y) <= 38
    ));
  }
}

function sameEdge(edge, a, b) {
  return (edge.from === a && edge.to === b) || (edge.from === b && edge.to === a);
}

function svg(name, attrs) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
}

function edgeOffsets(order) {
  if (order === 1) return [0];
  if (order === 2) return [-5, 5];
  return [-8, 0, 8];
}

function offsetLine(from, to, offset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ox = (-dy / length) * offset;
  const oy = (dx / length) * offset;
  return {
    x1: from.x + ox,
    y1: from.y + oy,
    x2: to.x + ox,
    y2: to.y + oy
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bondName(order) {
  return ["", "simple", "doble", "triple"][order];
}
