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
import { updateDraftsPage } from "/public/js/drafts.js";

const composeForm = document.getElementById("composeForm");
const composeUriInput = document.getElementById("composeUriInput");

let draft = {};
// let lastDraftUri = database.getLastDraftUri(); // localStorage.getItem("lastDraftUri");

// if (lastDraftUri && lastDraftUri.length > 0) {
//   console.log(lastDraftUri.length);
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
        (item.name
          ? '<span class="name">' + escape(item.name + " ") + "</span>"
          : "") +
        (item.email
          ? '<span class="email">' + escape(item.email) + "</span>"
          : "") +
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
        (caption
          ? '<span class="caption">' + escape(caption) + "</span>"
          : "") +
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
    const recipients = [];

    for (const item of e) {
      const recipient = this.options[item];
      recipients.push({ email: recipient.email, name: recipient.name });
    }

    updateDraftsPage(composeUriInput.value, { to: recipients });
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
        (item.name
          ? '<span class="name">' + escape(item.name + " ") + "</span>"
          : "") +
        (item.email
          ? '<span class="email">' + escape(item.email) + "</span>"
          : "") +
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
        (caption
          ? '<span class="caption">' + escape(caption) + "</span>"
          : "") +
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
    const recipients = [];

    for (const item of e) {
      const recipient = this.options[item];
      recipients.push({ email: recipient.email, name: recipient.name });
    }

    updateDraftsPage(composeUriInput.value, { cc: recipients });
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
        (item.name
          ? '<span class="name">' + escape(item.name + " ") + "</span>"
          : "") +
        (item.email
          ? '<span class="email">' + escape(item.email) + "</span>"
          : "") +
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
        (caption
          ? '<span class="caption">' + escape(caption) + "</span>"
          : "") +
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
    const recipients = [];

    for (const item of e) {
      const recipient = this.options[item];
      recipients.push({ email: recipient.email, name: recipient.name });
    }

    updateDraftsPage(composeUriInput.value, { bcc: recipients });
  },
});

const subjectInput = document.getElementById("subjectInput");
const messageText = document.getElementById("messageText");

const subjectHeadings = document.getElementsByClassName("subject-heading");
let bouncerTimeout = null;

const bouncer = (e) => {
  clearTimeout(bouncerTimeout);
  bouncerTimeout = setTimeout(() => {
    [...subjectHeadings].forEach((heading) => {
      heading.textContent = subjectInput.value;
    });
    // Save Body
    updateDraftsPage(composeUriInput.value, { subject: subjectInput.value, plainContent: messageText.value });
  }, 2000);
};

subjectInput.addEventListener("keyup", (event) => bouncer(event));
messageText.addEventListener("keyup", (event) => bouncer(event));

let selectedUris = [];

const composeConfirmDialog = new bootstrap.Modal(
  document.querySelector("#composeConfirmDialog")
);

const composeTable = new DataTable("#composeTable", {
  paging: true,
  responsive: {
    details: false,
  },
  ordering: false,
  searching: false,
  columns: [
    { data: "uri", visible: false, searchable: false },
    { data: null, visible: true, orderable: false, width: "15px" },
    {
      data: "fileName",
      render: (data, type, full, meta) => {
        const link = `${window.apiHost}/api/v1/files/`;
        return `<a class="attachmentLink" href="javascript:;" onclick="downloadURI('composeForm', '${link}${full.uri}', '${data}');">${data}</a>`;
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
      text: "Remove",
      className: "files-delete",
      enabled: false,
      action: function () {
        selectedUris = [];

        const selectedData = composeTable
          .rows(".selected")
          .data()
          .map((obj) => obj.uri);
        if (selectedData.length > 0) {
          composeConfirmDialog.show();
          for (let i = 0; i < selectedData.length; i++) {
            selectedUris.push(selectedData[i]);
          }
        }
      },
    },
  ],
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

export const removeAttachments = (e) => {
  e?.preventDefault();

  composeConfirmDialog.hide();

  composeTable.rows(".selected").remove().draw();
  composeTable.buttons([".files-delete"]).enable(false);
};

export const populateForm = (uri, parsed) => {
  composeUriInput.value = uri;

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

  subjectInput.value = parsed.subject;
  [...subjectHeadings].forEach((heading) => {
    heading.textContent = subjectInput.value;
  });

  messageText.value = parsed.plainContent;

  composeTable.clear();

  composeAddItems(parsed.attachments);

  composeTable.draw();
};

export const composeAddItems = (items) => {
  for (let i = items.length - 1; i >= 0; i--) {
    let found = false;

    for (let j = 0; j < composeTable.rows().count(); j++) {
      const uri = composeTable.row(j).data().uri;
      if (uri == items[i].uri) {
        found = true;
        break;
      }
    }

    if (!found) {
      const item = {
        uri: items[i].uri,
        contentType: items[i].contentType,
        fileName: items[i]?.name ? items[i]?.name : items[i]?.fileName, // file name or attachment fileName
        size: items[i].size,
      };

      composeTable.row.add(item);

      var currentPage = composeTable.page();

      var index = composeTable.row(this).index(),
        rowCount = composeTable.data().length - 1,
        insertedRow = composeTable.row(rowCount).data(),
        tempRow;

      for (var k = rowCount; k > index; k--) {
        tempRow = composeTable.row(k - 1).data();
        composeTable.row(k).data(tempRow);
        composeTable.row(k - 1).data(insertedRow);
      }
      composeTable.page(currentPage).draw(false);
    }
  }
};

export const ccToggle = (e) => {
  e?.preventDefault();

  const selectize = $("#ccInput")[0].selectize;
  const selected = selectize.getValue();

  if (selected.length > 0) {
    document.getElementById("ccPanel").hidden = false;
  } else {
    document.getElementById("ccPanel").hidden =
      !document.getElementById("ccPanel").hidden;
  }
};

export const bccToggle = (e) => {
  e?.preventDefault();

  const selectize = $("#bccInput")[0].selectize;
  const selected = selectize.getValue();

  if (selected.length > 0) {
    document.getElementById("bccPanel").hidden = false;
  } else {
    document.getElementById("bccPanel").hidden =
      !document.getElementById("bccPanel").hidden;
  }
};

const getFullName = (firstName, lastName) => {
  const fullName =
    firstName?.length > 0 ? firstName + " " + lastName : lastName;

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
