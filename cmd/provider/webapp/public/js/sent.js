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

let selectedUris = [];

const sentConfirmDialog = new bootstrap.Modal(
  document.querySelector("#sentConfirmDialog")
);

const sentFormAlert = document.getElementById("sentFormAlert");

const composeUriInput = document.getElementById("composeUriInput");

let formIsPopulated = false;

let historyId = 0;

export const sentTable = new DataTable("#sentTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(
        sentFormAlert.id,
        200,
        `${window.apiHost}/api/v1/messages`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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
      orderable: false,
      render: (data, type, full, meta) => {
        const parsed = parsePayload(full.uri, full.payload);

        const link = `${window.apiHost}/api/v1/files/`;
        const attachmentLinks = [];

        for (const attachment of parsed.attachments) {
          const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadUri('sentFormAlert', '${link}${attachment.uri}', '${attachment.fileName}');">${attachment.fileName}</a>`;
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

        let renderHtml = `<span>${content || "Message"}</span>`;
        if (attachmentLinks.length > 0) {
          renderHtml += `<br/>`;
          for (const item of attachmentLinks) {
            renderHtml += `<span>${item}  </span>`;
          }
        }

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
    [10, 25, 50],
    ["10 rows", "25 rows", "50 rows"],
  ],
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

          historyId = response.lastHistoryId;

          for (const message of response.inserted) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              sentTable.column(0).data().toArray().indexOf(message.uri) === -1; // !!! must be
            if (notFound) {
              sentTable.row.add(message);
            }
          }

          for (const message of response.updated) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              sentTable.column(0).data().toArray().indexOf(message.uri) === -1; // !!! must be
            if (notFound) {
              sentTable.row.add(message);
            } else {
              sentTable.row(`#${message.uri}`).data(message);

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

          for (const message of response.trashed) {
            sentTable.row(`#${message.uri}`).remove();

            if (message.uri == composeUriInput.value) {
              try {
                formIsPopulated = true;
                composeClearForm();
              } finally {
                formIsPopulated = false;
              }
            }
          }

          for (const message of response.deleted) {
            sentTable.row(`#${message.uri}`).remove();

            if (message.uri == composeUriInput.value) {
              try {
                formIsPopulated = true;
                composeClearForm();
              } finally {
                formIsPopulated = false;
              }
            }
          }

          sentTable.draw();
        })();
      },
    },
    // {
    //   text: "Edit",
    //   className: "sent-edit",
    //   enabled: false,
    //   action: function (e) {
    //     const data = sentTable.rows(".selected").data()[0];

    //     const parsed = parsePayload(data.uri, data.payload);

    //     try {
    //       formIsPopulated = true;
    //       composePopulateForm(data.uri, parsed);
    //     } finally {
    //       formIsPopulated = false;
    //     }

    //     composeContentPage(e);
    //   },
    // },
    {
      text: "Delete",
      className: "sent-delete",
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

sentTable.on("select.dt deselect.dt", () => {
  const selectedRows = sentTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  sentTable
    .buttons([".sent-edit"])
    .enable(selectedRows == 1 ? true : false);
  sentTable.buttons([".sent-delete"]).enable(selected ? true : false);
});

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

    sentTable.rows(".selected").remove().draw();
    sentTable.buttons([".sent-edit"]).enable(false);
    sentTable.buttons([".sent-delete"]).enable(false);
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

  sentTable.rows(`#${uri}`).remove().draw();
  sentTable.buttons([".sent-edit"]).enable(sentTable.rows().count() > 0);
  sentTable
    .buttons([".sent-delete"])
    .enable(sentTable.rows().count() > 0);

  try {
    formIsPopulated = true;
    composeClearForm();
  } finally {
    formIsPopulated = false;
  }
};

