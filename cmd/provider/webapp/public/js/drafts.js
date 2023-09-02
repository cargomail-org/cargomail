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
  addItems as composeAddItems,
  populateForm as composePopulateForm,
} from "/public/js/compose.js";

let selectedUris = [];

const draftsConfirmDialog = new bootstrap.Modal(
  document.querySelector("#draftsConfirmDialog")
);

const draftsFormAlert = document.getElementById("draftsFormAlert");

let historyId = 0;

const getPartIfNotContainer = (part) => {
  if (part?.headers) {
    const contentType = part.headers["Content-Type"];
    const contentTransferEnconding = part.headers["Content-Transfer-Encoding"];
    const contentDisposition = part.headers["Content-Disposition"];

    let isContainer;

    if (Array.isArray(contentType)) {
      const items = contentType.filter((item) =>
        item["Content-Type"]?.startsWith("multipart/")
      );
      isContainer = items.length > 0;
    } else {
      isContainer = contentType && contentType.startsWith("multipart/");
    }

    if (!isContainer) {
      const result = {};

      if (part.body) {
        result.body = part.body;
      }

      if (contentType) {
        result["Content-Type"] = contentType;
      }

      if (contentTransferEnconding) {
        result["Content-Transfer-Encoding"] = contentTransferEnconding;
      }

      if (contentDisposition) {
        result["Content-Disposition"] = contentDisposition;
      }

      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  }
};

const getPartsWithoutContainers = (payload) => {
  const result = [];

  if (!payload) {
    return result;
  }

  const part = getPartIfNotContainer(payload);
  if (part) {
    result.push(part);
  }

  if (payload.parts) {
    payload.parts.filter((part) => {
      result.push(...getPartsWithoutContainers(part));
    });
  }

  return result;
};

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
        let subject;
        let plainText;
        let snippet;

        if (full.payload?.headers) {
          subject = full.payload.headers["Subject"];
        }

        const partsWithoutContainers = getPartsWithoutContainers(data);

        const plainPart = partsWithoutContainers.find((part) => {
          return (
            !Array.isArray(part["Content-Type"]) &&
            part["Content-Type"] &&
            part["Content-Type"].startsWith("text/plain")
          );
        });

        const attachments = partsWithoutContainers.filter((part) =>
          part["Content-Disposition"]?.startsWith("attachment")
        );

        const link = `${window.apiHost}/api/v1/files/`;
        const attachmentLinks = [];

        for (const attachment of attachments) {
          let fileName = attachment["Content-Disposition"]
            .split("filename=")
            .pop();
          if (fileName?.length > 0) {
            fileName = fileName.replace(/^"(.+(?="$))"$/, "$1");
          }

          const externalContent = attachment["Content-Type"].find((item) =>
            item.startsWith("message/external-body")
          );

          let attachmentUri = "#";

          if (externalContent) {
            attachmentUri = externalContent.split("uri=").pop();

            const quotedStrings = attachmentUri.split('"');
            if (quotedStrings?.length > 0) {
              attachmentUri = quotedStrings[1];
            } else {
              attachmentUri = "#";
            }
          }

          const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadURI('draftsFormAlert', '${link}${attachmentUri}', '${fileName}');">${fileName}</a>`;

          attachmentLinks.push(attachmentAnchor);
        }

        if (plainPart?.["Content-Transfer-Encoding"] == "base64") {
          plainText = plainPart?.body?.data
            ? atob(plainPart.body.data)
            : undefined;
        } else {
          plainText = plainPart?.body?.data ? plainPart.body.data : undefined;
        }

        if (subject?.length > 0) {
          snippet = subject;
          if (plainText?.length > 0) {
            snippet = snippet + " - " + plainText;
          }
        } else {
          snippet = plainText;
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
        composePopulateForm(draftsTable.rows(".selected").data()[0]);
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
