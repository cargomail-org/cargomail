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
import { sentTableRefresh } from "/public/js/sent.js";

let selectedUris = [];

const inboxConfirmDialog = new bootstrap.Modal(
  document.querySelector("#inboxConfirmDialog")
);

const inboxFormAlert = document.getElementById("inboxFormAlert");

const composeUriInput = document.getElementById("composeUriInput");

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
    (async () => {
      const response = await api(
        inboxFormAlert.id,
        200,
        `${window.apiHost}/api/v1/messages/list`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folder: 2 }),
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
    { data: "uri", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "payload",
      className: "payload",
      orderable: false,
      render: (data, type, full, meta) => {
        const parsed = parsePayload(full.uri, full.payload);

        const link = `${window.apiHost}/api/v1/files/`;
        const attachmentLinks = [];

        for (const attachment of parsed.attachments) {
          const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadUri('inboxFormAlert', '${link}${attachment.digest}', '${attachment.fileName}');">${attachment.fileName}</a>`;
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
  rowId: "uri",
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
        selectedUris = [];

        const selectedData = inboxTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          inboxConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
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
        inboxTable.column(0).data().toArray().indexOf(message.uri) === -1; // !!! must be
      if (notFound) {
        inboxTable.row.add(message);
      }
    }
  }

  for (const message of data.updated) {
    if (message.folder == 2) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        inboxTable.column(0).data().toArray().indexOf(message.uri) === -1; // !!! must be
      if (notFound) {
        inboxTable.row.add(message);
      } else {
        inboxTable.row(`#${message.uri}`).data(message);

        if (message.uri == composeUriInput.value) {
          try {
            const parsed = parsePayload(message.uri, message.payload);

            formIsPopulated = true;
            composePopulateForm(message.uri, parsed);
          } finally {
            formIsPopulated = false;
          }
        }
      }
    }
  }

  for (const message of data.trashed) {
    if (message.folder == 2) {
      inboxTable.row(`#${message.uri}`).remove();

      if (message.uri == composeUriInput.value) {
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
      inboxTable.row(`#${message.uri}`).remove();

      if (message.uri == composeUriInput.value) {
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
        body: JSON.stringify({ uris: selectedUris }),
      }
    );

    if (response === false) {
      return;
    }

    if (selectedUris.includes(composeUriInput.value)) {
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

export const deleteMessage = async (composeForm, uri) => {
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
      body: JSON.stringify({ uris: [uri] }),
    }
  );

  if (response === false) {
    return;
  }

  inboxTable.rows(`#${uri}`).remove().draw();
  inboxTable.buttons([".inbox-delete"]).enable(inboxTable.rows().count() > 0);

  try {
    formIsPopulated = true;
    composeClearForm();
  } finally {
    formIsPopulated = false;
  }
};
