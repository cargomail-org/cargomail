import DataTable from "datatables.net";

import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { getHistoryId, setHistoryId, threadsRefresh } from "/public/js/threads_refresh.js";
import { createThreadRow } from "/public/js/thread_row.js";
import { inboxTable } from "/public/js/inbox.js";

import { clearForm as composeClearForm } from "/public/js/compose.js";
import { parsePayload, composePayload, createSubjectSnippet, createPlainContentSnippet } from "/public/js/utils.js";
import { messageListResponse, createMessageTable, destroyMessageTable } from "/public/js/message.js";
import { getThreads } from "/public/js/thread.js";
import { draftsTable } from "/public/js/drafts.js";

let selectedIds = [];

const username =
  document.getElementById("profileForm").querySelector("#profileUsername").innerHTML +
  "@" +
  document.getElementById("profileForm").querySelector("#profileDomainName").innerHTML;

const sentConfirmDialog = new bootstrap.Modal(document.querySelector("#sentConfirmDialog"));

const sentFormAlert = document.getElementById("sentFormAlert");

const composeXThreadIdInput = document.getElementById("composeXThreadIdInput");

export const sentTable = new DataTable("#sentTable", {
  stateSave: false,
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
      setHistoryId(messageListResponse.lastHistoryId);

      const threads = getThreads(1);

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
        return createThreadRow("sent", type, username, full);
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
  rowId: "threadId",
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
  pageLength: $(document).height() >= 700 ? ($(document).height() >= 900 ? 15 : 10) : 5,
  buttons: [
    // "pageLength",
    {
      text: "Refresh",
      action: function () {
        (async () => {
          const response = await api(sentFormAlert.id, 200, `${window.mailboxApiHost}/api/v1/messages/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ historyId: getHistoryId() }),
          });

          if (response === false) {
            return;
          }

          threadsRefresh(sentTable, inboxTable, response);
        })();
      },
    },
    {
      text: "Delete",
      className: "sent-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = sentTable
          .rows(".selected")
          .data()
          .map((obj) => obj);
        if (selectedData.length > 0) {
          sentConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedIds.push(selectedData[i].threadId);
          }
        }
      },
    },
  ],
});

$(window).resize(function () {
  if ($(this).height() >= "700") {
    if ($(this).height() >= "900") {
      sentTable.page.len(15).draw(false);
    } else {
      sentTable.page.len(10).draw(false);
    }
  } else {
    sentTable.page.len(5).draw(false);
  }
});

sentTable.on("click", "td.payload", (e) => {
  if (e.target.classList.contains("attachmentLink")) {
    return;
  }

  if (e.target.classList.contains("bi-star") || e.target.classList.contains("bi-star-fill")) {
    return;
  }

  let tr = e.target.closest("tr");
  let row = sentTable.row(tr);

  if (row.child.isShown()) {
    // This row is already open - close it
    destroyMessageTable("sent", sentTable, row);
    tr.classList.remove("shown");
  } else {
    if (sentTable.row(".shown").length) {
      $(".payload", sentTable.row(".shown").node()).click();
    }
    // Open this row
    createMessageTable("sent", row);
    tr.classList.add("shown");
  }
});

sentTable.on("select.dt deselect.dt", () => {
  const selectedRows = sentTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  sentTable.buttons([".sent-delete"]).enable(selected ? true : false);
});

export const deleteSentThreads = (e) => {
  e?.preventDefault();

  sentConfirmDialog.hide();

  (async () => {
    const response = await api(sentFormAlert.id, 200, `${window.mailboxApiHost}/api/v1/threads/trash`, {
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

    if (selectedIds.includes(composeXThreadIdInput.value)) {
      composeClearForm();
    }

    // delete affected drafts
    draftsTable.rows().every((index) => {
      const row = draftsTable.row(index);
      const data = row.data();
      const threadId = data.payload.headers["X-Thread-ID"];

      if (selectedIds.includes(threadId)) {
        draftsTable.rows(index).remove().draw(false);
      }
    });

    sentTable.rows(".selected").every(function (index) {
      const row = sentTable.row(index);
      const threadId = row.data().threadId;

      try {
        inboxTable.rows(`#${$.escapeSelector(threadId)}`).remove();
      } catch {
        // ignore error throwed only if the row doesn't exist caused by the threadId '<..@.>' format (used as a selector)
      }
    });

    inboxTable.draw(false);

    sentTable.rows(".selected").remove().draw(false);
    sentTable.buttons([".sent-delete"]).enable(false);
  })();
};

// TODO do it right
export const deleteMessage = async (composeForm, id) => {
  const response = await api(composeForm.id, 200, `${window.mailboxApiHost}/api/v1/messages/trash`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: [id] }),
  });

  if (response === false) {
    return;
  }

  sentTable.rows(`#${id}`).remove().draw(false);
  sentTable.buttons([".sent-delete"]).enable(sentTable.rows().count() > 0);

  composeClearForm();
};
