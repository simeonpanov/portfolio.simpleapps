document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("add-form");
  const tasksContainer = document.getElementById("tasks");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");

  let currentSort = "";
  let currentSearch = "";
  let searchTimeout;

  flatpickr("#duedate", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    time_24hr: true,
  });

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const [datePart, timePart] = dateStr.split(" ");
    if (!datePart || !timePart) return dateStr;

    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    const date = new Date(y, m - 1, d, hh, mm);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const taskDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    let dateLabel;
    if (taskDate.getTime() === today.getTime()) {
      dateLabel = "Today";
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      dateLabel = "Tomorrow";
    } else {
      dateLabel = date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }

    const timeLabel = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateLabel}, ${timeLabel}`;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function loadTasks() {
    tasksContainer.innerHTML =
      '<li class="text-center py-4 text-gray-500 dark:text-gray-400">Loading tasks...</li>';
    try {
      const params = new URLSearchParams();
      if (currentSort) params.append("sort", currentSort);
      if (currentSearch) params.append("search", currentSearch);

      const res = await fetch(`/todo/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const tasks = await res.json();
      renderTasks(tasks);
    } catch (err) {
      tasksContainer.innerHTML = `<li class="text-center py-4 text-red-500">${err.message}</li>`;
    }
  }

  // Render tasks
  function renderTasks(tasks) {
    if (!tasks.length) {
      tasksContainer.innerHTML = `
        <li class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-2">📭</div>
          <p class="text-gray-500 dark:text-gray-400">No tasks found. Add one above!</p>
        </li>
      `;
      return;
    }

    tasksContainer.innerHTML = tasks
      .map(
        (task) => `
          <li class="task-item bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm p-4 transition-all duration-200 hover:shadow-md"
              data-id="${task.id}" data-completed="${task.completed || false}">
            <div class="flex items-start gap-3">
              <input type="checkbox"
                     class="task-complete mt-1 h-5 w-5 rounded text-blue-500 focus:ring-blue-400"
                     ${task.completed ? "checked" : ""} />

              <div class="flex-1 min-w-0">
                <p class="note font-medium text-gray-900 dark:text-gray-100 break-words ${task.completed ? "line-through opacity-70" : ""}">
                  ${task.note}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="priority-badge px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === "High"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : task.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }">
                    ${task.priority}
                  </span>
                  <span class="category-badge px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ${task.category}
                  </span>
                  <span class="text-gray-500 dark:text-gray-400 text-sm">${formatDate(task.duedate)}</span>
                </div>
              </div>

              <button class="remove-btn p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition"
                      aria-label="Delete task">
                ✕
              </button>
            </div>

            <textarea
              class="task-description mt-3 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
              placeholder="Add details...">${task.description || ""}</textarea>
          </li>
        `,
      )
      .join("");

    tasksContainer.querySelectorAll(".task-item").forEach((taskEl) => {
      const removeBtn = taskEl.querySelector(".remove-btn");
      const desc = taskEl.querySelector(".task-description");

      const resizeTextarea = () => {
        desc.style.height = "auto";
        desc.style.height = Math.min(desc.scrollHeight, 150) + "px";
      };
      desc.addEventListener("input", resizeTextarea);
      resizeTextarea();

      desc.addEventListener("blur", async () => {
        const newDescription = desc.value.trim();
        try {
          await fetch(`/todo/api/update/${taskEl.dataset.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newDescription }),
          });
        } catch (err) {
          alert("Failed to update description");
        }
      });

      const completeCheckbox = taskEl.querySelector(".task-complete");
      completeCheckbox.addEventListener("change", async () => {
        const isCompleted = completeCheckbox.checked;
        try {
          await fetch(`/todo/api/complete/${taskEl.dataset.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: isCompleted }),
          });

          const note = taskEl.querySelector(".note");
          if (isCompleted) {
            note.classList.add("line-through", "opacity-70");
          } else {
            note.classList.remove("line-through", "opacity-70");
          }

          // Check if all tasks are done → confetti!
          const allTasks = document.querySelectorAll(".task-item");
          const allCompleted = Array.from(allTasks).every(
            (task) => task.querySelector(".task-complete").checked,
          );
          if (allCompleted && allTasks.length > 0) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } catch (err) {
          alert("Failed to update task status");
          completeCheckbox.checked = !isCompleted; // revert
        }
      });

      removeBtn.addEventListener("click", async () => {
        taskEl.style.opacity = "0.6";
        removeBtn.disabled = true;
        try {
          const id = taskEl.dataset.id;
          const res = await fetch(`/todo/api/remove/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to remove task");
          loadTasks();
        } catch (err) {
          alert(err.message);
          taskEl.style.opacity = "1";
          removeBtn.disabled = false;
        }
      });
    });
  }

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = addForm.note.value.trim();
    const duedate = addForm.duedate.value.trim();
    const priority = addForm.priority.value;
    const category = addForm.category.value;

    if (!note || !duedate || !priority || !category) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/todo/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          duedate,
          priority,
          category,
          description: "",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        addForm.reset();
        flatpickr("#duedate").clear();
        loadTasks();
      } else {
        alert(data.message || "Error adding task");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  });

  searchInput.addEventListener(
    "input",
    debounce((e) => {
      currentSearch = e.target.value.trim();
      loadTasks();
    }, 300),
  );

  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    loadTasks();
  });

  loadTasks();
});
