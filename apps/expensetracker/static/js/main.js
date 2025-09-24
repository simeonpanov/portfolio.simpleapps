const expenseForm = document.querySelector("#expense-form");
const filterForm = document.querySelector("#filter-form");
const expensesTableBody = document.querySelector("#expenses-table tbody");

function handleResponse(response) {
  if (!response.ok)
    return response.text().then((t) => {
      throw new Error(t);
    });
  return response.json();
}

function renderTable(expenses) {
  expensesTableBody.innerHTML = "";
  expenses.forEach((exp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-4 py-2">${exp.id}</td>
      <td class="px-4 py-2">${exp.item}</td>
      <td class="px-4 py-2">${exp.amount.toFixed(2)}</td>
      <td class="px-4 py-2">${exp.category}</td>
      <td class="px-4 py-2">${exp.date}</td>
      <td class="px-4 py-2">
        <button
          class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition"
          data-id="${exp.id}">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    `;
    expensesTableBody.appendChild(row);
  });

  // attach delete handlers
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (confirm("Are you sure you want to delete this expense?")) {
        fetch(`/expenses/api/${id}`, { method: "DELETE" })
          .then(handleResponse)
          .then((data) => {
            if (data.success) {
              fetchExpenses();
            } else {
              alert(data.error || "Failed to delete");
            }
          })
          .catch((err) => console.error(err));
      }
    });
  });
}

function fetchExpenses(params = "") {
  const url = params ? `/expenses/api?${params}` : "/expenses/api";
  fetch(url)
    .then(handleResponse)
    .then((data) => {
      if (data.success) renderTable(data.expenses);
      else alert(data.error);
    })
    .catch((err) => console.error(err));
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const item = document.querySelector("#item").value;
  const amount = parseFloat(document.querySelector("#amount").value);
  const category = document.querySelector("#category").value;
  const date = document.querySelector("#date").value;

  fetch("/expenses/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, amount, category, date }),
  })
    .then(handleResponse)
    .then((data) => {
      if (data.success) {
        expenseForm.reset();
        fetchExpenses();
      } else alert(data.error);
    })
    .catch((err) => console.error(err));
});

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams();
  const category = document.querySelector("#filter-category").value;
  const start = document.querySelector("#start-date").value;
  const end = document.querySelector("#end-date").value;
  const min = parseFloat(document.querySelector("#min-amount").value);
  const max = parseFloat(document.querySelector("#max-amount").value);
  const sort = document.querySelector("#sort").value;
  const order = document.querySelector("#order").value;

  if (category) params.append("category", category);
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  if (!isNaN(min)) params.append("min_amount", min);
  if (!isNaN(max)) params.append("max_amount", max);
  if (sort) params.append("sort", sort);
  if (order) params.append("order", order);

  fetchExpenses(params.toString());
});

// Load all expenses
fetchExpenses();
