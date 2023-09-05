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

    if (
      attachmentUri &&
      attachmentFileName &&
      attachmentSize
    ) {
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
      ? atob(plainPart.body.data)
      : undefined;
  } else {
    plainContent = plainPart?.body?.data ? plainPart.body.data : undefined;
  }

  if (htmlPart?.["Content-Transfer-Encoding"] == "base64") {
    htmlContent = htmlPart?.body?.data ? atob(htmlPart.body.data) : undefined;
  } else {
    htmlContent = htmlPart?.body?.data ? htmlPart.body.data : undefined;
  }

  return { plainContent, htmlContent, attachments };
};

export const parsePayload = (uri, payload) => {
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

export const composePayload = (payload, parsed) => {
  if (!payload.headers) payload.headers = {};

  if (parsed.to) {
    payload.headers["To"] = composeNameAndEmail(parsed.to);
  }

  if (parsed.cc) {
    payload.headers["Cc"] = composeNameAndEmail(parsed.cc);
  }

  if (parsed.bcc) {
    payload.headers["Bcc"] = composeNameAndEmail(parsed.bcc);
  }

  if (parsed.subject !== undefined) {
    payload.headers["Subject"] = parsed.subject;
  }

  return payload;
};
