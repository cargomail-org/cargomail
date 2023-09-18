import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { composeContentPage } from "/public/js/menu.js";
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
import { inboxTableRefresh } from "/public/js/inbox.js";

let selectedIds = [];

const sentConfirmDialog = new bootstrap.Modal(
  document.querySelector("#sentConfirmDialog")
);

const sentFormAlert = document.getElementById("sentFormAlert");

const composeIdInput = document.getElementById("composeIdInput");

let formIsPopulated = false;

let historyId = 0;

export const sentTable = new DataTable("#sentTable", {
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
    (async () => {
      const response = await api(
        sentFormAlert.id,
        200,
        `${window.apiHost}/api/v1/messages/list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folder: 1 }),
        }
      );

      if (response === false) {
        return;
      }

      historyId = response.lastHistoryId;

      callback({ data: response.messages });
    })();
  },
  ordering: true,
  columns: [
    { data: "id", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "payload",
      className: "payload",
      orderable: false,
      render: (data, type, full, meta) => {
        const parsed = parsePayload(full.id, full.payload);

        const link = `${window.apiHost}/api/v1/files/`;
        const attachmentLinks = [];

        for (const attachment of parsed.attachments) {
          const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadId('sentFormAlert', '${link}${attachment.digest}', '${attachment.fileName}');">${attachment.fileName}</a>`;
          attachmentLinks.push(attachmentAnchor);
        }

        const subject =
          type === "display"
            ? createSubjectSnippet(parsed.subject)
            : parsed.subject;
        const plainContent =
          type === "display"
            ? createPlainContentSnippet(parsed.plainContent)
            : parsed.plainContent;

        let content;

        if (subject) {
          content = subject;
          if (plainContent) {
            content = subject + " - " + plainContent;
          }
        } else {
          if (plainContent) {
            content = plainContent;
          }
        }

        let renderHtml = `<div"><span>${content || "Message"}</span>`;
        if (attachmentLinks.length > 0) {
          renderHtml += `<br/>`;
          for (const item of attachmentLinks) {
            renderHtml += `<span>${item}  </span>`;
          }
        }
        renderHtml += "</div>";

        return renderHtml;
      },
    },
    {
      data: null,
      visible: false,
      orderable: true,
      render: (data, type, full, meta) => {
        const date = full.modifiedAt != null ? full.modifiedAt : full.createdAt;
        return date;
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
            sentFormAlert.id,
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

          sentTableRefresh(response);
          inboxTableRefresh(response);         
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
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          sentConfirmDialog.show();
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
      sentTable.page.len(15).draw();
    } else {
      sentTable.page.len(10).draw();
    }
  } else {
    sentTable.page.len(5).draw();
  }
});

sentTable.on("select.dt deselect.dt", () => {
  const selectedRows = sentTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  sentTable.buttons([".sent-delete"]).enable(selected ? true : false);
});

export const sentTableRefresh = (data) => {
  historyId = data.lastHistoryId;

  // should refresh both the send and the inbox table
  for (const message of data.inserted) {
    if (message.folder == 1) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        sentTable.column(0).data().toArray().indexOf(message.id) === -1; // !!! must be
      if (notFound) {
        sentTable.row.add(message);
      }
    }
  }

  for (const message of data.updated) {
    if (message.folder == 1) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        sentTable.column(0).data().toArray().indexOf(message.id) === -1; // !!! must be
      if (notFound) {
        sentTable.row.add(message);
      } else {
        sentTable.row(`#${message.id}`).data(message);

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
    if (message.folder == 1) {
      sentTable.row(`#${message.id}`).remove();

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
    if (message.folder == 1) {
      sentTable.row(`#${message.id}`).remove();

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

  sentTable.draw(); 
};

export const deleteSentMessages = (e) => {
  e?.preventDefault();

  sentConfirmDialog.hide();

  (async () => {
    const response = await api(
      sentFormAlert.id,
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

    sentTable.rows(".selected").remove().draw();
    sentTable.buttons([".sent-delete"]).enable(false);
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

  sentTable.rows(`#${id}`).remove().draw();
  sentTable.buttons([".sent-delete"]).enable(sentTable.rows().count() > 0);

  try {
    formIsPopulated = true;
    composeClearForm();
  } finally {
    formIsPopulated = false;
  }
};
