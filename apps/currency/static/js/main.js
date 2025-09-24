let mergedCurrencies = [];
let baseCurrency = "USD";

async function loadRates() {
  const cached = sessionStorage.getItem("mergedCurrencies");
  const cachedBase = sessionStorage.getItem("baseCurrency");
  if (cached && cachedBase) {
    mergedCurrencies = JSON.parse(cached);
    baseCurrency = cachedBase;
    fillCurrencyDatalist();
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

  fillCurrencyDatalist();
}

function fillCurrencyDatalist() {
  const fromInput = document.getElementById("from-currency");
  const toInput = document.getElementById("to-currency");
  const datalist = document.getElementById("currencies");

  datalist.innerHTML = "";
  mergedCurrencies.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = `${c.code} – ${c.name}`;
    datalist.appendChild(opt);
  });

  const getName = (code) =>
    (mergedCurrencies.find((c) => c.code === code) || {}).name || "";
  fromInput.value = `${baseCurrency} – ${getName(baseCurrency)}`.trim();
  toInput.value = `EUR – ${getName("EUR")}`.trim();
}

function extractCurrencyCode(val) {
  if (!val) return "";
  return val.split("–")[0].trim();
}

function convertCurrency(amount, from, to) {
  const fromObj = mergedCurrencies.find((c) => c.code === from);
  const toObj = mergedCurrencies.find((c) => c.code === to);
  console.log("fromObj:", fromObj, "toObj:", toObj); // Debug line
  if (!fromObj || !toObj || !fromObj.rate || !toObj.rate) return null;
  const usdAmount = amount / fromObj.rate;
  return (usdAmount * toObj.rate).toFixed(2);
}

function updateConversion() {
  const amountEl = document.getElementById("amount");
  const fromEl = document.getElementById("from-currency");
  const toEl = document.getElementById("to-currency");
  const resultEl = document.getElementById("result");
  const convertedEl = document.getElementById("converted-amount");
  const lastUpdatedEl = document.getElementById("last-updated"); // safe reference

  const amount = parseFloat(amountEl.value);
  const from = extractCurrencyCode(fromEl.value);
  const to = extractCurrencyCode(toEl.value);

  if (!from || !to) {
    convertedEl.value = "";
    resultEl.innerText = "";
    if (lastUpdatedEl) lastUpdatedEl.innerText = "";
    return;
  }

  // --- Existing logic for typed amount ---
  if (!amount) {
    convertedEl.value = "";
    resultEl.innerText = "";
  } else {
    const converted = convertCurrency(amount, from, to);
    if (!converted) {
      convertedEl.value = "";
      resultEl.innerText = "Conversion unavailable";
    } else {
      convertedEl.value = converted;
      const toObj = mergedCurrencies.find((c) => c.code === to);
      resultEl.innerText = `${amount} ${from} = ${converted} ${toObj ? toObj.name : to}`;
    }
  }

  // --- New logic for 1-unit rate ---
  if (lastUpdatedEl) {
    const singleUnit = convertCurrency(1, from, to);
    if (singleUnit !== null) {
      lastUpdatedEl.innerText = `1 ${from} = ${Number(singleUnit).toLocaleString(undefined, { maximumFractionDigits: 5 })} ${to}`;
    } else {
      lastUpdatedEl.innerText = "";
    }
  }
}

function swapCurrencies() {
  const fromEl = document.getElementById("from-currency");
  const toEl = document.getElementById("to-currency");
  const temp = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = temp;
  updateConversion();
}

function attachListeners() {
  document.getElementById("amount").addEventListener("input", updateConversion);
  document
    .getElementById("from-currency")
    .addEventListener("input", updateConversion);
  document
    .getElementById("to-currency")
    .addEventListener("input", updateConversion);
  document
    .getElementById("swap-currencies")
    .addEventListener("click", swapCurrencies);
}

function enableInstantDropdown() {
  const inputs = [
    document.getElementById("from-currency"),
    document.getElementById("to-currency"),
  ];

  inputs.forEach((input) => {
    const triggerDropdown = () => {
      if (input.value === "") {
        input.value = " "; // temporary value
        input.dispatchEvent(new Event("input"));
        setTimeout(() => (input.value = ""), 50); // clear it
      }
    };

    input.addEventListener("mousedown", triggerDropdown); // before focus
    input.addEventListener("click", triggerDropdown); // even if already focused
  });
}

window.onload = async () => {
  try {
    await loadRates();
    attachListeners();
    updateConversion();
    enableInstantDropdown();
  } catch (err) {
    console.error("Failed to load rates:", err);
    document.getElementById("result").innerText =
      "Failed to load exchange rates.";
  }
};
