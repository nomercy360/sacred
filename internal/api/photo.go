package api

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"net/http"
	"path/filepath"
	"sacred/internal/terrors"
	"time"
)

type PresignedURLRequest struct {
	FileName string `json:"file_name" validate:"required"`
}

type PresignedURLResponse struct {
	URL      string `json:"url"`
	FileName string `json:"file_name"`
	AssetURL string `json:"asset_url"`
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

	fileExt := filepath.Ext(req.FileName)
	if fileExt == "" {
		fileExt = ".jpg" // Default extension
	}

	fileName := fmt.Sprintf("wishes/%d%s", time.Now().Unix(), fileExt)

	url, err := a.s3.GetPresignedURL(fileName, 15*time.Minute)

	if err != nil {
		return terrors.InternalServer(err, "failed to get presigned url")
	}

	res := PresignedURLResponse{
		URL:      url,
		FileName: fileName,
		AssetURL: fmt.Sprintf("%s/%s", a.cfg.AssetsURL, fileName),
	}

	return c.JSON(http.StatusOK, res)
}
