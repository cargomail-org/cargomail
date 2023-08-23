import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

$("#toInput").selectize({
  plugins: ["remove_button", "clear_button"],
  delimiter: ",",
  persist: true,
  create: true,
  options: [],
  valueField: "email",
  labelField: "name",
  searchField: ["name", "email"],
});

// const toInput = document.getElementById("toInput");
const subjectInput = document.getElementById("subjectInput");
const messageText = document.getElementById("messageText");

const composeForm = document.getElementById("composeForm");

const subjectHeadings = document.getElementsByClassName("subject-heading");
let bouncerTimeout = null;

const bouncer = (e) => {
  clearTimeout(bouncerTimeout);
  bouncerTimeout = setTimeout(() => {
    [...subjectHeadings].forEach((heading) => {
      heading.textContent = subjectInput.value;
    });
    //TODO save data to server
  }, 2000);
};

// toInput.addEventListener("keyup", (event) => bouncer(event));
subjectInput.addEventListener("keyup", (event) => bouncer(event));
messageText.addEventListener("keyup", (event) => bouncer(event));

let selectedUris = [];

const composeConfirmDialog = new bootstrap.Modal(
  document.querySelector("#composeConfirmDialog")
);

const composeTable = new DataTable("#composeTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ordering: false,
  columns: [
    { data: "uri", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "name",
      render: (data, type, full, meta) => {
        const link = `${window.apiHost}/api/v1/files/`;
        return `<a href="javascript:;" onclick="downloadURI('composeForm', '${link}${full.uri}', '${data}');">${data}</a>`;
      },
    },
    {
      data: "size",
      render: function (data, type) {
        if (type === "display" || type === "filter") {
          return formatBytes(data, 0);
        } else {
          return data;
        }
      },
    },
    {
      data: "createdAt",
      render: function (data, type) {
        if (type === "display" || type === "filter") {
          var d = new Date(data);
          return d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
        } else {
          return data;
        }
      },
    },
  ],
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
  order: [[2, "desc"]],
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
      text: "Delete",
      className: "files-delete",
      enabled: false,
      action: function () {
        selectedUris = [];

        const selectedData = composeTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          composeConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
          }
        }
      },
    },
  ],
});

composeTable.on("select.dt deselect.dt", () => {
  const selected = composeTable.rows({ selected: true }).indexes().length > 0;
  composeTable.buttons([".files-delete"]).enable(selected ? true : false);

  if (selected) {
    document.getElementById("copySelectedFiles").classList.remove("disabled");
  } else {
    document.getElementById("copySelectedFiles").classList.add("disabled");
  }
});

export const deleteCargoes = (e) => {
  e?.preventDefault();

  composeConfirmDialog.hide();

  composeTable.rows(".selected").remove().draw();
  composeTable.buttons([".files-delete"]).enable(false);
  console.log("Successfully deleted file(s)");
};

export const addItems = (items) => {
  for (let i = items.length - 1; i >= 0; i--) {
    let found = false;

    for (let j = 0; j < composeTable.rows().count(); j++) {
      const uri = composeTable.row(j).data().uri;
      if (uri == items[i].uri) {
        found = true;
        break;
      }
    }

    if (!found) {
      composeTable.row.add(items[i]);

      var currentPage = composeTable.page();

      var index = composeTable.row(this).index(),
        rowCount = composeTable.data().length - 1,
        insertedRow = composeTable.row(rowCount).data(),
        tempRow;

      for (var k = rowCount; k > index; k--) {
        tempRow = composeTable.row(k - 1).data();
        composeTable.row(k).data(tempRow);
        composeTable.row(k - 1).data(insertedRow);
      }
      composeTable.page(currentPage).draw(false);
    }
  }
};

const getFullNameOrEmail = (email, firstName, lastName) => {
  const fullName =
    firstName?.length > 0 ? firstName + " " + lastName : lastName;
  if (fullName.length > 0) {
    return fullName;
  }

  return email;
};

export const setComposeContacts = (contacts) => {
  const composeContacts = contacts.map((c) => ({
    email: c.emailAddress,
    name: getFullNameOrEmail(c.emailAddress, c.firstName, c.lastName),
  }));

  const selectize = $("#toInput")[0].selectize;

  const selected = selectize.getValue();

  selectize.clearOptions(true);

  selectize.addOption(composeContacts);

  selectize.setValue(selected);

  selectize.refreshOptions(false);
};
