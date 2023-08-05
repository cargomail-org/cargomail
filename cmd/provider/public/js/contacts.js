import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

let selectedIds = [];

const contactsFormDialog = new bootstrap.Modal(
  document.querySelector("#contactsFormDialog")
);

const contactsConfirmDialog = new bootstrap.Modal(
  document.querySelector("#contactsConfirmDialog")
);

const contactsForm = document.getElementById("contactsForm");

let historyId = 0;

const contactsTable = new DataTable("#contactsTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(contactsForm.id, 200, "/api/v1/contacts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response === false) {
        return;
      }

      historyId = response.last_history_id;

      callback({ data: response.contacts });
    })();
  },
  columns: [
    { data: "id", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "email_address",
    },
    {
      data: "firstname",
    },
    {
      data: "lastname",
    },
  ],
  rowId: "id",
  columnDefs: [
    {
      targets: 1,
      orderable: false,
      className: "select-checkbox",
      data: null,
      defaultContent: "",
    },
  ],
  select: {
    style: "multi",
    selector: "td:first-child",
    info: true,
  },
  order: [[2, "asc"]],
  dom: "Bfrtip",
  language: {
    buttons: {
      pageLength: "Show %d",
    },
  },
  lengthMenu: [
    [10, 25, 50],
    ["10 rows", "25 rows", "50 rows"],
  ],
  buttons: [
    // "pageLength",
    {
      text: "Refresh",
      action: function () {
        (async () => {
          const response = await api(
            uploadForm.id,
            200,
            "/api/v1/contacts/sync",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ history_id: historyId }),
            }
          );

          if (response === false) {
            return;
          }

          historyId = response.last_history_id;

          for (const contact of response.inserted) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              contactsTable.column(0).data().toArray().indexOf(contact.id) ===
              -1; // !!! must be
            if (notFound) {
              contactsTable.row.add(contact);
            }
          }

          for (const contact of response.updated) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              contactsTable.column(0).data().toArray().indexOf(contact.id) ===
              -1; // !!! must be
            if (notFound) {
              contactsTable.row.add(contact);
            } else {
              contactsTable.row(`#${contact.id}`).data(contact);
            }
          }

          for (const contact of response.trashed) {
            contactsTable.row(`#${contact.id}`).remove();
          }

          for (const contact of response.deleted) {
            contactsTable.row(`#${contact.id}`).remove();
          }

          contactsTable.draw();
        })();
      },
    },
    {
      text: "New",
      className: "contacts-new",
      enabled: true,
      action: function (e) {
        const button = e.currentTarget;
        button.setAttribute("data-mode", "@new");
        contactsFormDialog.show(e);
      },
    },
    {
      text: "Edit",
      className: "contacts-edit",
      enabled: false,
      action: function (e) {
        const button = e.currentTarget;
        button.setAttribute("data-mode", "@edit");
        contactsFormDialog.show(e);
      },
    },
    {
      text: "Delete",
      className: "contacts-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = contactsTable
          .rows(".selected")
          .data()
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          contactsConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedIds.push(selectedData[i]);
          }
        }
      },
    },
  ],
});

contactsTable.on("select.dt deselect.dt", () => {
  const selectedRows = contactsTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  contactsTable
    .buttons([".contacts-edit"])
    .enable(selectedRows == 1 ? true : false);
  contactsTable.buttons([".contacts-delete"]).enable(selected ? true : false);
});

export const showContactsFormDialog = (e) => {
  const formDialog = e.currentTarget;

  const alert = formDialog.querySelector('div[name="alert"]');
  if (alert) alert.remove();

  const button = e.relatedTarget.currentTarget;

  const mode = button.getAttribute("data-mode");

  const modalTitle = formDialog.querySelector(".modal-title");

  const contactIdInput = formDialog.querySelector(".modal-body #contactIdInput");
  const emailInput = formDialog.querySelector(".modal-body #emailInput");
  const firstNameInput = formDialog.querySelector(
    ".modal-body #firstNameInput"
  );
  const lastNameInput = formDialog.querySelector(".modal-body #lastNameInput");

  let contact;

  if (mode == "@new") {
    modalTitle.textContent = "New contact";
  } else if (mode == "@edit") {
    modalTitle.textContent = "Edit contact";
    contact = contactsTable.rows(".selected").data()[0];
  } else {
    modalTitle.textContent = "Contact";
  }

  if (contact) {
    contactIdInput.value = contact.id;
    emailInput.value = contact.email_address;
    firstNameInput.value = contact.firstname;
    lastNameInput.value = contact.lastname;
  } else {
    contactIdInput.value = "";
    emailInput.value = "";
    firstNameInput.value = "";
    lastNameInput.value = "";
  }
};

export const submitFormContact = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    id: form.querySelector('input[name="contactId"]').value,
    email_address: form.querySelector('input[name="email"]').value,
    firstname: form.querySelector('input[name="firstname"]').value,
    lastname: form.querySelector('input[name="lastname"]').value,
  };

  if (formData.id.length == 0) {
    // new
    delete formData.id;

    const response = await api(form.id, 201, "/api/v1/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response === false) {
      return;
    }

    contactsTable.row.add(response).draw();

  } else if (formData.id.length == 32) {
    // edit
    const response = await api(form.id, 200, "/api/v1/contacts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response === false) {
      return;
    }

    contactsTable.row(`#${response.id}`).data(response).draw();
  }

  contactsFormDialog.hide();
};

export const deleteItems = (e) => {
  e?.preventDefault();

  contactsConfirmDialog.hide();

  (async () => {
    const response = await api(uploadForm.id, 200, "api/v1/contacts/trash", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedIds),
    });

    if (response === false) {
      return;
    }

    contactsTable.rows(".selected").remove().draw();
    contactsTable.buttons([".contacts-edit"]).enable(false);
    contactsTable.buttons([".contacts-delete"]).enable(false);
    console.log("Successfully trashed contact(s)");
  })();
};
