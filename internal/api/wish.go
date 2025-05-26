package api

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
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

	return width, height, s3Path, nil
}

func (a *API) CreateWishHandler(c echo.Context) error {
	userID := getUserID(c)

	item := db.Wish{
		ID:     nanoid.Must(),
		UserID: userID,
	}

	err := a.storage.CreateWish(c.Request().Context(), item, []string{})
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	res, err := a.storage.GetWishByID(c.Request().Context(), userID, item.ID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusCreated, contract.CreateWishResponse{ID: res.ID, UserID: res.UserID})
}

func (a *API) UpdateWishHandler(c echo.Context) error {
	var req contract.UpdateWishRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	// trim whitespace from URL
	if req.URL != nil {
		*req.URL = strings.TrimSpace(*req.URL)
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, fmt.Sprintf("failed to validate request: %v", err))
	}

	userID := getUserID(c)
	wishID := c.Param("id")
	if wishID == "" {
		return terrors.BadRequest(nil, "wish id cannot be empty")
	}

	item := db.Wish{
		ID:       wishID,
		UserID:   userID,
		URL:      req.URL,
		Name:     req.Name,
		Price:    req.Price,
		Currency: req.Currency,
		Notes:    req.Notes,
	}

	if item.Price == nil {
		item.Currency = nil
	}

	res, err := a.storage.UpdateWish(c.Request().Context(), item, req.CategoryIDs)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	res, err = a.storage.GetWishByID(c.Request().Context(), userID, item.ID)
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
		SourceID:    &sourceWish.ID,
		PublishedAt: sourceWish.PublishedAt,
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
			ID:       nanoid.Must(),
			WishID:   newWish.ID,
			URL:      img.URL,
			Width:    img.Width,
			Height:   img.Height,
			Position: img.Position,
		}

		if _, err := a.storage.CreateWishImage(c.Request().Context(), newImage); err != nil {
			return terrors.InternalServer(err, "cannot copy images")
		}
	}

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

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) GetWishesFeed(c echo.Context) error {
	uid := getUserID(c)

	searchQuery := c.QueryParam("search")

	wishes, err := a.storage.GetPublicWishesFeed(c.Request().Context(), uid, searchQuery)
	if err != nil {
		return terrors.InternalServer(err, "cannot fetch wishes feed")
	}

	return c.JSON(http.StatusOK, wishes)
}

func (a *API) UploadWishPhoto(c echo.Context) error {
	wishID := c.Param("id")
	if wishID == "" {
		return terrors.BadRequest(nil, "wish ID is required")
	}

	userID := getUserID(c)

	wish, err := a.storage.GetWishByID(c.Request().Context(), userID, wishID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wish not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot get wish")
	}

	if wish.UserID != userID {
		return terrors.Forbidden(nil, "cannot upload photos to another user's wish")
	}

	file, fileHeader, err := c.Request().FormFile("photo")
	if err == nil {

		defer file.Close()

		buffer := new(bytes.Buffer)
		if _, err := io.Copy(buffer, file); err != nil {
			return terrors.InternalServer(err, "error reading uploaded file")
		}
		fileData := buffer.Bytes()

		img, _, err := image.Decode(bytes.NewReader(fileData))
		if err != nil {
			return terrors.BadRequest(err, "invalid image format")
		}

		width := img.Bounds().Dx()
		height := img.Bounds().Dy()

		fileExt := filepath.Ext(fileHeader.Filename)
		if fileExt == "" {
			fileExt = ".jpg"
		}
		fileName := fmt.Sprintf("wishes/%s-%d%s", wishID, time.Now().Unix(), fileExt)

		s3Path, err := a.s3.UploadFile(fileData, fileName)
		if err != nil {
			return terrors.InternalServer(err, "error uploading image to S3")
		}

		imageID := nanoid.Must()
		newImage := db.WishImage{
			ID:       imageID,
			WishID:   wishID,
			URL:      s3Path,
			Width:    width,
			Height:   height,
			Position: len(wish.Images),
		}

		savedImage, err := a.storage.CreateWishImage(c.Request().Context(), newImage)
		if err != nil {
			return terrors.InternalServer(err, "cannot save image to database")
		}

		return c.JSON(http.StatusCreated, savedImage)
	}

	var req struct {
		ImageURLs []string `json:"image_urls"`
	}

	if err := c.Bind(&req); err != nil || len(req.ImageURLs) == 0 {
		return terrors.BadRequest(err, "invalid request format or no image URLs provided")
	}

	results := make([]db.WishImage, 0, len(req.ImageURLs))
	basePosition := len(wish.Images)

	for i, imgURL := range req.ImageURLs {
		width, height, path, err := a.handlePhotoUpload(imgURL)
		if err != nil {
			return err
		}

		imageID := nanoid.Must()
		newImage := db.WishImage{
			ID:       imageID,
			WishID:   wishID,
			URL:      path,
			Width:    width,
			Height:   height,
			Position: basePosition + i,
		}

		savedImage, err := a.storage.CreateWishImage(c.Request().Context(), newImage)
		if err != nil {
			return terrors.InternalServer(err, "cannot save image to database")
		}

		results = append(results, savedImage)
	}

	return c.JSON(http.StatusCreated, results)
}

func (a *API) DeleteWishPhoto(c echo.Context) error {
	wishID := c.Param("id")
	photoID := c.Param("photoId")

	if wishID == "" {
		return terrors.BadRequest(nil, "wish ID is required")
	}

	if photoID == "" {
		return terrors.BadRequest(nil, "photo ID is required")
	}

	userID := getUserID(c)

	wish, err := a.storage.GetWishByID(c.Request().Context(), userID, wishID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wish not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot get wish")
	}

	if wish.UserID != userID {
		return terrors.Forbidden(nil, "cannot delete photos from another user's wish")
	}

	photoExists := false
	for _, img := range wish.Images {
		if img.ID == photoID {
			photoExists = true
			break
		}
	}

	if !photoExists {
		return terrors.NotFound(nil, "photo not found for this wish")
	}

	err = a.storage.DeleteWishPhoto(c.Request().Context(), wishID, photoID)
	if err != nil {
		return terrors.InternalServer(err, "failed to delete photo")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}
