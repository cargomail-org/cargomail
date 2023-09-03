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
    if (attachmentFileName?.length > 0) {
      attachmentFileName = attachmentFileName.replace(/^"(.+(?="$))"$/, "$1");
    }

    const externalContent = attachmentDisposition["Content-Type"].find((item) =>
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

    let attachmentSize;

    if (externalContent) {
        attachmentSize = externalContent.split("size=").pop();

      const quotedStrings = attachmentSize.split('"');
      if (quotedStrings?.length > 0) {
        attachmentSize = quotedStrings[1];
      } else {
        attachmentSize = undefined;
      }
    }

    let attachmentDigestSha256;

    if (externalContent) {
        attachmentDigestSha256 = externalContent.split("digest:sha-256=").pop();

      const quotedStrings = attachmentDigestSha256.split('"');
      if (quotedStrings?.length > 0) {
        attachmentDigestSha256 = quotedStrings[1];
      } else {
        attachmentDigestSha256 = undefined;
      }
    }

    if (attachmentUri?.length > 0 && attachmentFileName?.length > 0 && attachmentSize?.length > 0) {
      attachments.push({uri: attachmentUri, fileName: attachmentFileName, size: attachmentSize, digestSha256: attachmentDigestSha256 || ""});
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
    htmlContent = htmlPart?.body?.data
      ? atob(htmlPart.body.data)
      : undefined;
  } else {
    htmlContent = htmlPart?.body?.data ? htmlPart.body.data : undefined;
  }

  return {plainContent, htmlContent, attachments};
};

export const parsePayload = (uri, payload) => {
  const from = payload?.headers?.["From"] || "";
  const to = payload?.headers?.["To"] || "";
  const cc = payload?.headers?.["Cc"] || "";
  const bcc = payload?.headers?.["Bcc"] || "";
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
