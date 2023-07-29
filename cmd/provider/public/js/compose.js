import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

const toInput = document.getElementById("toInput");
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

toInput.addEventListener("keyup", (event) => bouncer(event));
subjectInput.addEventListener("keyup", (event) => bouncer(event));
messageText.addEventListener("keyup", (event) => bouncer(event));

let selectedIds = [];

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
    { data: "id", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "name",
      render: (data, type, full, meta) => {
        const link = "/api/v1/files/";
        return `<a href="javascript:;" onclick="downloadURI('composeForm', '${link}${full.id}', '${data}');">${data}</a>`;
      },
    },
    {
      data: "file_size",
      render: function (data, type) {
        if (type === "display" || type === "filter") {
          return formatBytes(data, 0);
        } else {
          return data;
        }
      },
    },
    {
      data: "created_at",
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
    "pageLength",
    {
      text: "Delete",
      className: "files-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = composeTable
          .rows(".selected")
          .data()
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          composeConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedIds.push(selectedData[i]);
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

export const deleteItems = (e) => {
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
      const id = composeTable.row(j).data().id;
      if (id == items[i].id) {
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
