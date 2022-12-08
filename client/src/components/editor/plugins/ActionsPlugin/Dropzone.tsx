// https://blog.logrocket.com/create-a-drag-and-drop-component-with-react-dropzone

import React, { useRef, useState, useEffect } from 'react'

import './Dropzone.css'

const Dropzone = ({ validFiles, setValidFiles }: any) => {
  const [dragActive, setDragActive] = useState<Boolean>(false)
  const fileInputRef = useRef<any>(null)
  const [selectedFiles, setSelectedFiles] = useState<any>([])
  const [unsupportedFiles, setUnsupportedFiles] = useState<any>([])

  useEffect(() => {
    let filteredArr = selectedFiles.reduce((acc: any, current: any) => {
      const x = acc.find((item: any) => item.name === current.name)
      if (!x) {
        return acc.concat([current])
      } else {
        return acc
      }
    }, [])
    setValidFiles([...filteredArr])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles])

  const preventDefault = (e: any) => {
    e.preventDefault()
    // e.stopPropagation();
  }

  const dragOver = (e: any) => {
    preventDefault(e)
    e.dataTransfer.dropEffect = 'move'
    setDragActive(true)
  }

  const dragEnter = (e: any) => {
    preventDefault(e)
    e.dataTransfer.dropEffect = 'move'
    setDragActive(true)
  }

  const dragLeave = (e: any) => {
    preventDefault(e)
    setDragActive(false)
  }

  const fileDrop = (e: any) => {
    preventDefault(e)
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files.length) {
      handleFiles(files)
    }
  }

  const filesSelected = () => {
    if (fileInputRef.current.files.length) {
      handleFiles(fileInputRef.current.files)
    }
  }

  const fileInputClicked = () => {
    fileInputRef.current.click()
  }

  const handleFiles = (files: any) => {
    for (let i = 0; i < files.length; i++) {
      if (validateFile(files[i])) {
        setSelectedFiles((prevArray: any) => [...prevArray, files[i]])
      } else {
        files[i]['invalid'] = true
        setSelectedFiles((prevArray: any) => [...prevArray, files[i]])
        setUnsupportedFiles((prevArray: any) => [...prevArray, files[i]])
      }
    }
  }

  const validateFile = (file: any) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/x-icon']
    if (validTypes.indexOf(file.type) === -1) {
      return false
    }

    return true
  }

  const fileSize = (size: any) => {
    if (size === 0) {
      return '0 Bytes'
    }
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fileType = (fileName: any) => {
    return fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length) || fileName
  }

  const removeFile = (name: any) => {
    const index = validFiles.findIndex((e: any) => e.name === name)
    const index2 = selectedFiles.findIndex((e: any) => e.name === name)
    const index3 = unsupportedFiles.findIndex((e: any) => e.name === name)
    validFiles.splice(index, 1)
    selectedFiles.splice(index2, 1)
    setValidFiles([...validFiles])
    setSelectedFiles([...selectedFiles])
    if (index3 !== -1) {
      unsupportedFiles.splice(index3, 1)
      setUnsupportedFiles([...unsupportedFiles])
    }
  }

  return (
    <div className="container">
      <div className="container">
        {unsupportedFiles.length ? <p>Please remove all unsupported files.</p> : ''}
        <div
          className="drop-container"
          style={{ borderColor: dragActive ? 'green' : '#4aa1f3' }}
          onDragOver={dragOver}
          onDragEnter={dragEnter}
          onDragLeave={dragLeave}
          onDrop={fileDrop}
          onClick={fileInputClicked}>
          <div className="drop-message">
            <div className="upload-icon"></div>
            Drag & Drop files here or click to select file(s)
          </div>
          <input ref={fileInputRef} className="file-input" type="file" multiple onChange={filesSelected} />
        </div>
        <div className="file-display-container">
          {validFiles.map((data: any, i: any) => (
            <div className="file-props-bar" key={i}>
              <div>
                <div className="file-type-logo"></div>
                <div className="file-type">{fileType(data.name)}</div>
                <span className={`file-name ${data.invalid ? 'file-error' : ''}`}>{data.name}</span>
                <span className="file-size">({fileSize(data.size)})</span>
              </div>
              <div className="file-remove" onClick={() => removeFile(data.name)}>
                X
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dropzone
