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

let historyId = 0;

let selectedIds = [];

const contactsFormDialog = new bootstrap.Modal(document.querySelector("#contactsFormDialog"));

const contactsConfirmDialog = new bootstrap.Modal(document.querySelector("#contactsConfirmDialog"));

const contactsFormAlert = document.getElementById("contactsFormAlert");
const contactsForm = document.getElementById("contactsForm");

const contactsTable = new DataTable("#contactsTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(contactsForm.id, 200, `${window.mailboxApiHost}/api/v1/contacts/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response === false) {
        return;
      }

      historyId = response.lastHistoryId;

      callback({ data: response.contacts });

      setComposeContacts(contactsTable.rows().data().toArray());
    })();
  },
  columns: [
    { data: "id", visible: false, searchable: false },
    { data: null, visible: true, orderable: false },
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
    [5, 10, 15, 25],
    [5, 10, 15, 25],
  ],
  pageLength: $(document).height() >= 700 ? ($(document).height() >= 900 ? 15 : 10) : 5,
  buttons: [
    // "pageLength",
    {
      text: "Refresh",
      action: function () {
        (async () => {
          const response = await api(contactsFormAlert.id, 200, `${window.mailboxApiHost}/api/v1/contacts/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ historyId: historyId }),
          });

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

$(window).resize(function () {
  if ($(this).height() >= "700") {
    if ($(this).height() >= "900") {
      contactsTable.page.len(15).draw(false);
    } else {
      contactsTable.page.len(10).draw(false);
    }
  } else {
    contactsTable.page.len(5).draw(false);
  }
});

contactsTable.on("select.dt deselect.dt", () => {
  const selectedRows = contactsTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  contactsTable.buttons([".contacts-edit"]).enable(selectedRows == 1 ? true : false);
  contactsTable.buttons([".contacts-delete"]).enable(selected ? true : false);
});

export const contactsTableRefresh = (data) => {
  historyId = data.lastHistoryId;

  for (const contact of data.inserted) {
    // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
    const notFound = contactsTable.column(0).data().toArray().indexOf(contact.id) === -1; // !!! must be
    if (notFound) {
      contactsTable.row.add(contact);
    }
  }

  for (const contact of data.updated) {
    // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
    const notFound = contactsTable.column(0).data().toArray().indexOf(contact.id) === -1; // !!! must be
    if (notFound) {
      contactsTable.row.add(contact);
    } else {
      contactsTable.row(`#${contact.id}`).data(contact);
    }
  }

  for (const contact of data.trashed) {
    contactsTable.row(`#${contact.id}`).remove();
  }

  for (const contact of data.deleted) {
    contactsTable.row(`#${contact.id}`).remove();
  }

  setComposeContacts(contactsTable.rows().data().toArray());

  contactsTable.draw(false);
};

export const showContactsFormDialog = (e) => {
  const formDialog = e.currentTarget;

  const alert = formDialog.querySelector('div[name="alert"]');
  if (alert) alert.remove();

  const button = e.relatedTarget.currentTarget;

  const mode = button.getAttribute("data-mode");

  const modalTitle = formDialog.querySelector(".modal-title");

  const contactIdInput = formDialog.querySelector(".modal-body #contactIdInput");
  const emailInput = formDialog.querySelector(".modal-body #emailInput");
  const firstNameInput = formDialog.querySelector(".modal-body #firstNameInput");
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
    emailInput.value = contact.emailAddress;
    firstNameInput.value = contact.firstName;
    lastNameInput.value = contact.lastName;
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
    emailAddress: form.querySelector('input[name="emailAddress"]').value,
    firstName: form.querySelector('input[name="firstName"]').value,
    lastName: form.querySelector('input[name="lastName"]').value,
  };

  if (formData.id.length == 0) {
    // new
    delete formData.id;

    const response = await api(form.id, 201, `${window.mailboxApiHost}/api/v1/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response === false) {
      return;
    }

    contactsTable.row.add(response).draw(false);
  } else if (formData.id.length == 32) {
    // edit
    const response = await api(form.id, 200, `${window.mailboxApiHost}/api/v1/contacts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response === false) {
      return;
    }

    contactsTable.row(`#${response.id}`).data(response).draw(false);
  }

  contactsFormDialog.hide();

  setComposeContacts(contactsTable.rows().data().toArray());
};

export const deleteContacts = (e) => {
  e?.preventDefault();

  contactsConfirmDialog.hide();

  (async () => {
    const response = await api(contactsFormAlert.id, 200, `${window.mailboxApiHost}/api/v1/contacts/trash`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (response === false) {
      return;
    }

    contactsTable.rows(".selected").remove().draw(false);
    contactsTable.buttons([".contacts-edit"]).enable(false);
    contactsTable.buttons([".contacts-delete"]).enable(false);

    setComposeContacts(contactsTable.rows().data().toArray());
  })();
};
