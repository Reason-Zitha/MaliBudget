
import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const money = (amount) =>
    "R" + Number(amount || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const defaultState = {
    budget: {
      income: "",
      bills: "",
      groceriesBudget: "",
      future: "",
      weeks: ""
    },
    groceries: [],
    expenses: []
  };

  let state = createDefaultState();
  let currentUser = null;
  let saveQueue = Promise.resolve();
  let saveErrorShown = false;
  let appStarted = false;

  function createDefaultState() {
    return {
      budget: { ...defaultState.budget },
      groceries: [],
      expenses: []
    };
  }

  function element(id) {
    return document.getElementById(id);
  }

  function normalizeState(data) {
    return {
      budget: {
        ...defaultState.budget,
        ...(data?.budget || {})
      },
      groceries: Array.isArray(data?.groceries)
        ? data.groceries
        : [],
      expenses: Array.isArray(data?.expenses)
        ? data.expenses
        : []
    };
  }

  // Each signed-in user gets a separate browser backup.
  function localKey(userId) {
    return "maliBudgetData_" + userId;
  }

  function loadLocalState(key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved ? normalizeState(saved) : createDefaultState();
    } catch (error) {
      console.error("Could not read local budget data:", error);
      return createDefaultState();
    }
  }

  // Used only when first transferring the old browser data.
  function loadLegacyState() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("maliBudgetData")
      );

      return saved ? normalizeState(saved) : createDefaultState();
    } catch {
      return createDefaultState();
    }
  }

  function showError(id, message) {
    const target = element(id);
    if (!target) return;

    target.textContent = message;
    target.hidden = false;
  }

  function clearError(id) {
    const target = element(id);
    if (!target) return;

    target.textContent = "";
    target.hidden = true;
  }

  // Save to this user's browser backup and Firestore.
  function saveState() {
    if (!currentUser) {
      console.error("Cannot save: no signed-in user.");
      return;
    }

    const userId = currentUser.uid;
    const key = localKey(userId);

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save the browser backup:", error);
    }

    // Serialize writes so rapid changes do not overwrite each other.
    const stateToSave = JSON.parse(JSON.stringify(state));
    const userDocument = doc(
      db, "users", userId, "appData", "state"
    );

    saveQueue = saveQueue
      .catch(() => {
        // Allow a new save attempt after an earlier failure.
      })
      .then(async () => {
        await setDoc(userDocument, {
          ...stateToSave,
          updatedAt: serverTimestamp()
        });
      })
      .then(() => {
        console.log("MaliBudget data saved to Firestore.");
        saveErrorShown = false;
      })
      .catch((error) => {
        console.error("Firestore save failed:", error);

        if (!saveErrorShown) {
          alert(
            "Your changes were saved in this browser, but could not " +
            "be saved online. Check your internet connection and " +
            "the browser console."
          );
          saveErrorShown = true;
        }

        throw error;
      });

    // Prevent unhandled promise warnings; the error is logged above.
    saveQueue.catch(() => {});
  }

  // ------------------------------------
  // BUDGET CALCULATOR AND DASHBOARD
  // ------------------------------------

  function updateDashboard() {
    const income = Number(state.budget.income) || 0;
    const bills = Number(state.budget.bills) || 0;
    const groceries = Number(state.budget.groceriesBudget) || 0;
    const future = Number(state.budget.future) || 0;

    const remaining = income - bills - groceries - future;

    if (element("dashboard-income")) {
      element("dashboard-income").textContent = money(income);
      element("dashboard-bills").textContent = money(bills);
      element("dashboard-groceries").textContent = money(groceries);
      element("dashboard-remaining").textContent = money(remaining);
    }

    const spent = state.expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );

    const percent = income > 0
      ? Math.min(100, (spent / income) * 100)
      : 0;

    if (element("spending-progress-fill")) {
      element("spending-progress-fill").style.width =
        percent + "%";

      element("overview-spent").textContent =
        money(spent) + " spent";

      element("overview-percent").textContent =
        Math.round(percent) + "%";

      element("overview-message").textContent = income > 0
        ? money(Math.max(0, income - spent)) +
          " of income remains after recorded expenses."
        : "Create a budget to get started.";
    }
  }

  function showBudgetResults() {
    if (!element("result-income")) return;

    const income = Number(state.budget.income) || 0;
    const bills = Number(state.budget.bills) || 0;
    const groceries = Number(state.budget.groceriesBudget) || 0;
    const future = Number(state.budget.future) || 0;
    const weeks = Number(state.budget.weeks) || 0;

    const hasBudget = [
      state.budget.income,
      state.budget.bills,
      state.budget.groceriesBudget,
      state.budget.future,
      state.budget.weeks
    ].every((value) => value !== "");

    if (!hasBudget || weeks < 1) return;

    const allocated = bills + groceries + future;
    const remaining = income - allocated;

    element("result-income").textContent = money(income);
    element("result-allocated").textContent = money(allocated);
    element("result-remaining").textContent = money(remaining);
    element("result-weekly").textContent = money(remaining / weeks);
    element("result-daily").textContent = money(remaining / (weeks * 7));

    element("result-summary").textContent = remaining < 0
      ? "Your planned costs exceed your income. Review your budget."
      : "Your plan has been calculated successfully.";
  }

  function setupBudgetForm() {
    const budgetForm = element("budget-form");
    if (!budgetForm) return;

    const fields = [
      "income",
      "bills",
      "groceries-budget",
      "future",
      "weeks"
    ];

    fields.forEach((id) => {
      const key = id === "groceries-budget"
        ? "groceriesBudget"
        : id;

      element(id).value = state.budget[key];
    });

    showBudgetResults();

    budgetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearError("planner-error");

      const values = {
        income: element("income").value,
        bills: element("bills").value,
        groceriesBudget: element("groceries-budget").value,
        future: element("future").value,
        weeks: element("weeks").value
      };

      if (Object.values(values).some((value) => value.trim() === "")) {
        showError("planner-error", "Please complete every field.");
        return;
      }

      const income = Number(values.income);
      const bills = Number(values.bills);
      const groceries = Number(values.groceriesBudget);
      const future = Number(values.future);
      const weeks = Number(values.weeks);

      if (
        ![income, bills, groceries, future, weeks].every(Number.isFinite) ||
        [income, bills, groceries, future].some((value) => value < 0) ||
        !Number.isInteger(weeks) ||
        weeks < 1 ||
        weeks > 52
      ) {
        showError(
          "planner-error",
          "Enter valid amounts and a whole number of weeks between 1 and 52."
        );
        return;
      }

      state.budget = values;
      saveState();
      showBudgetResults();
      updateDashboard();
    });

    element("reset-button").addEventListener("click", () => {
      if (!confirm("Clear your budget inputs and results?")) return;

      budgetForm.reset();
      state.budget = { ...defaultState.budget };
      saveState();

      [
        "result-income",
        "result-allocated",
        "result-remaining",
        "result-weekly",
        "result-daily"
      ].forEach((id) => {
        element(id).textContent = money(0);
      });

      element("result-summary").textContent =
        "Complete the form and calculate your budget.";

      clearError("planner-error");
      updateDashboard();
    });
  }

  // ------------------------------------
  // GROCERY LIST
  // ------------------------------------

  function renderGroceries() {
    const list = element("grocery-list");
    if (!list) return;

    list.replaceChildren();

    if (state.groceries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent =
        "Your grocery list is empty. Add your first item above.";
      list.appendChild(empty);
    }

    state.groceries.forEach((item) => {
      const row = document.createElement("div");
      row.className = "item-row";

      const details = document.createElement("div");
      details.className = "item-details";

      const name = document.createElement("strong");
      name.textContent = item.name;

      const description = document.createElement("p");
      description.textContent =
        `${item.quantity} × ${money(item.price)} each`;

      details.append(name, description);

      const total = document.createElement("strong");
      total.textContent = money(
        Number(item.quantity) * Number(item.price)
      );

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button secondary";
      remove.textContent = "Remove";

      remove.addEventListener("click", () => {
        state.groceries = state.groceries.filter(
          (grocery) => grocery.id !== item.id
        );

        saveState();
        renderGroceries();
      });

      row.append(details, total, remove);
      list.appendChild(row);
    });

    const total = state.groceries.reduce(
      (sum, item) =>
        sum + Number(item.quantity) * Number(item.price),
      0
    );

    if (element("grocery-total")) {
      element("grocery-total").textContent = money(total);
    }
  }

  function setupGroceryForm() {
    const groceryForm = element("grocery-form");
    if (!groceryForm) return;

    element("grocery-quantity").value = "1";

    groceryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearError("grocery-error");

      const name = element("grocery-item").value.trim();
      const quantity = Number(element("grocery-quantity").value);
      const priceInput = element("grocery-price");
      const price = Number(priceInput.value);

      if (!name) {
        showError("grocery-error", "Please enter an item name.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        showError("grocery-error", "Enter a quantity between 1 and 999.");
        return;
      }

      if (
        priceInput.value.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        showError("grocery-error", "Enter a valid price.");
        return;
      }

      state.groceries.push({
        id: Date.now() + Math.random(),
        name,
        quantity,
        price
      });

      saveState();
      renderGroceries();

      groceryForm.reset();
      element("grocery-quantity").value = "1";
    });
  }

  // ------------------------------------
  // EXPENSE TRACKER
  // ------------------------------------

  function renderExpenses() {
    const list = element("expense-list");
    if (!list) return;

    list.replaceChildren();

    if (state.expenses.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent =
        "No expenses yet. Add your first expense above.";
      list.appendChild(empty);
    }

    state.expenses.forEach((expense) => {
      const row = document.createElement("div");
      row.className = "item-row";

      const details = document.createElement("div");
      details.className = "item-details";

      const name = document.createElement("strong");
      name.textContent = expense.description;

      const category = document.createElement("p");
      category.textContent = expense.category;

      details.append(name, category);

      const amount = document.createElement("strong");
      amount.textContent = money(expense.amount);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button secondary";
      remove.textContent = "Remove";

      remove.addEventListener("click", () => {
        state.expenses = state.expenses.filter(
          (item) => item.id !== expense.id
        );

        saveState();
        renderExpenses();
        updateDashboard();
      });

      row.append(details, amount, remove);
      list.appendChild(row);
    });

    const total = state.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    if (element("expenses-total")) {
      element("expenses-total").textContent = money(total);
    }
  }

  function setupExpenseForm() {
    const expenseForm = element("expense-form");
    if (!expenseForm) return;

    expenseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearError("expense-error");

      const description =
        element("expense-description").value.trim();

      const category = element("expense-category").value;
      const amountInput = element("expense-amount");
      const amount = Number(amountInput.value);

      if (!description) {
        showError("expense-error", "Please describe this expense.");
        return;
      }

      if (
        amountInput.value.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        showError("expense-error", "Enter an amount greater than zero.");
        return;
      }

      state.expenses.push({
        id: Date.now() + Math.random(),
        description,
        category,
        amount,
        date: new Date().toISOString()
      });

      saveState();
      renderExpenses();
      updateDashboard();
      expenseForm.reset();
    });
  }

  // ------------------------------------
  // EXPORT EXPENSES TO CSV
  // ------------------------------------

  function setupExportButton() {
    const exportButton = element("export-button");
    if (!exportButton) return;

    exportButton.addEventListener("click", () => {
      if (state.expenses.length === 0) {
        alert("Add an expense before exporting.");
        return;
      }

      const escapeCSV = (value) =>
        '"' + String(value).replace(/"/g, '""') + '"';

      const rows = [
        ["Description", "Category", "Amount (ZAR)", "Date"],
        ...state.expenses.map((expense) => [
          expense.description,
          expense.category,
          Number(expense.amount).toFixed(2),
          expense.date
        ])
      ];

      const csv = rows
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "malibudget-expenses.csv";
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  // ------------------------------------
  // START AFTER FIREBASE AUTHENTICATION
  // ------------------------------------

  function startApp() {
    if (appStarted) return;
    appStarted = true;

    setupBudgetForm();
    setupGroceryForm();
    setupExpenseForm();
    setupExportButton();

    renderGroceries();
    renderExpenses();
    updateDashboard();

    console.log("MaliBudget is ready.");
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    if (appStarted) return;

    currentUser = user;

    const userDocument = doc(
      db, "users", user.uid, "appData", "state"
    );

    try {
      const snapshot = await getDoc(userDocument);

      if (snapshot.exists()) {
        // Firestore is the main source when data already exists online.
        state = normalizeState(snapshot.data());

        localStorage.setItem(
          localKey(user.uid),
          JSON.stringify(state)
        );

        console.log("MaliBudget data loaded from Firestore.");
      } else {
        // First visit: preserve this browser's existing data.
        // Transfer it to the currently signed-in account.
        const legacyState = loadLegacyState();
        const userLocalState = loadLocalState(localKey(user.uid));

        const legacyKeyExists =
          localStorage.getItem("maliBudgetData") !== null;

        state = legacyKeyExists ? legacyState : userLocalState;

        await setDoc(userDocument, {
          ...state,
          updatedAt: serverTimestamp()
        });

        localStorage.setItem(
          localKey(user.uid),
          JSON.stringify(state)
        );

        console.log("MaliBudget data transferred to Firestore.");
      }

      startApp();
    } catch (error) {
      console.error("Could not load Firestore data:", error);

      // Allow the app to open with the signed-in user's browser backup.
      state = loadLocalState(localKey(user.uid));

      alert(
        "MaliBudget could not load its online data. " +
        "The page will open using the local browser backup. " +
        "Check your internet connection and browser console."
      );

      startApp();
    }
  });
});
