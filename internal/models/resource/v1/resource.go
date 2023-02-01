package resourcev1

type File struct {
	Id           string `json:"id,omitempty"`
	DownloadUrl  string `json:"download_url,omitempty"`
	Filename     string `json:"filename,omitempty"`
	MimeType     string `json:"mime_type,omitempty"`
	Sha256Sum    string `json:"sha256sum,omitempty"`
	FileSize         int64  `json:"size,omitempty"`
}