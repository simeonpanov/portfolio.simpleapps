const expenseForm = document.querySelector("#expense-form");
const filterForm = document.querySelector("#filter-form");
const resetFiltersBtn = document.querySelector("#reset-filters");
const expensesTableBody = document.querySelector("#expenses-table tbody");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const cancelEditBtn = document.getElementById("cancel-edit");

const totalExpensesEl = document.getElementById("total-expenses");
const itemCountEl = document.getElementById("item-count");
const avgAmountEl = document.getElementById("avg-amount");
const loadingEl = document.getElementById("expenses-loading");
const emptyEl = document.getElementById("expenses-empty");

function setColorScheme() {
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("bg-gray-900");
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

setColorScheme();

function formatDate(dateStr) {
  if (!dateStr) return "";
  const options = { month: "short", day: "numeric" };
  return new Date(dateStr).toLocaleDateString([], options);
}

function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

function updateStats(expenses) {
  const total = expenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount || 0),
    0,
  );
  const count = expenses.length;
  const avg = count ? total / count : 0;

  totalExpensesEl.textContent = formatCurrency(total);
  itemCountEl.textContent = count;
  avgAmountEl.textContent = formatCurrency(avg);
}

function renderTable(expenses) {
  expensesTableBody.innerHTML = "";
  if (expenses.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  expenses.forEach((exp) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-750 transition";
    row.innerHTML = `
      <td class="px-4 py-3 font-medium">${exp.item}</td>
      <td class="px-4 py-3 ${exp.amount > 0 ? "text-red-400" : "text-green-400"} font-medium">${formatCurrency(exp.amount)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-300">${exp.category}</span>
      </td>
      <td class="px-4 py-3 text-gray-400">${formatDate(exp.date)}</td>
      <td class="px-4 py-3">
        <button type="button" class="edit-btn bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-sm mr-2 transition" data-id="${exp.id}">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button type="button" class="delete-btn bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-sm transition" data-id="${exp.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    expensesTableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      fetch(`/expenses/api/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const exp = data.expense;
            document.getElementById("edit-id").value = exp.id;
            document.getElementById("edit-item").value = exp.item;
            document.getElementById("edit-amount").value = exp.amount;
            document.getElementById("edit-category").value = exp.category;
            document.getElementById("edit-date").value = exp.date;
            editModal.classList.remove("hidden");
          }
        })
        .catch((err) => {
          console.error("Edit load error:", err);
          alert("Failed to load expense for editing");
        });
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      const deleteModal = document.getElementById("delete-modal");
      const confirmDeleteBtn = document.getElementById("confirm-delete");
      const cancelDeleteBtn = document.getElementById("cancel-delete");

      deleteModal.dataset.expenseId = id;
      deleteModal.classList.remove("hidden");

      const handleConfirm = () => {
        fetch(`/expenses/api/${id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              fetchExpenses();
            } else {
              alert(data.error || "Failed to delete");
            }
          })
          .catch((err) => {
            console.error("Delete error:", err);
            alert("Failed to delete expense");
          })
          .finally(() => {
            deleteModal.classList.add("hidden");
            confirmDeleteBtn.removeEventListener("click", handleConfirm);
            cancelDeleteBtn.removeEventListener("click", handleCancel);
            window.removeEventListener("click", handleOutsideClick);
          });
      };

      const handleCancel = () => {
        deleteModal.classList.add("hidden");
        confirmDeleteBtn.removeEventListener("click", handleConfirm);
        cancelDeleteBtn.removeEventListener("click", handleCancel);
        window.removeEventListener("click", handleOutsideClick);
      };

      const handleOutsideClick = (e) => {
        if (e.target === deleteModal) {
          handleCancel();
        }
      };

      confirmDeleteBtn.addEventListener("click", handleConfirm);
      cancelDeleteBtn.addEventListener("click", handleCancel);
      window.addEventListener("click", handleOutsideClick);
    });
  });
}

function fetchExpenses(params = "") {
  loadingEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");

  const url = params ? `/expenses/api?${params}` : "/expenses/api";
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      loadingEl.classList.add("hidden");
      if (data.success) {
        renderTable(data.expenses);
        updateStats(data.expenses);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    })
    .catch((err) => {
      loadingEl.classList.add("hidden");
      console.error("Fetch expenses error:", err);
      alert("Failed to load expenses: " + err.message);
    });
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const item = document.querySelector("#item").value.trim();
  const amountStr = document.querySelector("#amount").value.trim();
  const category = document.querySelector("#category").value.trim();
  const date = document.querySelector("#date").value;

  if (!item || !category || !date) {
    alert("Please fill in all fields.");
    return;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount greater than 0.");
    return;
  }

  fetch("/expenses/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, amount, category, date }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        expenseForm.reset();
        const today = new Date().toISOString().split("T")[0];
        document.querySelector("#date").value = today;
        fetchExpenses();
      } else {
        throw new Error(data.error || "Unknown error");
      }
    })
    .catch((err) => {
      console.error("Add expense error:", err);
      alert("Failed to add expense: " + err.message);
    });
});

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const category = document.querySelector("#filter-category").value.trim();
  const start = document.querySelector("#start-date").value;
  const end = document.querySelector("#end-date").value;
  const minStr = document.querySelector("#min-amount").value.trim();
  const maxStr = document.querySelector("#max-amount").value.trim();
  const sort = document.querySelector("#sort").value;
  const order = document.querySelector("#order").value;

  if (category) params.append("category", category);
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);
  if (!isNaN(min)) params.append("min_amount", min);
  if (!isNaN(max)) params.append("max_amount", max);
  if (sort) params.append("sort", sort);
  if (order) params.append("order", order);

  fetchExpenses(params.toString());
});

resetFiltersBtn.addEventListener("click", () => {
  filterForm.reset();
  fetchExpenses();
});

editForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-id").value;
  const item = document.getElementById("edit-item").value.trim();
  const amountStr = document.getElementById("edit-amount").value.trim();
  const category = document.getElementById("edit-category").value.trim();
  const date = document.getElementById("edit-date").value;

  if (!item || !category || !date) {
    alert("Please fill in all fields.");
    return;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount greater than 0.");
    return;
  }

  fetch(`/expenses/api/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, amount, category, date }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        editModal.classList.add("hidden");
        fetchExpenses();
      } else {
        throw new Error(data.error || "Unknown error");
      }
    })
    .catch((err) => {
      console.error("Edit expense error:", err);
      alert("Failed to update expense: " + err.message);
    });
});

cancelEditBtn.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === editModal) {
    editModal.classList.add("hidden");
  }
});

const today = new Date().toISOString().split("T")[0];
document.querySelector("#date").value = today;

fetchExpenses();
