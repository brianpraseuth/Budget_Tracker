// Create new Database in IndexedDB
let db;
const request = indexedDB.open("budget-tracker", 1);

// Create new objectStore to hold offlineTransactions offline payments
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("offlineTransactions", { autoIncrement: true });
};

// Checks to see if the website is offline
request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Error" + event.target.errorCode);
};

// Writes to the offline objectStore for use when back online
function saveRecord(record) {
  const transaction = db.transaction(["offlineTransactions"], "readwrite");
  const store = transaction.objectStore("offlineTransactions");

  store.add(record);
}

// When the database comes back online the saved transactions are then added to the objectStore
function checkDatabase() {
  const transaction = db.transaction(["offlineTransactions"], "readwrite");
  const store = transaction.objectStore("offlineTransactions");

  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(["offlineTransactions"], "readwrite");
        const store = transaction.objectStore("offlineTransactions");
        store.clear();
      });
    }
  };
}
// All actions are run after the browswer comes back online
window.addEventListener("online", checkDatabase);
