package resourcev1

type File struct {
	Id           string `json:"id,omitempty"`
	TransientUri string `json:"transient_uri,omitempty"`
	Filename     string `json:"filename,omitempty"`
	MimeType     string `json:"mime_type,omitempty"`
	Sha256Sum    string `json:"sha256sum,omitempty"`
	Size         int64  `json:"size,omitempty"`
}