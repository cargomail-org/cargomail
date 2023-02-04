import { mimeTypes } from 'mime-wrapper'
import jsSHA from 'jssha'

interface BufferStreamProps<W> {
  onStart?(): void
  onChunk?(chunk: W): void | PromiseLike<void>
  onEnd?(): void
  queuingStrategy?: QueuingStrategy<W>
}

class BufferStream<W> extends WritableStream<W> {
  constructor(props: BufferStreamProps<W>) {
    super(
      {
        start() {
          if (props.onStart) props.onStart()
        },
        async write(chunk) {
          if (props.onChunk) await props.onChunk(chunk)
        },
        close() {
          if (props.onEnd) props.onEnd()
        },
        abort(error) {
          return Promise.reject(error)
        },
      },
      props.queuingStrategy
    )
  }
}

export class DownloadService {
  __url: string
  __filename: string
  __mimeType: string
  __fileSize: number
  __sha256sum: string
  __onProgress: any

  constructor(url: string, filename: string, mimeType: string, fileSize: number, sha256sum: string, onProgress: any) {
    this.__url = url
    this.__filename = filename
    this.__mimeType = mimeType
    this.__fileSize = fileSize
    this.__sha256sum = sha256sum
    this.__onProgress = onProgress
  }

  streamToMedia = async (mediaSource: any, video: any) => {
    let shaObj: any

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
      const response = await fetch(this.__url)
      const wait = () => new Promise((resolve) => (sourceBuffer.onupdateend = resolve))
      const writable = new BufferStream({
        onStart() {
          shaObj = new jsSHA('SHA-256', 'ARRAYBUFFER')
        },
        onChunk: async (chunk: any) => {
          if (video!.error) return

          shaObj.update(chunk)

          sourceBuffer.appendBuffer(chunk)
          await wait()
        },
        onEnd: () => {
          sourceBuffer.addEventListener('updateend', mediaSource.endOfStream)

          mediaSource.endOfStream()
          // sourceBuffer.onupdateend = () => {
          //   mediaSource.endOfStream()
          // }

          if (this.__url.length > 0 && shaObj.getHash('HEX') !== this.__sha256sum) {
            throw new DOMException('checksum mismatch', 'ChecksumError')
          }
        },
      })

      const body = response.body
      body!.pipeTo(writable).catch((err: any) => {
        console.error(err)
        setTimeout(() => {
          alert(err)
        }, 200)
      })
    })

    /*mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
      const response = await fetch(this.__url)
      const body = response.body
      const reader = body!.getReader()

      let streamNotDone = true

      while (streamNotDone) {
        const { value, done } = await reader.read()

        if (done) {
          streamNotDone = false
          break
        }

        await new Promise((resolve, reject) => {
          sourceBuffer.appendBuffer(value)

          sourceBuffer.onupdateend = () => {
            resolve(true)
          }
        })
      }
    })*/
  }

  streamToFile = async () => {
    let shaObj: any

    const extension = mimeTypes.getExtension(this.__mimeType)
    const acceptExtensions = [extension.length > 0 ? `.${extension}` : '']

    const opts = {
      suggestedName: this.__filename,
      types: [
        {
          description: `${extension} files`,
          accept: {
            [this.__mimeType]: acceptExtensions,
          },
        },
      ],
    }

    // writable stream
    // @ts-ignore
    const ws_dest = await window.showSaveFilePicker(opts).then((handle: any) => handle.createWritable())

    // readable stream
    const rs_src = fetch(this.__url).then((response) => response.body)

    // transform stream to compute checksum and transferred bytes
    class ProgressStream extends TransformStream {
      constructor(props: {
        url: string
        fileSize: number
        sha256sum: string
        onProgress(bytesDownloaded: number, bytesTotal: number): void
      }) {
        const fileSize = parseFloat(props.fileSize.toString())
        let transferred: number = 0
        let progressDate: any = new Date()
        const progressInterval: number = 1000 // 1 sec
        super({
          start() {
            shaObj = new jsSHA('SHA-256', 'ARRAYBUFFER')
          },
          transform: async (chunk, controller) => {
            if (((new Date() as any) - progressDate) / progressInterval >= 1) {
              progressDate = new Date()
              props.onProgress(transferred, fileSize)
            }
            transferred += parseFloat(chunk.length.toString())

            shaObj.update(chunk)

            controller.enqueue(chunk)
          },
          flush(controller) {
            props.onProgress(transferred, fileSize)

            if (props.url.length > 0 && shaObj.getHash('HEX') !== props.sha256sum) {
              controller.error(new Error('checksum mismatch'))
            }
          },
        })
      }
    }

    const ts_progress = new ProgressStream({
      url: this.__url,
      fileSize: this.__fileSize,
      sha256sum: this.__sha256sum,
      onProgress: this.__onProgress,
    })

    // stream to tmp
    const rs_tmp = rs_src.then((s: any) => s.pipeThrough(ts_progress))
    // stream to file
    return (await rs_tmp).pipeTo(await ws_dest).catch((err: any) => {
      console.error(err)
      setTimeout(() => {
        alert(err)
      }, 200)
    })
  }
}
