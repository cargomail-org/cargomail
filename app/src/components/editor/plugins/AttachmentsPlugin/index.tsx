import * as React from 'react'

import './index.css'

export default function AttachmentsPlugin(): JSX.Element {
  return (
    <div className="attachments-plugin">
      {/* <div className="title">Drag and drop files here or click</div> */}
      <div className="attachment-list">
        <div className="attachment-item">
          <div className="attachment-name">Identity-Based Encryption.docx</div>
        </div>
        <div className="attachment-item">
          <div className="attachment-name">Orange Invoice.pdf</div>
        </div>
        <div className="attachment-item">
          <div className="attachment-name">O2 Invoice.pdf</div>
        </div>
      </div>
    </div>
  )
}
