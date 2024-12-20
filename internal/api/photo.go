package api

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"net/http"
	"path/filepath"
	"sacred/internal/nanoid"
	"sacred/internal/terrors"
	"strings"
	"time"
)

type PresignedURLRequest struct {
	FileName string `json:"file_name" validate:"required"`
}

type PresignedURLResponse struct {
	URL      string `json:"url"`
	FileName string `json:"file_name"`
}

func extFromFileName(fileName string) (string, error) {
	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
		".avif": true,
	}
	ext := strings.ToLower(filepath.Ext(fileName))
	if !allowed[ext] {
		return "", fmt.Errorf("unsupported file extension: %s", ext)
	}
	return ext, nil
}

func (a *API) GetPresignedURL(c echo.Context) error {
	var req PresignedURLRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := c.Validate(req); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	uid := getUserID(c)

	if uid == "" {
		return terrors.Unauthorized(nil, "unauthorized")
	}

	fileExt, err := extFromFileName(req.FileName)

	if err != nil {
		return terrors.BadRequest(err, "invalid file extension")
	}

	fileName := fmt.Sprintf("%s/%s/%s", uid, time.Now().Format("2006-01-02"), nanoid.Must(8)+fileExt)

	url, err := a.s3Client.GetPresignedURL(fileName, 15*time.Minute)

	if err != nil {
		return terrors.InternalServer(err, "failed to get presigned url")
	}

	res := PresignedURLResponse{
		URL:      url,
		FileName: fileName,
	}

	return c.JSON(http.StatusOK, res)
}
