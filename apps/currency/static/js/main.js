let mergedCurrencies = [];
let baseCurrency = "USD";

const fromInput = document.getElementById("from-currency-input");
const toInput = document.getElementById("to-currency-input");
const fromMenu = document.getElementById("from-currency-menu");
const toMenu = document.getElementById("to-currency-menu");

document.addEventListener("click", (e) => {
  if (!fromInput.contains(e.target) && !fromMenu.contains(e.target)) {
    fromMenu.classList.add("hidden");
  }
  if (!toInput.contains(e.target) && !toMenu.contains(e.target)) {
    toMenu.classList.add("hidden");
  }
});

function initDropdown(input, menu) {
  input.addEventListener("input", (e) => {
    if (mergedCurrencies.length > 0) {
      filterAndShow(input, menu, e.target.value);
    }
  });
  input.addEventListener("focus", () => {
    if (mergedCurrencies.length > 0) {
      filterAndShow(input, menu, input.value);
    }
  });
}

function filterAndShow(input, menu, query) {
  if (mergedCurrencies.length === 0) {
    menu.classList.add("hidden");
    return;
  }

  menu.innerHTML = "";
  const cleanQuery = query.trim().toLowerCase();

  const priorityCodes = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CHF",
    "CNY",
    "INR",
  ];

  const currenciesWithPriority = mergedCurrencies.map((c) => ({
    ...c,
    sortPriority: priorityCodes.includes(c.code)
      ? priorityCodes.indexOf(c.code)
      : 999,
  }));

  const filtered =
    cleanQuery === ""
      ? currenciesWithPriority
      : currenciesWithPriority.filter((c) =>
          `${c.code} – ${c.name}`.toLowerCase().includes(cleanQuery),
        );

  const results = filtered
    .sort((a, b) => {
      // First by priority, then by code
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return a.code.localeCompare(b.code);
    })
    .slice(0, 30);

  if (results.length === 0) {
    menu.classList.remove("hidden");
    menu.innerHTML =
      '<div class="currency-item text-gray-500 dark:text-gray-400">No match</div>';
    return;
  }

  results.forEach((c) => {
    const item = document.createElement("div");
    item.className = `
      px-4 py-2 text-sm text-gray-800 dark:text-gray-200
      cursor-pointer flex items-center justify-between
      hover:bg-blue-500 hover:text-white
    `;
    item.innerHTML = `
      <span class="font-medium">${c.code}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">${c.name}</span>
    `;
    item.addEventListener("click", () => {
      input.value = `${c.code} – ${c.name}`;
      menu.classList.add("hidden");
      updateConversion();
    });
    menu.appendChild(item);
  });

  menu.classList.remove("hidden");
}

function setDefaultCurrencies() {
  const getName = (code) =>
    mergedCurrencies.find((c) => c.code === code)?.name || "";
  fromInput.value = `USD – ${getName("USD")}`;
  toInput.value = `EUR – ${getName("EUR")}`;
}

async function loadRates() {
  const cached = sessionStorage.getItem("mergedCurrencies");
  const cachedBase = sessionStorage.getItem("baseCurrency");
  if (cached && cachedBase) {
    mergedCurrencies = JSON.parse(cached);
    baseCurrency = cachedBase;
    return;
  }

  const res = await fetch("/currency/rates.json");
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const data = await res.json();
  const rates = data.rates || {};

  mergedCurrencies = (window.currencies || []).map((c) => ({
    ...c,
    rate: rates[c.code] || 0,
  }));

  baseCurrency = "USD";
  sessionStorage.setItem("mergedCurrencies", JSON.stringify(mergedCurrencies));
  sessionStorage.setItem("baseCurrency", baseCurrency);
}

function extractCurrencyCode(val) {
  if (!val) return "";
  return val.split("–")[0].trim();
}

function convertCurrency(amount, from, to, maxDecimals = 2) {
  const fromObj = mergedCurrencies.find((c) => c.code === from);
  const toObj = mergedCurrencies.find((c) => c.code === to);
  if (!fromObj || !toObj || !fromObj.rate || !toObj.rate) return null;

  const usdAmount = amount / fromObj.rate;
  const result = usdAmount * toObj.rate;

  const decimals = Math.max(2, Math.min(maxDecimals, 8));
  return result.toLocaleString("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
}

function updateConversion() {
  const amountEl = document.getElementById("amount");
  const fromEl = document.getElementById("from-currency-input");
  const toEl = document.getElementById("to-currency-input");
  const resultEl = document.getElementById("result");
  const convertedEl = document.getElementById("converted-amount");
  const lastUpdatedEl = document.getElementById("last-updated");

  const amount = parseFloat(amountEl.value);
  const from = extractCurrencyCode(fromEl.value);
  const to = extractCurrencyCode(toEl.value);

  if (!amount) {
    convertedEl.value = "";
    resultEl.innerText = "";
  } else {
    const converted = convertCurrency(amount, from, to, 6);
    if (!converted) {
      convertedEl.value = "";
      resultEl.innerText = "Conversion unavailable";
    } else {
      convertedEl.value = converted;
      const toObj = mergedCurrencies.find((c) => c.code === to);
      resultEl.innerText = `${amount} ${from} = ${converted} ${toObj ? toObj.name : to}`;
    }
  }

  if (lastUpdatedEl) {
    const singleUnit = convertCurrency(1, from, to, 8);
    if (singleUnit !== null) {
      lastUpdatedEl.innerText = `1 ${from} = ${singleUnit} ${to}`;
    } else {
      lastUpdatedEl.innerText = "";
    }
  }
}

function swapCurrencies() {
  const temp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = temp;
  updateConversion();
}

function attachListeners() {
  document.getElementById("amount").addEventListener("input", updateConversion);
  fromInput.addEventListener("input", updateConversion); // ✅
  toInput.addEventListener("input", updateConversion); // ✅
  document
    .getElementById("swap-currencies")
    .addEventListener("click", swapCurrencies);
}

function renderCurrencyChart() {
  const chartContainer = document.getElementById("chart-bars");
  if (!chartContainer || mergedCurrencies.length === 0) return;

  const topCurrencies = ["EUR", "GBP", "JPY", "CAD", "AUD"];
  const usdRate = mergedCurrencies.find((c) => c.code === "USD")?.rate || 1;

  let html = "";
  topCurrencies.forEach((code) => {
    const currency = mergedCurrencies.find((c) => c.code === code);
    if (!currency || !currency.rate) return;

    const rate = currency.rate / usdRate;
    const displayRate = code === "JPY" ? rate / 100 : rate;
    const barWidth = Math.min(100, displayRate * 60);

    html += `
      <div class="flex items-center gap-3">
        <!-- Currency code: use dark:text-gray-200 for light-on-dark -->
        <span class="text-sm font-medium w-10 text-gray-800 dark:text-gray-200">${code}</span>
        <div class="flex-1 flex items-center gap-2">
          <!-- Background bar -->
          <div class="h-2.5 rounded-full bg-blue-200 dark:bg-blue-900/50 w-full">
            <!-- Fill bar -->
            <div
              class="h-full rounded-full bg-blue-500 dark:bg-blue-400"
              style="width: ${barWidth}%"
            ></div>
          </div>
          <!-- Rate value -->
          <span class="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
            ${rate.toFixed(code === "JPY" ? 1 : 2)}
          </span>
        </div>
      </div>
    `;
  });

  chartContainer.innerHTML = html;
}

window.onload = async () => {
  try {
    await loadRates();
    setDefaultCurrencies();
    initDropdown(fromInput, fromMenu);
    initDropdown(toInput, toMenu);
    attachListeners();
    updateConversion();
    renderCurrencyChart();
  } catch (err) {
    console.error("Failed to load rates:", err);
    document.getElementById("result").innerText =
      "Failed to load exchange rates.";
  }
};
