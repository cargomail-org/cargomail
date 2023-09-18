export let userDatabase;
// export let lastDraftId;

export const openDatabase = (dbname) => {
  const openRequest = window.indexedDB.open(dbname, 1);

  openRequest.onerror = () => {
    console.error("Error", openRequest.error);
  };

  openRequest.onsuccess = () => {
    const db = openRequest.result;
    userDatabase = db;

    // setLastDraftId("3c57d616901d9be4a04b06a45effd4b9");

    getLastDraftId();

    // lastDraftId = getLastDraftId();
    // console.log(lastDraftId);
  };

  openRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("compose", { keyPath: "id" });
  };
};

export const getLastDraftId = () => {
  userDatabase
    .transaction("compose")
    .objectStore("compose")
    .get("lastDraftId").onsuccess = (event) => {
    // console.log(`lastDraftId is ${event.target.result?.id}`);
  };
};

export const setLastDraftId = (id) => {
  const objectStore = userDatabase
    .transaction(["compose"], "readwrite")
    .objectStore("compose");

  const request = objectStore.get("lastDraftId");

  request.onerror = (event) => {
    // Handle errors!
  };

  request.onsuccess = (event) => {
    // Get the old value that we want to update
    const data = event.target.result;

    if (data) {
      // update the value(s) in the object that you want to change
      data.id = id;

      // Put this updated object back into the database.
      const requestUpdate = objectStore.put(data);

      requestUpdate.onerror = (event) => {
        // Do something with the error
      };

      requestUpdate.onsuccess = (event) => {
        // Success - the data is updated!
      };
    } else {
      const transaction = userDatabase.transaction(["compose"], "readwrite");

      transaction.oncomplete = (event) => {
        // console.log("All done!");
      };

      transaction.onerror = (event) => {
        // Don't forget to handle errors!
      };

      const request = objectStore.add({ id: "lastDraftId", id });
      request.onsuccess = (event) => {
        // event.target.result === customer.ssn;
      };
    }
  };
};
