import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

const isMcpApp =
  window.parent !== window && window.frameElement && !window.frameElement.src;

let mcpApp = null;
let tasks = [];
let dragSrcIndex = null;

// ─────────────────────────────────────────────
// MCP API calls
// ─────────────────────────────────────────────

async function apiCreateTask(title) {
  if (!isMcpApp) {
    return {
      id: `demo-${Date.now()}`,
      title,
      starred: false,
      order: tasks.length,
    };
  }
  const result = await mcpApp.callServerTool({
    name: "create_task",
    arguments: { title },
  });
  return JSON.parse(result.content[0].text).task;
}

async function apiDeleteTask(taskId) {
  if (!isMcpApp) return;
  await mcpApp.callServerTool({ name: "delete_task", arguments: { taskId } });
}

async function apiUpdateTask(taskId, updates) {
  if (!isMcpApp) return;
  await mcpApp.callServerTool({
    name: "update_task",
    arguments: { taskId, ...updates },
  });
}

// ─────────────────────────────────────────────
// UI actions
// ─────────────────────────────────────────────

async function createTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return;

  const tempId = `temp-${Date.now()}`;
  const tempTask = {
    id: tempId,
    title: trimmed,
    starred: false,
    order: tasks.length,
    _pending: true,
  };
  tasks.push(tempTask);
  render();

  try {
    const created = await apiCreateTask(trimmed);
    const idx = tasks.findIndex((t) => t.id === tempId);
    if (idx !== -1) {
      tasks[idx] = created;
    }
  } catch {
    tasks = tasks.filter((t) => t.id !== tempId);
    showError("Could not create task. Please try again.");
  }
  render();
}

async function deleteTask(taskId) {
  const removed = tasks.find((t) => t.id === taskId);
  tasks = tasks.filter((t) => t.id !== taskId);
  render();

  try {
    await apiDeleteTask(taskId);
  } catch {
    if (removed) tasks.push(removed);
    showError("Could not delete task. Please try again.");
    render();
  }
}

async function toggleStar(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.starred = !task.starred;
  render();

  try {
    await apiUpdateTask(taskId, { starred: task.starred });
  } catch {
    task.starred = !task.starred;
    showError("Could not update task.");
    render();
  }
}

async function reorderTasks(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  const sorted = getSortedTasks();
  const moved = sorted[fromIndex];
  sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);

  // Assign contiguous order values and sync back to tasks array
  sorted.forEach((t, i) => {
    t.order = i;
  });
  tasks = sorted;
  render();

  try {
    await apiUpdateTask(moved.id, { order: toIndex });
  } catch {
    showError("Could not save new order.");
  }
}

function showError(msg) {
  const el = document.getElementById("error-msg");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

// ─────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────

function getSortedTasks() {
  return [...tasks].sort((a, b) => a.order - b.order);
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function render() {
  const list = document.getElementById("task-list");
  const countEl = document.getElementById("task-count");
  if (!list) return;

  const sorted = getSortedTasks();
  if (countEl) countEl.textContent = sorted.length;

  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>No tasks yet. Add one above!</span>
      </div>`;
    return;
  }

  list.innerHTML = sorted
    .map(
      (task, i) => `
    <div
      class="task-item${task._pending ? " pending" : ""}${
        task.starred ? " starred" : ""
      }"
      data-id="${task.id}"
      data-index="${i}"
      draggable="true"
    >
      <div class="drag-handle" title="Drag to reorder">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
          <circle cx="2.5" cy="2.5" r="1.5"/>
          <circle cx="7.5" cy="2.5" r="1.5"/>
          <circle cx="2.5" cy="8" r="1.5"/>
          <circle cx="7.5" cy="8" r="1.5"/>
          <circle cx="2.5" cy="13.5" r="1.5"/>
          <circle cx="7.5" cy="13.5" r="1.5"/>
        </svg>
      </div>
      <button class="star-btn${
        task.starred ? " active" : ""
      }" data-action="star" data-id="${task.id}" title="${
        task.starred ? "Unstar" : "Star"
      }">
        ${task.starred ? "★" : "☆"}
      </button>
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button class="delete-btn" data-action="delete" data-id="${
        task.id
      }" title="Delete task">×</button>
    </div>`
    )
    .join("");

  // Attach event handlers
  list.querySelectorAll(".task-item").forEach((el) => {
    const id = el.dataset.id;
    const index = parseInt(el.dataset.index, 10);

    // Drag-and-drop
    el.addEventListener("dragstart", (e) => {
      dragSrcIndex = index;
      e.dataTransfer.effectAllowed = "move";
      // Small delay so the element isn't hidden before the drag image captures
      requestAnimationFrame(() => el.classList.add("dragging"));
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      list
        .querySelectorAll(".task-item")
        .forEach((t) => t.classList.remove("drag-over"));
    });

    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      list
        .querySelectorAll(".task-item")
        .forEach((t) => t.classList.remove("drag-over"));
      el.classList.add("drag-over");
    });

    el.addEventListener("dragleave", () => {
      el.classList.remove("drag-over");
    });

    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("drag-over");
      const toIndex = parseInt(el.dataset.index, 10);
      if (dragSrcIndex !== null && dragSrcIndex !== toIndex) {
        reorderTasks(dragSrcIndex, toIndex);
      }
      dragSrcIndex = null;
    });

    // Button actions (delegated via data-action)
    el.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.dataset.action === "star") toggleStar(id);
        if (btn.dataset.action === "delete") deleteTask(id);
      });
    });
  });
}

function useDemoTasks() {
  tasks = [
    {
      id: "demo1",
      title: "Review project requirements",
      starred: true,
      order: 0,
    },
    {
      id: "demo2",
      title: "Set up development environment",
      starred: false,
      order: 1,
    },
    { id: "demo3", title: "Write unit tests", starred: false, order: 2 },
  ];
}

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

async function init() {
  const input = document.getElementById("new-task-input");
  const addBtn = document.getElementById("add-task-btn");

  function handleAdd() {
    const val = input.value;
    input.value = "";
    createTask(val);
  }

  addBtn.addEventListener("click", handleAdd);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdd();
  });

  if (isMcpApp) {
    try {
      mcpApp = new App({ name: "Task Meow", version: "1.0.0" });

      // Register ontoolresult BEFORE connecting
      const initDataPromise = new Promise((resolve) => {
        mcpApp.ontoolresult = (result) => {
          resolve(result.structuredContent || {});
        };
      });

      mcpApp.onhostcontextchanged = (ctx) => {
        if (ctx.theme) applyDocumentTheme(ctx.theme);
        if (ctx.styles?.variables)
          applyHostStyleVariables(ctx.styles.variables);
        if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
        if (ctx.safeAreaInsets) {
          const { top, right, bottom, left } = ctx.safeAreaInsets;
          document.body.style.padding = `${top + 16}px ${right + 16}px ${
            bottom + 16
          }px ${left + 16}px`;
        }
      };

      mcpApp.onteardown = async () => ({});

      await mcpApp.connect(
        new PostMessageTransport(window.parent, window.parent)
      );

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MCP init timeout")), 5000)
      );
      const initData = await Promise.race([initDataPromise, timeout]);
      tasks = (initData.tasks || []).sort((a, b) => a.order - b.order);
    } catch (err) {
      console.warn("MCP connection failed, falling back to demo mode:", err);
      useDemoTasks();
    }
  } else {
    useDemoTasks();
  }

  render();
}

document.addEventListener("DOMContentLoaded", () =>
  init().catch(console.error)
);
