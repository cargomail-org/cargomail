import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { createThreadRow } from "/public/js/thread_row.js";

import {
  clearForm as composeClearForm,
  populateForm as composePopulateForm,
} from "/public/js/compose.js";
import {
  parsePayload,
  composePayload,
  createSubjectSnippet,
  createPlainContentSnippet,
} from "/public/js/utils.js";
import { sentTableRefresh } from "/public/js/sent.js";
import {
  messageListResponse,
  getThreads,
  createThreadTable,
  destroyThreadTable,
} from "/public/js/thread.js";

let selectedIds = [];

const inboxConfirmDialog = new bootstrap.Modal(
  document.querySelector("#inboxConfirmDialog")
);

const inboxFormAlert = document.getElementById("inboxFormAlert");

const composeIdInput = document.getElementById("composeIdInput");

let formIsPopulated = false;

let historyId = 0;

export const inboxTable = new DataTable("#inboxTable", {
  paging: true,
  responsive: {
    details: false,
  },
  rowCallback: function (row, data, dataIndex) {
    const $row = $(row);
    if ($row.hasClass("even")) {
      $row.css("background-color", "rgb(245,245,245)");
      $row.hover(
        function () {
          $(this).css("background-color", "rgb(226 232 240)");
        },
        function () {
          $(this).css("background-color", "rgb(245,245,245)");
        }
      );
    } else {
      $row.css("background-color", "rgb(245,245,245)");
      $row.hover(
        function () {
          $(this).css("background-color", "rgb(226 232 240)");
        },
        function () {
          $(this).css("background-color", "rgb(245,245,245)");
        }
      );
    }
  },
  // createdRow: function (row, data, dataIndex) {
  //   if (dataIndex%2 == 0) {
  //     $(row).attr('style', 'background-color: yellow;');
  //   } else {
  //     $(row).attr('style', 'background-color: yellow;');
  //   }
  // },
  // stripeClasses: [],
  // drawCallback: function () {
  //   // $(this.api().table().header()).hide();
  //   $("#selector thead").remove();
  // },
  ajax: function (data, callback, settings) {
    if (messageListResponse) {
      historyId = messageListResponse.lastHistoryId;

      const threads = getThreads(2);

      callback({ data: threads });
    }
  },
  ordering: true,
  columns: [
    { data: "threadId", visible: false, searchable: false },
    { data: null, visible: true, orderable: false },
    {
      data: "payload",
      className: "payload",
      orderable: false,
      render: (data, type, full, meta) => {
        const parsed = parsePayload(full.id, full.payload);

        const renderHtml = createThreadRow(type, full.messages, parsed);

        return renderHtml;
      },
    },
    {
      data: null,
      visible: false,
      orderable: true,
      render: (data, type, full, meta) => {
        return full.createdAt;
      },
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
  order: [[3, "desc"]],
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
    $(document).height() >= 700 ? ($(document).height() >= 900 ? 15 : 10) : 5,
  buttons: [
    // "pageLength",
    {
      text: "Refresh",
      action: function () {
        (async () => {
          const response = await api(
            inboxFormAlert.id,
            200,
            `${window.apiHost}/api/v1/messages/sync`,
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

          inboxTableRefresh(response);
          sentTableRefresh(response);
        })();
      },
    },
    {
      text: "Delete",
      className: "inbox-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = inboxTable
          .rows(".selected")
          .data()
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          inboxConfirmDialog.show();
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
      inboxTable.page.len(15).draw();
    } else {
      inboxTable.page.len(10).draw();
    }
  } else {
    inboxTable.page.len(5).draw();
  }
});

inboxTable.on("click", "td.payload", (e) => {
  if (e.target.classList.contains("attachmentLink")) {
    return;
  }

  if (
    e.target.classList.contains("bi-star") ||
    e.target.classList.contains("bi-star-fill")
  ) {
    return;
  }

  let tr = e.target.closest("tr");
  let row = inboxTable.row(tr);

  if (row.child.isShown()) {
    // This row is already open - close it
    destroyThreadTable(row);
    tr.classList.remove("shown");
  } else {
    if (inboxTable.row(".shown").length) {
      $(".payload", inboxTable.row(".shown").node()).click();
    }
    // Open this row
    createThreadTable(row);
    tr.classList.add("shown");
  }
});

inboxTable.on("select.dt deselect.dt", () => {
  const selectedRows = inboxTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  inboxTable.buttons([".inbox-delete"]).enable(selected ? true : false);
});

export const inboxTableRefresh = (data) => {
  historyId = data.lastHistoryId;

  // should refresh both the send and the inbox table
  for (const message of data.inserted) {
    if (message.folder == 2) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        inboxTable.column(0).data().toArray().indexOf(message.id) === -1; // !!! must be
      if (notFound) {
        inboxTable.row.add(message);
      }
    }
  }

  for (const message of data.updated) {
    if (message.folder == 2) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        inboxTable.column(0).data().toArray().indexOf(message.id) === -1; // !!! must be
      if (notFound) {
        inboxTable.row.add(message);
      } else {
        inboxTable.row(`#${message.id}`).data(message);

        if (message.id == composeIdInput.value) {
          try {
            const parsed = parsePayload(message.id, message.payload);

            formIsPopulated = true;
            composePopulateForm(message.id, parsed);
          } finally {
            formIsPopulated = false;
          }
        }
      }
    }
  }

  for (const message of data.trashed) {
    if (message.folder == 2) {
      inboxTable.row(`#${message.id}`).remove();

      if (message.id == composeIdInput.value) {
        try {
          formIsPopulated = true;
          composeClearForm();
        } finally {
          formIsPopulated = false;
        }
      }
    }
  }

  for (const message of data.deleted) {
    if (message.folder == 2) {
      inboxTable.row(`#${message.id}`).remove();

      if (message.id == composeIdInput.value) {
        try {
          formIsPopulated = true;
          composeClearForm();
        } finally {
          formIsPopulated = false;
        }
      }
    }
  }

  inboxTable.draw();
};

export const deleteInboxMessages = (e) => {
  e?.preventDefault();

  inboxConfirmDialog.hide();

  (async () => {
    const response = await api(
      inboxFormAlert.id,
      200,
      `${window.apiHost}/api/v1/messages/trash`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      }
    );

    if (response === false) {
      return;
    }

    if (selectedIds.includes(composeIdInput.value)) {
      try {
        formIsPopulated = true;
        composeClearForm();
      } finally {
        formIsPopulated = false;
      }
    }

    inboxTable.rows(".selected").remove().draw();
    inboxTable.buttons([".inbox-delete"]).enable(false);
  })();
};

export const deleteMessage = async (composeForm, id) => {
  const response = await api(
    composeForm.id,
    200,
    `${window.apiHost}/api/v1/messages/trash`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [id] }),
    }
  );

  if (response === false) {
    return;
  }

  inboxTable.rows(`#${id}`).remove().draw();
  inboxTable.buttons([".inbox-delete"]).enable(inboxTable.rows().count() > 0);

  try {
    formIsPopulated = true;
    composeClearForm();
  } finally {
    formIsPopulated = false;
  }
};
