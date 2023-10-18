package api

import (
	"cargomail/cmd/mailbox/api/helper"
	"cargomail/internal/config"
	"cargomail/internal/repository"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"github.com/google/uuid"
)

type BlobsApi struct {
	blobs repository.BlobRepository
}

func (api *BlobsApi) Upload() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		err := r.ParseMultipartForm(32 << 20)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		uploadedBlobs := []*repository.Blob{}

		files := r.MultipartForm.File["blobs"]
		for i := range files {
			file, err := files[i].Open()
			if err != nil {
				fmt.Println(err)
				return
			}
			defer file.Close()

			blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

			if _, err := os.Stat(blobsPath); errors.Is(err, os.ErrNotExist) {
				err := os.MkdirAll(blobsPath, os.ModePerm)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
			}

			uuid := uuid.NewString()

			uploadedBlob := &repository.Blob{}

			// update should be by id
			if r.Method == "PUT" {
				if len(files[i].Filename) != 32 {
					helper.ReturnErr(w, repository.ErrBlobWrongName, http.StatusBadRequest)
					return
				}

				blob, err := api.blobs.GetBlobById(user, files[i].Filename)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusNotFound)
					return
				}

				if len(blob.Id) > 0 {
					f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
					if err != nil {
						fmt.Println(err)
						return
					}
					defer f.Close()

					blobDigestToRemove := blob.Digest

					key, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Key)
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					iv, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Iv)
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					aes, err := aes.NewCipher(key)
					if err != nil {
						fmt.Println(err)
						return
					}

					stream := cipher.NewCTR(aes, iv)

					pipeReader, pipeWriter := io.Pipe()
					writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

					// do the encryption in a goroutine
					go func() {
						_, err := io.Copy(writer, file)
						if err != nil {
							fmt.Println(err)
							return
						}
						defer writer.Close()
					}()

					hash := sha256.New()

					_, err = hash.Write(iv)
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					written, err := io.Copy(f, io.TeeReader(pipeReader, hash))
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					hashSum := hash.Sum(nil)
					digest := b64.RawURLEncoding.EncodeToString(hashSum)

					contentType := files[i].Header.Get("content-type")

					uploadedBlob = &repository.Blob{
						Id:          blob.Id,
						Digest:      digest,
						Size:        written,
						ContentType: contentType,
					}

					uploadedBlob, err = api.blobs.Update(user, uploadedBlob)
					if err != nil {
						switch {
						case errors.Is(err, repository.ErrBlobNotFound):
							helper.ReturnErr(w, err, http.StatusNotFound)
						default:
							helper.ReturnErr(w, err, http.StatusInternalServerError)
						}
						return
					}

					os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, digest))
					if err != nil {
						helper.ReturnErr(w, err, http.StatusInternalServerError)
						return
					}

					blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

					// delete the old blob
					_ = os.Remove(filepath.Join(blobsPath, blobDigestToRemove))
				}
			} else {
				f, err := os.OpenFile(filepath.Join(blobsPath, uuid), os.O_WRONLY|os.O_CREATE, 0666)
				if err != nil {
					fmt.Println(err)
					return
				}
				defer f.Close()

				key := make([]byte, KeySize)
				_, err = rand.Read(key)
				if err != nil {
					fmt.Println(err)
					return
				}

				iv := make([]byte, IvSize)
				_, err = rand.Read(iv)
				if err != nil {
					fmt.Println(err)
					return
				}

				aes, err := aes.NewCipher(key)
				if err != nil {
					fmt.Println(err)
					return
				}

				stream := cipher.NewCTR(aes, iv)

				pipeReader, pipeWriter := io.Pipe()
				writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

				// do the encryption in a goroutine
				go func() {
					_, err := io.Copy(writer, file)
					if err != nil {
						fmt.Println(err)
						return
					}
					defer writer.Close()
				}()

				hash := sha256.New()

				_, err = hash.Write(iv)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}

				written, err := io.Copy(f, io.TeeReader(pipeReader, hash))
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}

				hashSum := hash.Sum(nil)
				digest := b64.RawURLEncoding.EncodeToString(hashSum)

				blobMetadata := &repository.BlobMetadata{
					Key: b64.RawURLEncoding.EncodeToString(key),
					Iv:  b64.RawURLEncoding.EncodeToString(iv),
				}

				contentType := files[i].Header.Get("content-type")

				uploadedBlob = &repository.Blob{
					Digest:      digest,
					Name:        files[i].Filename,
					Size:        written,
					Metadata:    blobMetadata,
					ContentType: contentType,
				}

				uploadedBlob, err = api.blobs.Create(user, uploadedBlob)
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}

				os.Rename(filepath.Join(blobsPath, uuid), filepath.Join(blobsPath, digest))
				if err != nil {
					helper.ReturnErr(w, err, http.StatusInternalServerError)
					return
				}
			}

			if uploadedBlob != nil && (repository.Blob{}) != *uploadedBlob {
				uploadedBlobs = append(uploadedBlobs, uploadedBlob)
			}
		}

		if len(uploadedBlobs) > 0 {
			helper.SetJsonResponse(w, http.StatusCreated, uploadedBlobs)
		} else {
			helper.SetJsonResponse(w, http.StatusOK, uploadedBlobs)
		}
	})
}

func (api *BlobsApi) Download() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		digest := path.Base(r.URL.Path)

		blob, err := api.blobs.GetBlobByDigest(user, digest)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		if len(blob.Digest) == 0 {
			helper.ReturnErr(w, repository.ErrBlobNotFound, http.StatusNotFound)
			return
		}

		if r.Method == "HEAD" {
			w.WriteHeader(http.StatusOK)
		} else if r.Method == "GET" {
			blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

			blobPath := filepath.Join(blobsPath, digest)
			w.Header().Set("Content-Type", blob.ContentType)
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q; filename*=UTF-8''%s", digest, digest))

			blobPath = filepath.Clean(blobPath)

			out, err := os.Open(blobPath)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}
			defer out.Close()

			key, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Key)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			iv, err := b64.RawURLEncoding.DecodeString(blob.Metadata.Iv)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			hash := sha256.New()

			_, err = hash.Write(iv)
			if err != nil {
				helper.ReturnErr(w, err, http.StatusInternalServerError)
				return
			}

			if _, err := io.Copy(hash, out); err != nil {
				fmt.Println(err)
				return
			}

			hashSum := hash.Sum(nil)
			digest := b64.RawURLEncoding.EncodeToString(hashSum)

			if digest != blob.Digest {
				helper.ReturnErr(w, repository.ErrWrongResourceDigest, http.StatusInternalServerError)
				return
			}

			out.Seek(0, io.SeekStart)

			aes, err := aes.NewCipher(key)
			if err != nil {
				fmt.Println(err)
				return
			}

			stream := cipher.NewCTR(aes, iv)

			pipeReader, pipeWriter := io.Pipe()
			writer := &cipher.StreamWriter{S: stream, W: pipeWriter}

			// do the decryption in a goroutine
			go func() {
				// _, err := io.Copy(writer, io.TeeReader(out, hash))
				_, err := io.Copy(writer, out)
				if err != nil {
					fmt.Println(err)
					return
				}
				defer writer.Close()
			}()

			_, err = io.Copy(w, pipeReader)
			if err != nil {
				fmt.Println(err)
				return
			}
		}
	})
}

func (api *BlobsApi) List() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var folder repository.Folder

		err := helper.Decoder(r.Body).Decode(&folder)
		if err != nil {
			if err.Error() != "EOF" {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}

		blobList, err := api.blobs.List(user, folder.Folder)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, blobList)
	})
}

func (api *BlobsApi) Sync() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var history *repository.History

		err := helper.Decoder(r.Body).Decode(&history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		blobSync, err := api.blobs.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, blobSync)
	})
}

func (api *BlobsApi) Trash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		err = api.blobs.Trash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BlobsApi) Untrash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		err = api.blobs.Untrash(user, idsString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *BlobsApi) Delete() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var ids repository.Ids

		err := helper.Decoder(r.Body).Decode(&ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if ids.Ids == nil {
			http.Error(w, repository.ErrMissingIdsField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(ids)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		idsString := string(body)

		_, err = api.blobs.Delete(user, idsString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		//TODO remove if no reference

		// blobsPath := filepath.Join(config.Configuration.ResourcesPath, config.Configuration.BlobsFolder)

		// for _, blob := range *blobs {
		// 	_ = os.Remove(filepath.Join(blobsPath, blob.Digest))
		// }

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
