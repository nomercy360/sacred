package api

import (
	"bytes"
	"fmt"
	"github.com/labstack/echo/v4"
	_ "golang.org/x/image/webp"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/nanoid"
	"sacred/internal/terrors"
	"strings"
	"time"
)

func (a *API) handlePhotoUpload(imgURL string) (int, int, string, error) {
	parsedURL, err := url.ParseRequestURI(imgURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		return 0, 0, "", terrors.BadRequest(nil, "Invalid image URL")
	}

	resp, err := http.Get(imgURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		return 0, 0, "", terrors.BadRequest(nil, "Invalid image URL")
	}

	defer resp.Body.Close()
	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error reading image")
	}

	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error decoding image")
	}

	width := img.Bounds().Dx()
	height := img.Bounds().Dy()

	fileExt := filepath.Ext(imgURL)
	if fileExt == "" {
		fileExt = ".jpg"
	}
	fileName := fmt.Sprintf("wishes/%d%s", time.Now().Unix(), fileExt)

	s3Path, err := a.s3.UploadFile(imageData, fileName)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error uploading image to S3")
	}

	imgURL = fmt.Sprintf("%s/%s", a.cfg.AssetsURL, s3Path)

	return width, height, imgURL, nil
}

func (a *API) AddWishHandler(c echo.Context) error {
	var req contract.CreateWishRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, fmt.Sprintf("failed to validate request: %v", err))
	}

	userID := getUserID(c)

	item := db.Wish{
		ID:       nanoid.Must(),
		UserID:   userID,
		URL:      req.URL,
		Name:     req.Name,
		Price:    req.Price,
		Currency: req.Currency,
		Notes:    req.Notes,
		IsPublic: req.IsPublic,
	}

	err := a.storage.CreateWish(c.Request().Context(), item, req.CategoryIDs)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	for idx, img := range req.Images {
		var width, height, size int
		var imgURL string
		// if image already uploaded to S3 no need to upload it again, check starts with a.cfg.AssetsURL
		if !strings.HasPrefix(img.URL, a.cfg.AssetsURL) {
			width, height, imgURL, err = a.handlePhotoUpload(img.URL)
			if err != nil {
				return err
			}
		} else {
			imgURL = img.URL
			width = img.Width
			height = img.Height
			size = img.Size
		}

		wishImg := db.WishImage{
			ID:        nanoid.Must(),
			URL:       imgURL,
			Width:     width,
			Height:    height,
			SizeBytes: size,
			WishID:    item.ID,
			Position:  idx + 1,
		}

		// Save the image to the database
		if _, err := a.storage.CreateWishImage(c.Request().Context(), wishImg); err != nil {
			return terrors.InternalServer(err, "Error saving image to database")
		}
	}

	res, err := a.storage.GetWishByID(c.Request().Context(), item.ID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusCreated, res)
}

func (a *API) GetWishHandler(c echo.Context) error {
	itemID := c.Param("id")

	item, err := a.storage.GetWishByID(c.Request().Context(), itemID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusOK, item)
}

func (a *API) ListUserWishes(c echo.Context) error {
	uid := getUserID(c)

	res, err := a.storage.GetWishesByUserID(c.Request().Context(), uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusOK, res)
}
