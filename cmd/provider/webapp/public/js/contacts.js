import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { setComposeContacts } from "/public/js/compose.js";

let selectedUris = [];

const contactsFormDialog = new bootstrap.Modal(
  document.querySelector("#contactsFormDialog")
);

const contactsConfirmDialog = new bootstrap.Modal(
  document.querySelector("#contactsConfirmDialog")
);

const contactsFormAlert = document.getElementById("contactsFormAlert");
const contactsForm = document.getElementById("contactsForm");

let historyId = 0;

const contactsTable = new DataTable("#contactsTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(
        contactsForm.id,
        200,
        `${window.apiHost}/api/v1/contacts`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response === false) {
        return;
      }

      historyId = response.lastHistoryId;

      callback({ data: response.contacts });

      setComposeContacts(contactsTable.rows().data().toArray());
    })();
  },
  columns: [
    { data: "uri", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "emailAddress",
    },
    {
      data: "firstName",
    },
    {
      data: "lastName",
    },
  ],
  rowId: "uri",
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
            contactsFormAlert.id,
            200,
            `${window.apiHost}/api/v1/contacts/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ historyId: historyId }),
            }
          );

          if (response === false) {
            return;
          }

          contactsTableRefresh(response);
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
        selectedUris = [];

        const selectedData = contactsTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          contactsConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
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

export const contactsTableRefresh = (data) => {
  historyId = data.lastHistoryId;

  for (const contact of data.inserted) {
    // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
    const notFound =
      contactsTable.column(0).data().toArray().indexOf(contact.uri) === -1; // !!! must be
    if (notFound) {
      contactsTable.row.add(contact);
    }
  }

  for (const contact of data.updated) {
    // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
    const notFound =
      contactsTable.column(0).data().toArray().indexOf(contact.uri) === -1; // !!! must be
    if (notFound) {
      contactsTable.row.add(contact);
    } else {
      contactsTable.row(`#${contact.uri}`).data(contact);
    }
  }

  for (const contact of data.trashed) {
    contactsTable.row(`#${contact.uri}`).remove();
  }

  for (const contact of data.deleted) {
    contactsTable.row(`#${contact.uri}`).remove();
  }

  setComposeContacts(contactsTable.rows().data().toArray());

  contactsTable.draw();
};

export const showContactsFormDialog = (e) => {
  const formDialog = e.currentTarget;

  const alert = formDialog.querySelector('div[name="alert"]');
  if (alert) alert.remove();

  const button = e.relatedTarget.currentTarget;

  const mode = button.getAttribute("data-mode");

  const modalTitle = formDialog.querySelector(".modal-title");

  const contactUriInput = formDialog.querySelector(
    ".modal-body #contactUriInput"
  );
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
    contactUriInput.value = contact.uri;
    emailInput.value = contact.emailAddress;
    firstNameInput.value = contact.firstName;
    lastNameInput.value = contact.lastName;
  } else {
    contactUriInput.value = "";
    emailInput.value = "";
    firstNameInput.value = "";
    lastNameInput.value = "";
  }
};

export const submitFormContact = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    uri: form.querySelector('input[name="contactUri"]').value,
    emailAddress: form.querySelector('input[name="emailAddress"]').value,
    firstName: form.querySelector('input[name="firstName"]').value,
    lastName: form.querySelector('input[name="lastName"]').value,
  };

  if (formData.uri.length == 0) {
    // new
    delete formData.uri;

    const response = await api(
      form.id,
      201,
      `${window.apiHost}/api/v1/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (response === false) {
      return;
    }

    contactsTable.row.add(response).draw();
  } else if (formData.uri.length == 32) {
    // edit
    const response = await api(
      form.id,
      200,
      `${window.apiHost}/api/v1/contacts`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (response === false) {
      return;
    }

    contactsTable.row(`#${response.uri}`).data(response).draw();
  }

  contactsFormDialog.hide();

  setComposeContacts(contactsTable.rows().data().toArray());
};

export const deleteContacts = (e) => {
  e?.preventDefault();

  contactsConfirmDialog.hide();

  (async () => {
    const response = await api(
      contactsFormAlert.id,
      200,
      `${window.apiHost}/api/v1/contacts/trash`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: selectedUris }),
      }
    );

    if (response === false) {
      return;
    }

    contactsTable.rows(".selected").remove().draw();
    contactsTable.buttons([".contacts-edit"]).enable(false);
    contactsTable.buttons([".contacts-delete"]).enable(false);

    setComposeContacts(contactsTable.rows().data().toArray());
  })();
};
