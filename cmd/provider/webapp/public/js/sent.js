import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

let selectedUris = [];

const sentConfirmDialog = new bootstrap.Modal(
  document.querySelector("#sentConfirmDialog")
);

const sentTable = new DataTable("#sentTable", {
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
        return `<a class="attachmentLink" href="javascript:;" onclick="downloadURI('sentForm', '${link}${full.uri}', '${data}');">${data}</a>`;
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

        const selectedData = sentTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          sentConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
          }
        }
      },
    },
  ],
});

export const deleteSentMessages = (e) => {
  e?.preventDefault();

  sentConfirmDialog.hide();

  sentTable.rows(".selected").remove().draw();
  sentTable.buttons([".files-delete"]).enable(false);
};

