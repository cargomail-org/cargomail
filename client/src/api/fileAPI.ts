import * as tus from 'tus-js-client'

export const startOrResumeUpload = (upload: any) => {
  upload.findPreviousUploads().then(function (previousUploads: any) {
    if (previousUploads.length) {
      upload.resumeFromPreviousUpload(previousUploads[0])
    }
    upload.start()
  })
}

export const createTusUploadInstance = (file: File) => {
  const upload: any = new tus.Upload(file, {
    endpoint: process.env.REACT_APP_TUS_ENDPOINT,
    retryDelays: [0, 3000, 5000],
    chunkSize: 1024, // Upload slowdown
    enableChecksum: true,
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: (error: any) => console.log('Failed because: ' + error),
    onSuccess: () => {
      console.log('Download %s checksum:%s from %s', upload.file.name, upload.sha256sum, upload.url)
    },
  })
  return upload
}
