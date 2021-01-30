let db;

const request = indexedDB.open('budget');

request.onupgradeneeded = function(event) {
	const db = event.target.result;
	db.createObjectStore("pending", { autoincrement: true });
}

request.onsuccess = function(event) {
	db = event.target.result;

	if(navigator.onLine)
		checkDatabase();
};

request.onerror = function(event) {
	console.log("Woops! " + event.target.errorCode);
}

function saveRecord(record) {
	//Create a transaction on pending
	const transaction = db.transaction( ["pending"], "readwrite");

	//Access the store
	const store = transaction.objectStore('pending');

	//Save the record
	store.add(record);
}

function checkDatabase() {
	//Open a tansaction on pending db
	const transaction = db.transaction( ['pending'], 'readwrite');

	//Access the store
	const store = transaction.objectStore('pending');

	//Get the records from the store
	const allTransactions = store.getAll();

	allTransactions.onsuccess = async function() {
		if(allTransactions.result.length > 0) {
			let res = await fetch('api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(allTransactions.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				}
			});
			res = await res.json();
			
			//Once we have saved all the cached rows, clear them from indexedDb
			const transaction = db.transaction( ['pending'], 'readwrite');

			const store = transaction.objectStore('pending');

			store.clear();
		}
	}
}

window.addEventListener('online', checkDatabase);