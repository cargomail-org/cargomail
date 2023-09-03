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

const composeForm = document.getElementById("composeForm");

let draft = {};
// let lastDraftUri = database.getLastDraftUri(); // localStorage.getItem("lastDraftUri");

// if (lastDraftUri && lastDraftUri.length > 0) {
//   console.log(lastDraftUri.length);
// }

const REGEX_EMAIL =
  "([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" +
  "(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)";

$("#toInput").selectize({
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
    console.log(e);
    // Save Draft
  },
});

$("#ccInput").selectize({
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
    console.log(e);
    // Save Draft
  },
});

$("#bccInput").selectize({
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
    console.log(e);
    // Save Draft
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
    console.log("save body");
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
      data: "name",
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

export const populateForm = (parsed) => {
  const subject = parsed.subject;
  
  subjectInput.value = subject;
  [...subjectHeadings].forEach((heading) => {
    heading.textContent = subjectInput.value;
  });
};

export const addItems = (items) => {
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
      composeTable.row.add(items[i]);

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

export const ccShow = (e) => {
  e?.preventDefault();

  document.getElementById("ccPanel").hidden = false;
};

export const bccShow = (e) => {
  e?.preventDefault();

  document.getElementById("bccPanel").hidden = false;
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
