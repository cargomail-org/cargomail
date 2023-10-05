import DataTable from "datatables.net";

import $ from "jquery";

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import {
  parsePayload,
  composePayload,
  parseNameAndEmail,
  createSubjectSnippet,
  createPlainContentSnippet,
  getRecipientsFull,
  treatDupliciteMessage,
} from "/public/js/utils.js";

import { showDetail, selectedRows } from "/public/js/message_detail.js";
import { createMessageRow } from "/public/js/message_row.js";

import { composeContentPage } from "/public/js/menu.js";
import {
  newDraft as composeNewDraft,
  populateForm as composePopulateForm,
} from "/public/js/compose.js";

const getMessages = async () => {
  const response = await api(
    sentFormAlert.id,
    200,
    `${window.apiHost}/api/v1/messages/list`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder: 0 }),
    }
  );

  if (response === false) {
    return;
  }

  return response;
};

export const createThreadTable = (view, row) => {
  // This is the table we'll convert into a DataTable
  const table = $(`<table class="table thread-${view}-table" width="100%"/>`);

  const rowData = row.data();

  if (!rowData?.messages) {
    console.log(`thread-${view}-table no data`);
    return;
  }

  // Initialise as a DataTable
  const threadsTable = table.DataTable({
    info: false,
    paging: false,
    searching: false,
    ordering: true,
    rowCallback: function (row, data, dataIndex) {
      const $row = $(row);
      if ($row.hasClass("even")) {
        $row.css("background-color", "rgb(255, 255, 255)");
        $row.hover(
          function () {
            $(this).css("background-color", "rgb(245,245,245)");
          },
          function () {
            $(this).css("background-color", "rgb(255, 255, 255)");
          }
        );
      } else {
        $row.css("background-color", "rgb(255, 255, 255)");
        $row.hover(
          function () {
            $(this).css("background-color", "rgb(245,245,245)");
          },
          function () {
            $(this).css("background-color", "rgb(255, 255, 255)");
          }
        );
      }
    },
    dom: "Bfrtip",
    pageLength: 50,
    rowId: "id",
    data: rowData.messages,
    columns: [
      { data: "id", visible: false, searchable: false },
      {
        data: "payload",
        className: "threads-payload",
        orderable: false,
        render: (data, type, full, meta) => {
          const parsed = parsePayload(full.id, full.payload);

          const renderHtml = createMessageRow(full.id, parsed);

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
    order: [[2, "asc"]],
  });

  let headerTitle = "";

  if (rowData.messages.length > 0) {
    const parsed = parsePayload(
      rowData.messages[0].id,
      rowData.messages[0].payload
    );
    headerTitle = createSubjectSnippet(parsed.subject);
  }

  if (!headerTitle) {
    headerTitle = "(no subject)";
  }

  const header = threadsTable.columns(1).header();
  $(header).html(headerTitle);

  threadsTable.on("click", "td.threads-payload", (e) => {
    e.preventDefault();

    // console.log(e.target);
    // console.log(e.target.nodeName);
    // console.log(e.target.offsetWidth - e.offsetX);
    // console.log(e.target.offsetHeight - e.offsetY);

    if (e.target.classList.contains("attachmentLink")) {
      return;
    }

    if (
      (e.target.nodeName == "path" && e.target.id == "starred-icon") ||
      e.target.classList.contains("bi-star-fill")
    ) {
      return;
    }

    if (
      (e.target.nodeName == "path" && e.target.id == "unstarred-icon") ||
      e.target.classList.contains("bi-star")
    ) {
      return;
    }

    if (
      (e.target.nodeName == "path" && e.target.id == "three-dot-icon") ||
      e.target.classList.contains("bi-three-dots-vertical") ||
      e.target.classList.contains("button-dropdown") ||
      e.target.classList.contains("dropdown-item") ||
      e.target.classList.contains("dropdown-divider") ||
      e.target.classList.contains("dropdown-menu-light")
    ) {
      if (e.target.classList.contains("dropdown-item")) {
        let tr = e.target.closest("tr");
        let row = threadsTable.row(tr);

        const data = row.data();

        const parsed = parsePayload(data.id, data.payload);

        parsed.inReplyTo = parsed.messageId;

        if (parsed.references) {
          parsed.references += ` ${parsed.messageId}`;
        } else {
          parsed.references = parsed.messageId;
        }

        delete parsed["messageId"];

        const sender = parsed.from.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (e.target.classList.contains("message-reply")) {
          parsed.htmlContent = `
          <br/>
            <blockquote>
              <p class="message-original-info">
                On ${parsed.date} ${sender} wrote:<br/>
                Subject: ${parsed.subject}<br/>
                ${getRecipientsFull(parsed)}<br/><br/>
              </p>
              <p>
                ${parsed.htmlContent}
              </p>
            </blockquote>`;
          parsed.to = [parseNameAndEmail(parsed.from)];
          parsed.cc = [];
          parsed.bcc = [];
          parsed.attachments.length = 0;
        } else if (e.target.classList.contains("message-reply-all")) {
          parsed.htmlContent = `
          <br/>
            <blockquote>
              <p class="message-original-info">
                On ${parsed.date} ${sender} wrote:<br/>
                Subject: ${parsed.subject}<br/>
                ${getRecipientsFull(parsed)}<br/><br/>
              </p>
              <p>
                ${parsed.htmlContent}
              </p>
            </blockquote>`;
          parsed.to = [parseNameAndEmail(parsed.from)];
          parsed.attachments.length = 0;
        } else if (e.target.classList.contains("message-forward")) {
          parsed.htmlContent = `
          <br/>
            <p class="message-original-info">
              ---------- Forwarded message ---------<br/>
              From: ${sender}<br/>
              Date: ${parsed.date}<br/>
              Subject: ${parsed.subject}<br/>
              ${getRecipientsFull(parsed)}<br/><br/>
            </p>
            <p>
              ${parsed.htmlContent}
            </p>`;
          parsed.to = [];
          parsed.cc = [];
          parsed.bcc = [];
        }

        (async () => {
          await composeNewDraft();

          await composePopulateForm(true, "", parsed);

          composeContentPage(e);
        })();
      }
      return;
    } else {
      const tr = e.target.closest("tr");
      const row = threadsTable.row(tr);
      if (
        e.target.offsetWidth - e.offsetX < (row.child.isShown() ? 64 : 32) &&
        e.target.offsetHeight - e.offsetY > 14
      ) {
        return;
      }
    }

    let tr = e.target.closest("tr");
    let row = threadsTable.row(tr);

    if (row.child.isShown()) {
      tr.getElementsByClassName("message-row-message")[0].style.display =
        "block";
      tr.getElementsByClassName("message-row-recipients")[0].style.display =
        "none";
      tr.getElementsByClassName("message-row-dropdown")[0].style.display =
        "none";

      // This row is already open - close it
      row.child.hide();

      let dataTable = e.target.closest("#sentTable");

      if (!dataTable) {
        dataTable = e.target.closest("#inboxTable");
      }

      if (dataTable) {
        selectedRows(view, dataTable);
      }
    } else {
      tr.getElementsByClassName("message-row-message")[0].style.display =
        "none";
      tr.getElementsByClassName("message-row-recipients")[0].style.display =
        "block";
      tr.getElementsByClassName("message-row-dropdown")[0].style.display =
        "block";

      // Open this row
      showDetail(view, row);
      tr.classList.add("shown");
    }
  });

  // Display it the child row
  row.child(table).show();
};

export const destroyThreadTable = (view, parentTable, row) => {
  const table = $(`thread-${view}-table`, row.child());

  table.detach();
  table.DataTable().destroy();

  // And then hide the row
  row.child.hide();

  let dataTable = parentTable.table().node();

  if (dataTable) {
    selectedRows(view, dataTable);
  }
};

export const messageListResponse = await getMessages();

export const getThreads = (folder = 0) => {
  const historyId = messageListResponse.lastHistoryId;

  const threadsById = new Map();
  for (const message of messageListResponse.messages) {
    const threadId = message.payload.headers["X-Thread-ID"];
    const thread = threadsById.get(threadId);
    const payload = message.payload;
    const createdAt = message.createdAt;

    if (thread) {
      const dupliciteIndex = thread.messages.indexOf(
        thread.messages.find((item) => {
          return (
            item.payload.headers["Message-ID"] ==
            message.payload.headers["Message-ID"]
          );
        })
      );

      if (dupliciteIndex >= 0) {
        const view = folder;
        treatDupliciteMessage(thread, view, message, dupliciteIndex);
      } else {
        thread.messages.push(message);
      }

      if (
        (folder == 0 || message.folder == folder) &&
        message.createdAt > thread.createdAt
      ) {
        thread.createdAt = message.createdAt;
      }
    } else {
      threadsById.set(threadId, {
        threadId,
        payload,
        createdAt,
        messages: [message],
      });
    }
  }
  const threads = [...threadsById.values()];

  if (folder == 0) {
    return threads;
  } else {
    return threads.filter((thread) => {
      const messages = thread.messages.filter(
        (message, index) => message.folder == folder
      );
      return messages.length > 0;
    });
  }
};
