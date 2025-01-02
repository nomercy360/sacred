package api

import (
	"bytes"
	"errors"
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

	fileExt := filepath.Ext(parsedURL.Path)
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

	res, err := a.storage.GetWishByID(c.Request().Context(), userID, item.ID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusCreated, res)
}

func (a *API) GetWishHandler(c echo.Context) error {
	itemID := c.Param("id")
	uid := getUserID(c)

	item, err := a.storage.GetWishByID(c.Request().Context(), uid, itemID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wishlist item not found")
	} else if err != nil {
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

func (a *API) CopyWishHandler(c echo.Context) error {
	sourceWishID := c.Param("id")
	targetUserID := getUserID(c)

	sourceWish, err := a.storage.GetWishByID(c.Request().Context(), targetUserID, sourceWishID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "source wish not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot fetch source wish")
	}

	// user can not copy their own wish
	if sourceWish.UserID == targetUserID {
		return terrors.BadRequest(nil, "cannot copy own wish")
	}

	if sourceWish.CopiedWishID != nil {
		return terrors.BadRequest(nil, "cannot copy copied wish")
	}

	var categoryIDs []string
	for _, cat := range sourceWish.Categories {
		categoryIDs = append(categoryIDs, cat.ID)
	}

	newWish := db.Wish{
		ID:          nanoid.Must(),
		UserID:      targetUserID,
		Name:        sourceWish.Name,
		URL:         sourceWish.URL,
		Price:       sourceWish.Price,
		Currency:    sourceWish.Currency,
		Notes:       sourceWish.Notes,
		IsPublic:    sourceWish.IsPublic,
		SourceID:    &sourceWish.ID,
		SourceType:  &db.WishSourceCopy,
		IsFulfilled: false,
	}

	err = a.storage.CreateWish(c.Request().Context(), newWish, categoryIDs)
	if err != nil && errors.Is(err, db.ErrAlreadyExists) {
		return terrors.Conflict(err, "Wish was already copied")
	} else if err != nil {
		return terrors.InternalServer(err, "Cannot create copied wish")
	}

	for _, img := range sourceWish.Images {
		newImage := db.WishImage{
			ID:        nanoid.Must(),
			WishID:    newWish.ID,
			URL:       img.URL,
			Width:     img.Width,
			Height:    img.Height,
			SizeBytes: img.SizeBytes,
			Position:  img.Position,
		}

		if _, err := a.storage.CreateWishImage(c.Request().Context(), newImage); err != nil {
			return terrors.InternalServer(err, "cannot copy images")
		}
	}

	// Fetch the newly created wish to return
	copiedWish, err := a.storage.GetWishByID(c.Request().Context(), targetUserID, newWish.ID)
	if err != nil {
		return terrors.InternalServer(err, "cannot fetch copied wish")
	}

	return c.JSON(http.StatusCreated, copiedWish)
}

func (a *API) DeleteWishHandler(c echo.Context) error {
	itemID := c.Param("id")
	uid := getUserID(c)

	wish, err := a.storage.GetWishByID(c.Request().Context(), uid, itemID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	if wish.UserID != uid {
		return terrors.Forbidden(nil, "cannot delete other user's wish")
	}

	err = a.storage.DeleteWish(c.Request().Context(), uid, itemID)
	if err != nil {
		return terrors.InternalServer(err, "cannot delete wishlist item")
	}

	return c.NoContent(http.StatusNoContent)
}
