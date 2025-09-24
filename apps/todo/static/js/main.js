document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("add-form");
  const tasksContainer = document.getElementById("tasks");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");

  let currentSort = "";
  let currentSearch = "";

  flatpickr("#duedate", {
    enableTime: true,
    dateFormat: "d-m-Y H:i",
    time_24hr: true,
    theme: "dark",
  });

  function formatDate(dateStr) {
    if (!dateStr) return "";
    let parts = dateStr.split(/[- :]/);
    if (parts.length >= 5) {
      const [y, m, d, hh, mm] = parts.map(Number);
      return new Date(y, m - 1, d, hh, mm).toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
    return dateStr;
  }

  async function loadTasks() {
    tasksContainer.innerHTML = '<p class="loading">Loading tasks...</p>';
    try {
      const params = new URLSearchParams();
      if (currentSort) params.append("sort", currentSort);
      if (currentSearch) params.append("search", currentSearch);

      const res = await fetch(`/todo/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const tasks = await res.json();
      renderTasks(tasks);
    } catch (err) {
      tasksContainer.innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  function renderTasks(tasks) {
    if (!tasks.length) {
      tasksContainer.innerHTML =
        '<p class="text-gray-500 dark:text-gray-400 text-center">No tasks yet.</p>';
      return;
    }

    tasksContainer.innerHTML = tasks
      .map(
        (task) => `
            <div class="task bg-gray-50 dark:bg-gray-700 rounded-xl shadow-md p-4 space-y-2 transition transform hover:scale-[1.01]" data-id="${task.id}">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="note font-semibold text-gray-900 dark:text-gray-100">${task.note}</span>
                    <span class="duedate text-gray-500 dark:text-gray-300 text-sm">${formatDate(task.duedate)}</span>
                    <span class="priority px-2 py-0.5 rounded-full text-xs ${task.priority.toLowerCase() === "high" ? "bg-red-500 text-white" : task.priority.toLowerCase() === "medium" ? "bg-yellow-400 text-black" : "bg-green-500 text-white"}">
                        ${task.priority}
                    </span>
                    <span class="category px-2 py-0.5 rounded-full text-xs bg-blue-500 dark:bg-blue-400 text-white">
                        ${task.category}
                    </span>
                    <div class="flex gap-1">
                        <button class="edit-btn text-gray-700 dark:text-gray-200 hover:text-blue-500 transition">✎</button>
                        <button class="remove-btn text-gray-700 dark:text-gray-200 hover:text-red-500 transition">✕</button>
                    </div>
                </div>
                <textarea class="task-description w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    placeholder="Add description...">${task.description || ""}</textarea>
            </div>
        `,
      )
      .join("");

    // existing event bindings
    tasksContainer.querySelectorAll(".task").forEach((taskEl) => {
      requestAnimationFrame(() => taskEl.classList.add("show"));

      const removeBtn = taskEl.querySelector(".remove-btn");
      removeBtn.addEventListener("click", async () => {
        taskEl.classList.add("remove");
        removeBtn.disabled = true;
        setTimeout(async () => {
          try {
            const id = taskEl.dataset.id;
            const res = await fetch(`/todo/api/remove/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to remove task");
            loadTasks();
          } catch (err) {
            alert(err.message);
            removeBtn.disabled = false;
          }
        }, 300);
      });

      const editBtn = taskEl.querySelector(".edit-btn");
      const desc = taskEl.querySelector(".task-description");
      editBtn.addEventListener("click", () => {
        desc.classList.toggle("visible");
        desc.focus();
      });

      desc.addEventListener("blur", async () => {
        const id = taskEl.dataset.id;
        const newDescription = desc.value.trim();
        try {
          await fetch(`/todo/api/update/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newDescription }),
          });
        } catch (err) {
          alert("Failed to update description");
        }
      });
    });

    // auto resize textarea
    document.querySelectorAll(".task-description").forEach((desc) => {
      desc.style.height = desc.scrollHeight + "px";
      desc.addEventListener("input", () => {
        desc.style.height = "auto";
        desc.style.height = desc.scrollHeight + "px";
      });
    });
  }
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = addForm.note.value.trim();
    const duedate = addForm.duedate.value.trim();
    const priority = addForm.priority.value;
    const category = addForm.category.value;
    const description = addForm.description
      ? addForm.description.value.trim()
      : "";

    if (!note || !duedate || !priority || !category) return;

    try {
      const res = await fetch("/todo/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          duedate,
          priority,
          category,
          description,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        addForm.reset();
        loadTasks();
      } else {
        alert(data.message || "Error adding task");
      }
    } catch (err) {
      alert("Network error");
    }
  });

  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    loadTasks();
  });
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    loadTasks();
  });

  loadTasks();
});
