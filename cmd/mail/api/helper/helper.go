package helper

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

func ToAscii(str string) (string, error) {
	result, _, err := transform.String(transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn))), str)
	if err != nil {
		return "", err
	}
	return result, nil
}

func ReturnErr(w http.ResponseWriter, err error, code int) {
	errorMessage := struct {
		Err string
	}{
		Err: err.Error(),
	}

	w.WriteHeader(code)
	json.NewEncoder(w).Encode(errorMessage)
}

func SetJsonHeader(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
}

func FromJson[T any](body io.Reader, target T) {
	buf := new(bytes.Buffer)
	buf.ReadFrom(body)
	json.Unmarshal(buf.Bytes(), &target)
}

func SetJsonResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if statusCode > 0 {
		w.WriteHeader(statusCode)
	}
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func Decoder(body io.ReadCloser) *json.Decoder {
	dec := json.NewDecoder(body)
	dec.DisallowUnknownFields()

	return dec
}
