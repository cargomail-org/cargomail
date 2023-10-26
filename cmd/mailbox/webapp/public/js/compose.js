import DataTable from "datatables.net";

// import $ from 'jquery';

import "datatables.net-bs5";
import "datatables.net-select";
import "datatables.net-select-bs5";
import "datatables.net-buttons";
import "datatables.net-buttons-bs5";
import "datatables.net-responsive";
import "datatables.net-responsive-bs5";

// import * as database from "/public/js/database.js";
import { formatBytes } from "/public/js/menu.js";
import { getProfileUsername, getProfileFullName } from "/public/js/profile.js";
import { b64EncodeUtf8, getCaretPosition, setCaretPosition } from "/public/js/utils.js";
import { upsertDraftsPage, deleteDraft as draftsDeleteDraft, sendDraft as draftsSendDraft } from "/public/js/drafts.js";

const composeForm = document.getElementById("composeForm");
const composeIdInput = document.getElementById("composeIdInput");
const composeXThreadIdInput = document.getElementById("composeXThreadIdInput");
const composeInReplyToInput = document.getElementById("composeInReplyToInput");
const composeReferencesInput = document.getElementById("composeReferencesInput");
const composeDateInput = document.getElementById("composeDateInput");
const composeFromInput = document.getElementById("composeFromInput");

const messageText = document.getElementById("messageText");
const messageHtml = document.getElementById("messageHtml");

const subjectInput = document.getElementById("subjectInput");
const subjectHeadings = document.getElementsByClassName("subject-heading");

const recipientsTo = [];
const recipientsCc = [];
const recipientsBcc = [];

const attachmentList = [];

let ignoreOnChange = false;

let messageHtmlLastValidContent = "";
let messageHtmlLastValidCaretPosition;

const composeRemoveConfirmDialog = new bootstrap.Modal(document.querySelector("#composeRemoveConfirmDialog"));

const composeDiscardConfirmDialog = new bootstrap.Modal(document.querySelector("#composeDiscardConfirmDialog"));

let placeholderMessage = {};

// let draft = {};
// let lastDraftId = database.getLastDraftId(); // localStorage.getItem("lastDraftId");

// if (lastDraftId && lastDraftId.length > 0) {
//   console.log(lastDraftId.length);
// }

const REGEX_EMAIL =
  "([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" +
  "(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)";

$("#toInput").selectize({
  openOnFocus: false,
  closeAfterSelect: false,
  plugins: ["remove_button"],
  valueField: "email",
  labelField: "name",
  searchField: ["name", "email"],
  options: [],
  render: {
    item: function (item, escape) {
      return (
        "<div>" +
        (item.name ? '<span class="name">' + escape(item.name + " ") + "</span>" : "") +
        (item.email ? '<span class="email">' + escape(item.email) + "</span>" : "") +
        "</div>"
      );
    },
    option: function (item, escape) {
      var label = item.name || item.email;
      var caption = item.name ? item.email : null;
      return (
        "<div>" +
        '<span class="label">' +
        escape(label) +
        "</span>" +
        (caption ? '<span class="caption">' + escape(caption) + "</span>" : "") +
        "</div>"
      );
    },
  },
  createFilter: function (input) {
    var match, regex;

    // email@address.com
    regex = new RegExp("^" + REGEX_EMAIL + "$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[0]);

    // name <email@address.com>
    regex = new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[2]);

    return false;
  },
  create: function (input) {
    if (new RegExp("^" + REGEX_EMAIL + "$", "i").test(input)) {
      return { email: input };
    }
    var match = input.match(new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i"));
    if (match) {
      return {
        email: match[2],
        name: $.trim(match[1]),
      };
    }
    alert("Invalid email address.");
    return false;
  },
  onChange: function (e) {
    recipientsTo.length = 0;

    for (const item of e) {
      const recipient = this.options[item];

      if (recipient?.name) {
        recipientsTo.push({ email: recipient.email, name: recipient.name });
      } else {
        recipientsTo.push({ email: recipient.email });
      }
    }

    if (!ignoreOnChange) {
      (async () => {
        await formPopulated("upsert");
      })();
    }
  },
});

$("#ccInput").selectize({
  openOnFocus: false,
  closeAfterSelect: false,
  plugins: ["remove_button"],
  valueField: "email",
  labelField: "name",
  searchField: ["name", "email"],
  options: [],
  render: {
    item: function (item, escape) {
      return (
        "<div>" +
        (item.name ? '<span class="name">' + escape(item.name + " ") + "</span>" : "") +
        (item.email ? '<span class="email">' + escape(item.email) + "</span>" : "") +
        "</div>"
      );
    },
    option: function (item, escape) {
      var label = item.name || item.email;
      var caption = item.name ? item.email : null;
      return (
        "<div>" +
        '<span class="label">' +
        escape(label) +
        "</span>" +
        (caption ? '<span class="caption">' + escape(caption) + "</span>" : "") +
        "</div>"
      );
    },
  },
  createFilter: function (input) {
    var match, regex;

    // email@address.com
    regex = new RegExp("^" + REGEX_EMAIL + "$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[0]);

    // name <email@address.com>
    regex = new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[2]);

    return false;
  },
  create: function (input) {
    if (new RegExp("^" + REGEX_EMAIL + "$", "i").test(input)) {
      return { email: input };
    }
    var match = input.match(new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i"));
    if (match) {
      return {
        email: match[2],
        name: $.trim(match[1]),
      };
    }
    alert("Invalid email address.");
    return false;
  },
  onChange: function (e) {
    recipientsCc.length = 0;

    for (const item of e) {
      const recipient = this.options[item];

      if (recipient?.name) {
        recipientsCc.push({ email: recipient.email, name: recipient.name });
      } else {
        recipientsCc.push({ email: recipient.email });
      }
    }

    if (!ignoreOnChange) {
      (async () => {
        await formPopulated("upsert");
      })();
    }
  },
});

$("#bccInput").selectize({
  openOnFocus: false,
  closeAfterSelect: false,
  plugins: ["remove_button"],
  valueField: "email",
  labelField: "name",
  searchField: ["name", "email"],
  options: [],
  render: {
    item: function (item, escape) {
      return (
        "<div>" +
        (item.name ? '<span class="name">' + escape(item.name + " ") + "</span>" : "") +
        (item.email ? '<span class="email">' + escape(item.email) + "</span>" : "") +
        "</div>"
      );
    },
    option: function (item, escape) {
      var label = item.name || item.email;
      var caption = item.name ? item.email : null;
      return (
        "<div>" +
        '<span class="label">' +
        escape(label) +
        "</span>" +
        (caption ? '<span class="caption">' + escape(caption) + "</span>" : "") +
        "</div>"
      );
    },
  },
  createFilter: function (input) {
    var match, regex;

    // email@address.com
    regex = new RegExp("^" + REGEX_EMAIL + "$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[0]);

    // name <email@address.com>
    regex = new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i");
    match = input.match(regex);
    if (match) return !this.options.hasOwnProperty(match[2]);

    return false;
  },
  create: function (input) {
    if (new RegExp("^" + REGEX_EMAIL + "$", "i").test(input)) {
      return { email: input };
    }
    var match = input.match(new RegExp("^([^<]*)<" + REGEX_EMAIL + ">$", "i"));
    if (match) {
      return {
        email: match[2],
        name: $.trim(match[1]),
      };
    }
    alert("Invalid email address.");
    return false;
  },
  onChange: function (e) {
    recipientsBcc.length = 0;

    for (const item of e) {
      const recipient = this.options[item];

      if (recipient?.name) {
        recipientsBcc.push({ email: recipient.email, name: recipient.name });
      } else {
        recipientsBcc.push({ email: recipient.email });
      }
    }

    if (!ignoreOnChange) {
      (async () => {
        await formPopulated("upsert");
      })();
    }
  },
});

let bouncerTimeout = null;
let bouncerHasQueue = false;

const bouncer = (e) => {
  clearTimeout(bouncerTimeout);
  bouncerHasQueue = true;

  bouncerTimeout = setTimeout(() => {
    if (bouncerHasQueue) {
      bouncerHasQueue = false;

      [...subjectHeadings].forEach((heading) => {
        const subject = subjectInput.value;
        const plainContent = messageText.value;
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

        heading.textContent = content;
      });

      // Save form
      (async () => {
        await formPopulated("upsert");
      })();
    }
  }, 2000);
};

subjectInput.addEventListener("keyup", (event) => bouncer(event));
messageText.addEventListener("keyup", (event) => bouncer(event));

let selectedIds = [];

const composeTable = new DataTable("#composeTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ordering: false,
  searching: false,
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
  buttons: [
    // "pageLength",
    {
      text: "Remove",
      className: "files-delete",
      enabled: false,
      action: function () {
        selectedIds = [];

        const selectedData = composeTable
          .rows(".selected")
          .data()
          .map((obj) => obj.id);
        if (selectedData.length > 0) {
          composeRemoveConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedIds.push(selectedData[i]);
          }
        }
      },
    },
  ],
});

$(window).resize(function () {
  if ($(this).height() >= "900") {
    if ($(this).height() >= "1100") {
      composeTable.page.len(15).draw();
    } else {
      composeTable.page.len(10).draw();
    }
  } else {
    composeTable.page.len(5).draw();
  }
});

composeTable.on("select.dt deselect.dt", () => {
  const selected = composeTable.rows({ selected: true }).indexes().length > 0;
  composeTable.buttons([".files-delete"]).enable(selected ? true : false);

  if (selected) {
    document.getElementById("copySelectedFiles").classList.remove("disabled");
  } else {
    document.getElementById("copySelectedFiles").classList.add("disabled");
  }
});

export const idChanged = (e) => {
  if (e.target.value) {
    document.querySelector("#composePanelSend").classList.remove("disabled");
    document.querySelector("#composePanelDiscard").classList.remove("disabled");
  } else {
    document.getElementById("composePanelSend").classList.add("disabled");
    document.getElementById("composePanelDiscard").classList.add("disabled");
  }
};

export const removeAttachments = (e) => {
  e?.preventDefault();

  composeRemoveConfirmDialog.hide();

  composeTable.rows(".selected").remove().draw();
  composeTable.buttons([".files-delete"]).enable(false);

  attachmentList.length = 0;

  for (let i = 0; i < composeTable.rows().count(); i++) {
    const data = composeTable.row(i).data();
    const attachment = {
      digest: data.digest,
      contentType: data.contentType,
      fileName: data?.name ? data?.name : data?.fileName, // file name or attachment fileName
      size: data.size,
    };

    attachmentList.push(attachment);
  }

  (async () => {
    await formPopulated("upsert");
  })();
};

export const clearForm = () => {
  ignoreOnChange = true;

  placeholderMessage = {};

  $("#toInput")[0].selectize.clear();
  $("#ccInput")[0].selectize.clear();
  $("#bccInput")[0].selectize.clear();

  document.getElementById("ccPanel").hidden = true;
  document.getElementById("bccPanel").hidden = true;

  const ccButton = document.querySelector("#ccButton");
  const bccButton = document.querySelector("#bccButton");

  ccButton.style.pointerEvents = "auto";
  ccButton.style.cursor = "pointer";
  ccButton.style.color = "#0d6efd";

  bccButton.style.pointerEvents = "auto";
  bccButton.style.cursor = "pointer";
  bccButton.style.color = "#0d6efd";

  composeForm.reset();
  composeIdInput.dispatchEvent(new Event("input"));
  composeIdInput.dispatchEvent(new Event("change"));
  messageHtml.innerHTML = "";

  messageHtmlLastValidContent = "";
  messageHtmlLastValidCaretPosition = undefined;

  [...subjectHeadings].forEach((heading) => {
    heading.textContent = "";
  });

  attachmentList.length = 0;
  composeTable.clear();
  composeTable.draw();

  ignoreOnChange = false;
};

export const populateForm = async (save, id, parsed) => {
  ignoreOnChange = true;

  attachmentList.length = 0;

  composeIdInput.value = id;
  composeIdInput.dispatchEvent(new Event("input"));
  composeIdInput.dispatchEvent(new Event("change"));

  composeXThreadIdInput.value = parsed.xThreadId;
  composeInReplyToInput.value = parsed.inReplyTo;
  composeReferencesInput.value = parsed.references;

  const ccButton = document.querySelector("#ccButton");
  const bccButton = document.querySelector("#bccButton");

  if (parsed.cc?.length > 0) {
    ccButton.style.pointerEvents = "none";
    ccButton.style.cursor = "default";
    ccButton.style.color = "silver";
  } else {
    ccButton.style.pointerEvents = "auto";
    ccButton.style.cursor = "pointer";
    ccButton.style.color = "#0d6efd";
  }

  if (parsed.bcc?.length > 0) {
    bccButton.style.pointerEvents = "none";
    bccButton.style.cursor = "default";
    bccButton.style.color = "silver";
  } else {
    bccButton.style.pointerEvents = "auto";
    bccButton.style.cursor = "pointer";
    bccButton.style.color = "#0d6efd";
  }

  const selectizeTo = $("#toInput")[0].selectize;
  const selectizeCc = $("#ccInput")[0].selectize;
  const selectizeBcc = $("#bccInput")[0].selectize;

  selectizeTo.addOption(parsed.to);
  selectizeCc.addOption(parsed.to);
  selectizeBcc.addOption(parsed.to);

  selectizeTo.addOption(parsed.cc);
  selectizeCc.addOption(parsed.cc);
  selectizeBcc.addOption(parsed.cc);

  selectizeTo.addOption(parsed.bcc);
  selectizeCc.addOption(parsed.bcc);
  selectizeBcc.addOption(parsed.bcc);

  let values = [];
  for (const item of parsed.to) {
    values.push(item.email);
  }
  selectizeTo.setValue(values);

  values = [];
  for (const item of parsed.cc) {
    values.push(item.email);
  }
  selectizeCc.setValue(values);
  if (values.length > 0) {
    document.getElementById("ccPanel").hidden = false;
  }

  values = [];
  for (const item of parsed.bcc) {
    values.push(item.email);
  }
  selectizeBcc.setValue(values);
  if (values.length > 0) {
    document.getElementById("bccPanel").hidden = false;
  }

  selectizeTo.refreshOptions(false);
  selectizeCc.refreshOptions(false);
  selectizeBcc.refreshOptions(false);

  document.getElementById("ccPanel").hidden = !parsed.cc?.length > 0;
  document.getElementById("bccPanel").hidden = !parsed.bcc?.length > 0;

  messageText.value = parsed.plainContent;
  messageHtml.innerHTML = parsed.htmlContent;

  subjectInput.value = parsed.subject;
  [...subjectHeadings].forEach((heading) => {
    const subject = subjectInput.value;
    const plainContent = messageText.value;
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

    heading.textContent = content;
  });

  composeTable.clear();

  composeAddItems(false, parsed.attachments);

  ignoreOnChange = false;

  if (save) {
    await formPopulated("upsert");
  }

  composeTable.draw();
};

const formPopulated = async (cmd) => {
  const parsed = {
    // date: composeDateInput.value, // will be set on the backend to the "send" action
    from: composeFromInput.value,
    to: recipientsTo,
    cc: recipientsCc,
    bcc: recipientsBcc,
    subject: subjectInput.value,
    plainContent: messageText.value,
    htmlContent: messageHtml.innerHTML,
    attachments: attachmentList,
  };

  const ccButton = document.querySelector("#ccButton");
  const bccButton = document.querySelector("#bccButton");

  if (parsed.cc?.length > 0) {
    ccButton.style.pointerEvents = "none";
    ccButton.style.cursor = "default";
    ccButton.style.color = "silver";
  } else {
    ccButton.style.pointerEvents = "auto";
    ccButton.style.cursor = "pointer";
    ccButton.style.color = "#0d6efd";
  }

  if (parsed.bcc?.length > 0) {
    bccButton.style.pointerEvents = "none";
    bccButton.style.cursor = "default";
    bccButton.style.color = "silver";
  } else {
    bccButton.style.pointerEvents = "auto";
    bccButton.style.cursor = "pointer";
    bccButton.style.color = "#0d6efd";
  }

  let reply = {};

  if (composeXThreadIdInput.value && composeInReplyToInput.value && composeReferencesInput.value) {
    reply = {
      xThreadId: composeXThreadIdInput.value,
      inReplyTo: composeInReplyToInput.value,
      references: composeReferencesInput.value,
    };
  }

  if (cmd == "upsert") {
    placeholderMessage = await upsertDraftsPage(composeForm, composeIdInput.value, reply, parsed);
  } else if (cmd == "send") {
    placeholderMessage = await upsertDraftsPage(composeForm, composeIdInput.value, reply, parsed);
    if (placeholderMessage && Object.keys(placeholderMessage).length > 0) {
      // • this is the last point where you can sign a placeholder message
      await draftsSendDraft(composeForm, composeIdInput.value, reply, parsed, placeholderMessage);
    }
  } else {
    throw new Error(`Unknown command ${cmd} (should be 'upsert or 'send'`);
  }
  // console.log(placeholderMessage);
};

export const composeAddItems = (save, items) => {
  for (let i = items?.length - 1; i >= 0; i--) {
    let found = false;

    for (let j = 0; j < composeTable.rows().count(); j++) {
      const id = composeTable.row(j).data().digest + "@" + composeTable.row(j).data().fileName;
      const fileName = items[i]?.name ? items[i]?.name : items[i]?.fileName;
      if (id == items[i].digest + "@" + fileName) {
        found = true;
        break;
      }
    }

    if (!found) {
      const item = {
        digest: items[i].digest,
        contentType: items[i].contentType,
        fileName: items[i]?.name ? items[i]?.name : items[i]?.fileName, // file name or attachment fileName
        size: items[i].size,
      };

      composeTable.row.add(item);

      const currentPage = composeTable.page();

      let index = composeTable.row(this).index(),
        rowCount = composeTable.data().length - 1,
        insertedRow = composeTable.row(rowCount).data(),
        tempRow;

      for (let k = rowCount; k > index; k--) {
        tempRow = composeTable.row(k - 1).data();
        composeTable.row(k).data(tempRow);
        composeTable.row(k - 1).data(insertedRow);
      }
      composeTable.page(currentPage).draw(false);

      attachmentList.push(item);
    }
  }

  if (save && items?.length > 0) {
    (async () => {
      await formPopulated("upsert");
    })();
  }
};

export const ccToggle = (e) => {
  e?.preventDefault();

  const selectize = $("#ccInput")[0].selectize;
  const selected = selectize.getValue();

  if (selected.length > 0) {
    document.getElementById("ccPanel").hidden = false;
  } else {
    document.getElementById("ccPanel").hidden = !document.getElementById("ccPanel").hidden;
  }
};

export const bccToggle = (e) => {
  e?.preventDefault();

  const selectize = $("#bccInput")[0].selectize;
  const selected = selectize.getValue();

  if (selected.length > 0) {
    document.getElementById("bccPanel").hidden = false;
  } else {
    document.getElementById("bccPanel").hidden = !document.getElementById("bccPanel").hidden;
  }
};

const getFullName = (firstName, lastName) => {
  const fullName = firstName?.length > 0 ? firstName + " " + lastName : lastName;

  return fullName.trim();
};

const setSelectizeComposeContacts = (selectize, composeContacts) => {
  // add or update
  for (const composeContact of composeContacts) {
    const item = selectize.options[composeContact.email];

    if (item) {
      selectize.updateOption(composeContact.email, composeContact);
    } else {
      selectize.addOption(composeContact);
    }
  }

  // remove if not selected
  for (const [key, value] of Object.entries(selectize.options)) {
    const item = composeContacts.find((x) => x.email == key);

    if (!item) {
      const selected = selectize.getValue();
      const selectedItem = selected.find((x) => x == key);

      if (!selectedItem) {
        selectize.removeOption(key);
      }
    }
  }

  selectize.refreshOptions(false);
};

export const setComposeContacts = (contacts) => {
  const composeContacts = contacts.map((c) => ({
    email: c.emailAddress,
    name: getFullName(c.firstName, c.lastName),
  }));

  const selectizeTo = $("#toInput")[0].selectize;
  setSelectizeComposeContacts(selectizeTo, composeContacts);

  const selectizeCc = $("#ccInput")[0].selectize;
  setSelectizeComposeContacts(selectizeCc, composeContacts);

  const selectizeBcc = $("#bccInput")[0].selectize;
  setSelectizeComposeContacts(selectizeBcc, composeContacts);
};

export const newDraft = async (e) => {
  e?.preventDefault();

  clearTimeout(bouncerTimeout);

  if (bouncerHasQueue) {
    bouncerHasQueue = false;

    // Save form
    (async () => {
      await formPopulated("upsert");
      clearForm();
    })();
  } else {
    clearForm();
  }
};

export const discardDraft = (e) => {
  e.preventDefault();

  composeDiscardConfirmDialog.show();
};

export const deleteDraft = (e) => {
  e.preventDefault();

  composeDiscardConfirmDialog.hide();

  if (composeIdInput.value) {
    clearTimeout(bouncerTimeout);
    bouncerHasQueue = false;

    (async () => {
      await draftsDeleteDraft(composeForm, composeIdInput.value);
    })();
  }
};

export const sendDraft = (e) => {
  e.preventDefault();

  clearTimeout(bouncerTimeout);
  bouncerHasQueue = false;

  (async () => {
    await formPopulated("send");
  })();
};

const TEXT_MAX_SIZE = 50000;
const HTML_MAX_SIZE = 100000;

export const messageHtmlChanged = (e) => {
  const alert = composeForm.querySelector('div[name="messageHtmlChangedAlert"]');
  if (alert) alert.remove();

  const encodedMessageHtml = b64EncodeUtf8(messageHtml.innerHTML);

  if (encodedMessageHtml.length > HTML_MAX_SIZE) {
    const error = "html text too long";

    composeForm.insertAdjacentHTML(
      "beforeend",
      `<div class="alert alert-danger alert-dismissible fade show" role="alert" name="messageHtmlChangedAlert">
                ${error}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>`
    );

    messageHtml.innerHTML = messageHtmlLastValidContent;

    if (messageHtmlLastValidCaretPosition) {
      setCaretPosition(messageHtml, messageHtmlLastValidCaretPosition);
    }

    return;
  }

  if (messageHtml.innerText.length > TEXT_MAX_SIZE) {
    const error = "text too long";

    composeForm.insertAdjacentHTML(
      "beforeend",
      `<div class="alert alert-danger alert-dismissible fade show" role="alert" name="messageHtmlChangedAlert">
                ${error}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>`
    );

    messageHtml.innerHTML = messageHtmlLastValidContent;

    if (messageHtmlLastValidCaretPosition) {
      setCaretPosition(messageHtml, messageHtmlLastValidCaretPosition);
    }

    return;
  }

  // const sanitizer = new Sanitizer();
  // messageHtml.setHTML(messageHtml.innerHTML, sanitizer);

  // console.log(messageHtml.innerHTML);

  messageHtmlLastValidContent = messageHtml.innerHTML;
  // messageHtmlLastValidCaretPosition = getCaretPosition(messageHtml);

  messageText.value = messageHtml.innerText;

  bouncer(e);
};

export const messageHtmlOnFocusIn = (e) => {
  if (e.relatedTarget?.id == "subjectInput") {
    if (messageHtmlLastValidCaretPosition) {
      setCaretPosition(messageHtml, messageHtmlLastValidCaretPosition);
    }
  }
};

export const messageHtmlOnMouseUp = (e) => {
  messageHtmlLastValidCaretPosition = getCaretPosition(messageHtml);
};

export const messageHtmlOnKeyUp = (e) => {
  messageHtmlLastValidCaretPosition = getCaretPosition(messageHtml);
};
