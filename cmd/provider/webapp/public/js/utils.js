const b64EncodeUtf8 = (str) => {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
};

const b64DecodeUtf8 = (base64) => {
  const text = atob(base64);
  const length = text.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = text.charCodeAt(i);
  }

  const decoder = new TextDecoder(); // default is utf-8

  return decoder.decode(bytes);
};

const parseNameAndEmail = (value) => {
  if (!value) return { name: "", email: "" };

  const delimiterIndex = value.lastIndexOf(" ");

  let name;
  let email;

  if (delimiterIndex === -1) {
    email =
      value[0] === "<"
        ? value.slice(1, value.length - 1)
        : value.slice(0, value.length);
  } else {
    name =
      value[0] === '"'
        ? value.slice(1, delimiterIndex - 1)
        : value.slice(0, delimiterIndex);
    email = value.slice(delimiterIndex + 2, value.length - 1);
  }

  if (name) {
    return { name, email };
  } else {
    return { email };
  }
};

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

const getPartsWithContainersExcluded = (payload) => {
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
      result.push(...getPartsWithContainersExcluded(part));
    });
  }

  return result;
};

const parseParts = (payload) => {
  const partsWithContainersExcluded = getPartsWithContainersExcluded(payload);

  let plainContent;
  let htmlContent;

  const plainPart = partsWithContainersExcluded.find((part) => {
    return (
      !Array.isArray(part["Content-Type"]) &&
      part["Content-Type"] &&
      part["Content-Type"].startsWith("text/plain")
    );
  });

  const htmlPart = partsWithContainersExcluded.find((part) => {
    return (
      !Array.isArray(part["Content-Type"]) &&
      part["Content-Type"] &&
      part["Content-Type"].startsWith("text/html")
    );
  });

  const attachmentsDisposition = partsWithContainersExcluded.filter((part) =>
    part["Content-Disposition"]?.startsWith("attachment")
  );

  const link = `${window.apiHost}/api/v1/files/`;
  const attachments = [];

  for (const attachmentDisposition of attachmentsDisposition) {
    let attachmentFileName = attachmentDisposition["Content-Disposition"]
      .split("filename=")
      .pop();
    if (attachmentFileName) {
      attachmentFileName = attachmentFileName.replace(/^"(.+(?="$))"$/, "$1");
    }

    const attachmentContentType = attachmentDisposition["Content-Type"].find(
      (item) => !item.startsWith("message/external-body")
    );

    const externalContent = attachmentDisposition["Content-Type"].find((item) =>
      item.startsWith("message/external-body")
    );

    let attachmentUri = "#";

    if (externalContent) {
      attachmentUri = externalContent.split("uri=").pop();

      const quotedStrings = attachmentUri.split('"');
      if (quotedStrings?.length > 1) {
        attachmentUri = quotedStrings[1];
      } else {
        attachmentUri = "#";
      }
    }

    let attachmentSize;

    if (externalContent) {
      attachmentSize = externalContent.split("size=").pop();

      const quotedStrings = attachmentSize.split('"');
      if (quotedStrings?.length > 1) {
        attachmentSize = quotedStrings[1];
      } else {
        attachmentSize = undefined;
      }
    }

    let attachmentDigestSha256;

    if (externalContent) {
      attachmentDigestSha256 = externalContent.split("digest:sha-256=").pop();

      const quotedStrings = attachmentDigestSha256.split('"');
      if (quotedStrings?.length > 1) {
        attachmentDigestSha256 = quotedStrings[1];
      } else {
        attachmentDigestSha256 = undefined;
      }
    }

    if (attachmentUri && attachmentFileName && attachmentSize) {
      if (attachmentDigestSha256 > 0) {
        attachments.push({
          uri: attachmentUri,
          contentType: attachmentContentType,
          fileName: attachmentFileName,
          size: parseInt(attachmentSize),
          digestSha256: attachmentDigestSha256,
        });
      } else {
        attachments.push({
          uri: attachmentUri,
          contentType: attachmentContentType,
          fileName: attachmentFileName,
          size: parseInt(attachmentSize),
        });
      }
    }
  }

  if (plainPart?.["Content-Transfer-Encoding"] == "base64") {
    plainContent = plainPart?.body?.data
      ? b64DecodeUtf8(plainPart.body.data)
      : undefined;
  } else {
    plainContent = plainPart?.body?.data ? plainPart.body.data : undefined;
  }

  if (htmlPart?.["Content-Transfer-Encoding"] == "base64") {
    htmlContent = htmlPart?.body?.data
      ? b64DecodeUtf8(htmlPart.body.data)
      : undefined;
  } else {
    htmlContent = htmlPart?.body?.data ? htmlPart.body.data : undefined;
  }

  return { plainContent, htmlContent, attachments };
};

export const parsePayload = (uri, payload) => {
  const date = payload?.headers?.["Date"] || "";

  const from = payload?.headers?.["From"] || "";

  const to = (payload?.headers?.["To"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const cc = (payload?.headers?.["Cc"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const bcc = (payload?.headers?.["Bcc"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const subject = payload?.headers?.["Subject"] || "";

  try {
    const {
      plainContent = "",
      htmlContent = "",
      attachments = [],
    } = payload ? parseParts(payload) : {};
    return {
      date,
      from,
      to,
      cc,
      bcc,
      subject,
      plainContent,
      htmlContent,
      attachments,
    };
  } catch (e) {
    console.log(`message uri: ${uri}`);
    console.log(e);
    return {
      date,
      from,
      to,
      cc,
      bcc,
      subject,
      plainContent: `Parse failed for Message ${uri}`,
      htmlContent: `<span>Parse failed for Message ${uri}</span>`,
      attachments: [],
    };
  }
};

const composeNameAndEmail = (recipients) => {
  let result = "";

  recipients.forEach((recipient, i) => {
    if (recipient?.name) {
      result += `${recipient.name} <${recipient.email}>`;
    } else {
      result += `<${recipient.email}>`;
    }

    if (i < recipients.length - 1) {
      result = `${result}, `;
    }
  });

  return result;
};

export const composePayload = (parsed) => {
  const payload = { headers: {} };

  if (parsed.date !== undefined) {
    payload.headers["Date"] = parsed.date;
  }

  if (parsed.from !== undefined) {
    payload.headers["From"] = parsed.from;
  }

  if (parsed.to?.length > 0) {
    payload.headers["To"] = composeNameAndEmail(parsed.to);
  } else {
    delete payload.headers["To"];
  }

  if (parsed.cc?.length > 0) {
    payload.headers["Cc"] = composeNameAndEmail(parsed.cc);
  } else {
    delete payload.headers["Cc"];
  }

  if (parsed.bcc?.length > 0) {
    payload.headers["Bcc"] = composeNameAndEmail(parsed.bcc);
  } else {
    delete payload.headers["Bcc"];
  }

  if (parsed.subject !== undefined) {
    payload.headers["Subject"] = parsed.subject;
  }

  if (
    parsed.plainContent !== undefined ||
    parsed.htmlContent !== undefined ||
    parsed.attachments?.length > 0
  ) {
    let plainTextPart;
    let htmlTextPart;
    const attachmentParts = [];

    if (parsed.plainContent) {
      plainTextPart = {
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Content-Transfer-Encoding": "base64",
        },
        body: { data: b64EncodeUtf8(parsed.plainContent) },
      };
    }

    if (parsed.htmlContent) {
      htmlTextPart = {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Content-Transfer-Encoding": "base64",
        },
        body: { data: b64EncodeUtf8(parsed.htmlContent) },
      };
    }

    if (parsed.attachments?.length > 0) {
      for (const attachment of parsed.attachments) {
        const attachmentPart = {
          headers: {
            "Content-Type": [
              `message/external-body; uri="${attachment.uri}"; size="${attachment.size}"`,
              attachment.contentType,
            ],
            "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
          },
        };
        attachmentParts.push(attachmentPart);
      }
    }

    let alternativeTextPart;

    if (plainTextPart && htmlTextPart) {
      alternativeTextPart = {
        headers: { "Content-Type": "multipart/alternative" },
        parts: [],
      };
      alternativeTextPart.parts.push(plainTextPart);
      alternativeTextPart.parts.push(htmlTextPart);
    }

    let mixedAttachmentsPart;

    if (attachmentParts.length > 0) {
      mixedAttachmentsPart = {
        headers: { "Content-Type": "multipart/mixed" },
        parts: attachmentParts,
      };
    }

    if (
      (plainTextPart || htmlTextPart || alternativeTextPart) &&
      mixedAttachmentsPart
    ) {
      payload.headers["Content-Type"] = "multipart/mixed";
      payload.parts = [];

      if (alternativeTextPart) {
        payload.parts.push(alternativeTextPart);
      } else if (plainTextPart) {
        payload.parts.push(plainTextPart);
      } else if (htmlTextPart) {
        payload.parts.push(htmlTextPart);
      }

      payload.parts.push(mixedAttachmentsPart);
    } else if (plainTextPart || htmlTextPart || alternativeTextPart) {
      if (alternativeTextPart) {
        payload.headers = {...payload.headers, ...alternativeTextPart.headers};
        payload.parts = alternativeTextPart.parts;
      } else if (plainTextPart) {
        payload.headers = {...payload.headers, ...plainTextPart.headers};
        payload.body = plainTextPart.body;
      } else if (htmlTextPart) {
        payload.headers = {...payload.headers, ...htmlTextPart.headers};
        payload.body = htmlTextPart.body;
      }
    }
  }

  return payload;
};
