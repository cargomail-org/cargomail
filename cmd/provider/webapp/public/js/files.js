import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

import { composeAddItems } from "/public/js/compose.js";
import { formatBytes } from "/public/js/menu.js";

let selectedIds = [];

const filesConfirmDialog = new bootstrap.Modal(
  document.querySelector("#filesConfirmDialog")
);

const uploadForm = document.getElementById("uploadForm");

const uploads = [];

const abortAllUploads = () => {
  uploads.forEach(function (upload, index) {
    upload.abort();
  });

  uploads.length = 0;
};

const uploadFile = (url, file, onProgress) =>
  new Promise((resolve, reject) => {
    let lastLoaded = 0;

    const xhr = new XMLHttpRequest();
    uploads.push(xhr);

    xhr.upload.addEventListener("progress", (e) => {
      onProgress(e.loaded - lastLoaded, e.loaded, e.total, lastLoaded == 0);
      lastLoaded = e.loaded;
    });

    xhr.addEventListener("load", () =>
      resolve({ status: xhr.status, body: xhr.response })
    );

    xhr.addEventListener("error", () =>
      reject(new Error("File upload failed"))
    );

    // xhr.addEventListener("abort", () =>
    //   reject(new Error("File upload aborted"))
    // );

    // cross domain !!!
    xhr.withCredentials = true;
    xhr.open("POST", url, true);
    xhr.responseType = "json";

    const formData = new FormData();
    formData.append(`files`, file);
    xhr.send(formData);
  });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const multipartOverhead = 180; // ca. 180
let estimatedTotal = 0;
let realTotal = 0;
let uploadedTotal = 0;
let filesCnt = 0;

const uploadProgressBar = document.getElementById("uploadProgressBar");
uploadProgressBar.classList.add("notransition");
uploadProgressBar.setAttribute("style", "width: 0%");
uploadProgressBar.innerText = "";

uploads.length = 0;

const resetProgressBar = () => {
  filesCnt = 0;
  estimatedTotal = 0;
  realTotal = 0;
  uploadedTotal = 0;

  uploadProgressBar.classList.add("notransition");
  uploadProgressBar.setAttribute("style", "width: 0%");
  uploadProgressBar.innerText = "";
};

uploadForm.onsubmit = async (e) => {
  e?.preventDefault();

  const onProgress = (chunkSize, loaded, total, firstChunk) => {
    uploadedTotal += chunkSize;

    if (firstChunk) {
      realTotal += total;
    }

    if (filesCnt == 1) {
      estimatedTotal == realTotal;
    }

    if (loaded == total) {
      filesCnt--;
    }

    const progress = Math.round((uploadedTotal / estimatedTotal) * 100);
    uploadProgressBar.setAttribute("style", `width: ${Math.floor(progress)}%`);

    if (filesCnt == 0) {
      filesCnt = 0;
      estimatedTotal = 0;
      realTotal = 0;
      uploadedTotal = 0;

      uploads.length = 0;

      uploadProgressBar.innerText = `${progress}%`;
      sleep(10000).then(() => {
        if (filesCnt == 0) {
          uploadProgressBar.classList.add("notransition");
          uploadProgressBar.setAttribute("style", "width: 0%");
          uploadProgressBar.innerText = "";
        }
      });
    }
  };

  const alert = uploadForm.querySelector('div[name="alert"]');
  if (alert) {
    alert.remove();
  }

  const uploadAlert = uploadForm.querySelector('div[name="uploadAlert"]');
  if (uploadAlert) {
    resetProgressBar();
    uploadAlert.remove();
  }

  uploadProgressBar.classList.remove("notransition");
  uploadProgressBar.innerText = "";

  const url = `${window.apiHost}/api/v1/files/upload`;
  const files = [...e.currentTarget.files.files];

  filesCnt += files.length;

  for (let i = 0; i < files.length; i++) {
    estimatedTotal += files[i].size + multipartOverhead;
  }

  clearUpload();

  for (let i = 0; i < files.length; i++) {
    try {
      const response = await uploadFile(url, files[i], onProgress);
      if (response.status != 201) {
        const errMessage = `File upload failed - Status code: ${response.status}`;

        throw new Error(errMessage);
      }

      if (response.status == 201) {
        const uploadedMultipartFiles = response.body;
        for (let j = 0; j < uploadedMultipartFiles.length; j++) {
          filesTable.row.add(uploadedMultipartFiles[j]);
        }
        filesTable.draw();
      }
    } catch (error) {
      abortAllUploads();

      uploadForm.insertAdjacentHTML(
        "beforeend",
        `<div class="alert alert-danger alert-dismissible fade show" role="alert" name="uploadAlert">
              ${error}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
           </div>`
      );

      const uploadAlert = uploadForm.querySelector('div[name="uploadAlert"]');
      uploadAlert.addEventListener("closed.bs.alert", function () {
        resetProgressBar();
      });
    }
  }
};

let historyId = 0;

const filesTable = new DataTable("#filesTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ajax: function (data, callback, settings) {
    (async () => {
      const response = await api(
        uploadForm.id,
        200,
        `${window.apiHost}/api/v1/files/list`,
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

      historyId = response.lastHistoryId;

      callback({ data: response.files });
    })();
  },
  columns: [
    { data: "id", visible: false, searchable: false },
    { data: null, visible: true, orderable: false },
    {
      data: "name",
      render: (data, type, full, meta) => {
        const link = `${window.apiHost}/api/v1/files/`;
        return `<a class="attachmentLink" href="javascript:;" onclick="downloadId('uploadForm', '${link}${full.digest}', '${data}');">${data}</a>`;
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
    {
      data: "createdAt",
      render: function (data, type) {
        if (type === "display" || type === "filter") {
          var d = new Date(data);
          return d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
        } else {
          return data;
        }
      },
    },
  ],
  rowId: "id",
  // rowId: function(data) {
  //   return 'id_' + data.id;
  // },
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
  order: [[4, "desc"]],
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
            uploadForm.id,
            200,
            `${window.apiHost}/api/v1/files/sync`,
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

          filesTableRefresh(response);
        })();
      },
    },
    {
      text: "Delete",
      className: "files-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = filesTable
          .rows(".selected")
          .data()
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          filesConfirmDialog.show();
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
      filesTable.page.len(15).draw();
    } else {
      filesTable.page.len(10).draw();
    }
  } else {
    filesTable.page.len(5).draw();
  }
});

filesTable.on("select.dt deselect.dt", () => {
  const selected = filesTable.rows({ selected: true }).indexes().length > 0;
  filesTable.buttons([".files-delete"]).enable(selected ? true : false);

  if (selected) {
    document.getElementById("copySelectedFiles").classList.remove("disabled");
  } else {
    document.getElementById("copySelectedFiles").classList.add("disabled");
  }
});

export const filesTableRefresh = (data) => {
  historyId = data.lastHistoryId;

  for (const file of data.inserted) {
    if (file.folder == 0) {
      // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
      const notFound =
        filesTable.column(0).data().toArray().indexOf(file.id) === -1; // !!! must be
      if (notFound) {
        filesTable.row.add(file);
      }
    }
  }

  for (const file of data.trashed) {
    if (file.folder == 0) {
      filesTable.row(`#${file.id}`).remove();
    }
  }

  for (const file of data.deleted) {
    if (file.folder == 0) {
      filesTable.row(`#${file.id}`).remove();
    }
  }

  filesTable.draw();
};

export const deleteFiles = (e) => {
  e?.preventDefault();

  filesConfirmDialog.hide();

  (async () => {
    const response = await api(
      uploadForm.id,
      200,
      `${window.apiHost}/api/v1/files/trash`,
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

    filesTable.rows(".selected").remove().draw();
    filesTable.buttons([".files-delete"]).enable(false);
  })();
};

export const copySelectedFiles = (e) => {
  e?.preventDefault();

  const selected = filesTable.rows(".selected").data();
  composeAddItems(true, selected);
};

export const inputUploadChanged = (e) => {
  e?.preventDefault();
  const files = e.target.files;
  if (files.length && files.length > 0) {
    document.getElementById("uploadButton").classList.remove("disabled");
    document.getElementById("clearButton").classList.remove("disabled");
  } else {
    document.getElementById("uploadButton").classList.add("disabled");
    document.getElementById("clearButton").classList.add("disabled");
  }
};

export const clearUpload = (e) => {
  e?.preventDefault();
  document.getElementById("uploadButton").classList.add("disabled");
  uploadForm.reset();
  document.getElementById("clearButton").classList.add("disabled");
};
