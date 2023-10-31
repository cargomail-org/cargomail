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
import { parsePayload, composePayload, createSubjectSnippet, createPlainContentSnippet } from "/public/js/utils.js";

import { composeAddItems } from "/public/js/compose.js";

export const showDetail = (view, row) => {
  const rowData = row.data();

  if (!rowData?.payload) {
    console.log(`detail-${view}-table no data`);
    return;
  }

  const parsed = parsePayload(rowData.id, rowData.payload);

  const form = $(`
    <form class="detail-form" method="" action="#" enctype="multipart/form-data" autocomplete="off">
        <div class="form-floating mb-0">
            <span contenteditable="false" class="form-control detail-message-html" spellcheck="false">${parsed.htmlContent}</span>
            <label style="margin-left: -5px; margin-top: -5px;">Message</label>
        </div>
        <table ${parsed.attachments?.length > 0 ? "" : "hidden"} class="table detail-${view}-table table-bordered" width="100%">
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

  // Initialize as a DataTable
  const detailTable = $(form)
    .find(`.detail-${view}-table`)
    .DataTable({
      info: false,
      paging: false,
      searching: false,
      ordering: false,
      data: parsed.attachments,
      columns: [
        { data: "digest", visible: false, searchable: false },
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
      rowId: (row) => {
        return row.digest + "@" + row.fileName;
      },
      language: {
        buttons: {
          pageLength: "Show %d",
        },
      },
      lengthMenu: [
        [5, 10, 15, 25],
        [5, 10, 15, 25],
      ],
      pageLength: $(document).height() >= 900 ? ($(document).height() >= 1100 ? 15 : 10) : 5,
    });

  // detailTable.clear();
  // detailTable.rows.add(parsed.attachments);
  // detailTable.draw();

  // Display the child row
  row.child(form).show();

  detailTable.on("select.dt deselect.dt", (e) => {
    let dataTable = e.target.closest("#sentTable");

    if (!dataTable) {
      dataTable = e.target.closest("#inboxTable");
    }

    if (dataTable) {
      selectedRows(view, dataTable);
    }
  });
};

export const selectedRows = (view, dataTable) => {
  const details = document.querySelectorAll(`.detail-${view}-table`);

  let selected = false;

  details.forEach((detailTable) => {
    selected = selected || $(detailTable).DataTable().rows({ selected: true }).indexes().length > 0;
  });

  if (dataTable.id == "sentTable") {
    if (selected) {
      document.getElementById("copySelectedSent").classList.remove("disabled");
    } else {
      document.getElementById("copySelectedSent").classList.add("disabled");
    }
  } else {
    if (dataTable.id == "inboxTable") {
      if (selected) {
        document.getElementById("copySelectedInbox").classList.remove("disabled");
      } else {
        document.getElementById("copySelectedInbox").classList.add("disabled");
      }
    }
  }
};

export const copySelectedFiles = (e) => {
  e.preventDefault();

  let selectedAll = [];
  let details;

  if (e.currentTarget.id == "copySelectedInbox") {
    const view = "inbox";
    details = document.querySelectorAll(`.detail-${view}-table`);
  } else if (e.currentTarget.id == "copySelectedSent") {
    const view = "sent";
    details = document.querySelectorAll(`.detail-${view}-table`);
  }

  if (details) {
    details.forEach((detailTable) => {
      const selected = $(detailTable).DataTable().rows({ selected: true }).data();

      selectedAll = [...selectedAll, ...selected.toArray()];
    });
  }

  composeAddItems(true, selectedAll);
};
