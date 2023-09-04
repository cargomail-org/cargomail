import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import {
  composeAddItems,
  populateForm as composePopulateForm,
} from "/public/js/compose.js";

import { parsePayload, composePayload } from "/public/js/utils.js";

let selectedUris = [];

const draftsConfirmDialog = new bootstrap.Modal(
  document.querySelector("#draftsConfirmDialog")
);

const draftsFormAlert = document.getElementById("draftsFormAlert");

let formIsPopulated = false;

let historyId = 0;

const draftsTable = new DataTable("#draftsTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(
        draftsFormAlert.id,
        200,
        `${window.apiHost}/api/v1/drafts`,
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

      callback({ data: response.drafts });
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
          const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadURI('draftsFormAlert', '${link}${attachment.uri}', '${attachment.fileName}');">${attachment.fileName}</a>`;
          attachmentLinks.push(attachmentAnchor);
        }

        let snippet;

        if (parsed.subject?.length > 0) {
          snippet = parsed.subject;
          if (parsed.plainContent?.length > 0) {
            snippet = snippet + " - " + parsed.plainContent;
          }
        } else {
          snippet = parsed.plainContent;
        }

        let renderHtml = `<span>${snippet || "Draft"}</span>`;
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
            draftsFormAlert.id,
            200,
            `${window.apiHost}/api/v1/drafts/sync`,
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

          for (const draft of response.inserted) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              draftsTable.column(0).data().toArray().indexOf(draft.uri) === -1; // !!! must be
            if (notFound) {
              draftsTable.row.add(draft);
            }
          }

          for (const draft of response.updated) {
            // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
            const notFound =
              draftsTable.column(0).data().toArray().indexOf(draft.uri) === -1; // !!! must be
            if (notFound) {
              draftsTable.row.add(draft);
            } else {
              draftsTable.row(`#${draft.uri}`).data(draft);
            }
          }

          for (const draft of response.trashed) {
            draftsTable.row(`#${draft.uri}`).remove();
          }

          for (const draft of response.deleted) {
            draftsTable.row(`#${draft.uri}`).remove();
          }

          draftsTable.draw();
        })();
      },
    },
    {
      text: "New",
      className: "drafts-new",
      enabled: true,
      action: function (e) {
        // const button = e.currentTarget;
        // button.setAttribute("data-mode", "@new");
        // draftsFormDialog.show(e);
      },
    },
    {
      text: "Edit",
      className: "drafts-edit",
      enabled: false,
      action: function (e) {
        const data = draftsTable.rows(".selected").data()[0];

        const parsed = parsePayload(data.uri, data.payload);

        try {
          formIsPopulated = true;
          composePopulateForm(data.uri, parsed);
        } finally {
          formIsPopulated = false;
        }

        composeContent(e);
      },
    },
    {
      text: "Delete",
      className: "drafts-delete",
      enabled: false,
      action: function () {
        selectedUris = [];

        const selectedData = draftsTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          draftsConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
          }
        }
      },
    },
  ],
});

draftsTable.on("select.dt deselect.dt", () => {
  const selectedRows = draftsTable.rows({ selected: true }).indexes().length;
  const selected = selectedRows > 0;
  draftsTable
    .buttons([".drafts-edit"])
    .enable(selectedRows == 1 ? true : false);
  draftsTable.buttons([".drafts-delete"]).enable(selected ? true : false);
});

export const deleteDraftsMessages = (e) => {
  e?.preventDefault();

  draftsConfirmDialog.hide();

  (async () => {
    const response = await api(
      draftsFormAlert.id,
      200,
      `${window.apiHost}/api/v1/drafts/trash`,
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

    draftsTable.rows(".selected").remove().draw();
    draftsTable.buttons([".drafts-edit"]).enable(false);
    draftsTable.buttons([".drafts-delete"]).enable(false);
  })();
};

export const updateDraftsPage = (uri, parsed) => {
  if (!formIsPopulated) {
    const index = draftsTable.column(0).data().toArray().indexOf(uri);

    if (index >= 0) {
      const draft = draftsTable.row(`#${uri}`).data();

      draft.payload = composePayload(draft.payload, parsed);

      console.log(draft.payload);

      draftsTable.row(`#${uri}`).data(draft)
    }
  }
};
