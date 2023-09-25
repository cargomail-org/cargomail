import DataTable from "datatables.net";

import $ from "jquery";

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { formatBytes } from "/public/js/menu.js";
import {
  parsePayload,
  composePayload,
  createSubjectSnippet,
  createPlainContentSnippet,
} from "/public/js/utils.js";

export const showDetail = (row) => {
  const rowData = row.data();

  if (!rowData?.payload) {
    console.log("detail-table no data");
    return;
  }

  const parsed = parsePayload(rowData.id, rowData.payload);

  const testData = [
    { id: 1, fileName: "test.txt", size: 1234 },
    { id: 2, fileName: "file.pdf", size: 456789 },
  ];

  //   const testData = [];

  const form = $(`
    <form class="detail-form" method="" action="#" enctype="multipart/form-data" autocomplete="off">
        <div class="form-floating mb-0">
            <span contenteditable="false" class="form-control detail-message-html" spellcheck="false">${
              parsed.htmlContent
            }</span>
            <label style="margin-left: -5px; margin-top: -5px;">Message</label>
        </div>
        <table ${
          testData.length > 0 ? "" : "hidden"
        } class="table detail-table table-bordered" width="100%">
        <thead>
            <tr>
                <th>Id</th>
                <th></th>
                <th>Name</th>
                <th>Size</th>
            </tr>
        </thead>
        </table>
    </form>
    `);

  // Initialise as a DataTable
  const detailTable = $(form)
    .find(".detail-table")
    .DataTable({
      info: false,
      paging: false,
      searching: false,
      ordering: false,
      data: testData, // rowData,
      columns: [
        { data: "id", visible: false, searchable: false },
        { data: null, visible: true, orderable: false },
        {
          data: "fileName",
          render: (data, type, full, meta) => {
            const link = `${window.apiHost}/api/v1/files/`;
            return `<a class="attachmentLink" href="javascript:;" onclick="downloadId('composeForm', '${link}${full.digest}', '${data}');">${data}</a>`;
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
        [5, 10, 15, 25],
        [5, 10, 15, 25],
      ],
      pageLength:
        $(document).height() >= 900
          ? $(document).height() >= 1100
            ? 15
            : 10
          : 5,
    });

  // Display it the child row
  row.child(form).show();
};
