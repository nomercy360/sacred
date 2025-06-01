package api

import (
	"bytes"
	"context"
	"encoding/json"
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
	"log"
	"net/http"
	"net/url"
	"path/filepath"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/terrors"
	"strings"
	"time"
)

type ExtractContentResponse struct {
	ExtractedWith string                 `json:"extracted_with"`
	ImageURLs     []string               `json:"image_urls"`
	Metadata      map[string]interface{} `json:"metadata"`
	Price         *float64               `json:"price,omitempty"`
	Currency      *string                `json:"currency,omitempty"`
	ProductName   *string                `json:"product_name,omitempty"`
}

func (a *API) handlePhotoUpload(imgURL string) (int, int, string, error) {
	parsedURL, err := url.ParseRequestURI(imgURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		return 0, 0, "", terrors.BadRequest(nil, "Invalid image URL")
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	req, err := http.NewRequest("GET", imgURL, nil)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error creating request")
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error fetching image")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to download image. Status: %s, Body: %s", resp.Status, string(bodyBytes))
		return 0, 0, "", terrors.BadRequest(nil, fmt.Sprintf("Invalid image URL or access denied, status: %d", resp.StatusCode))
	}

	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error reading image data")
	}

	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error decoding image")
	}
	log.Printf("Decoded image format: %s", format)

	width := img.Bounds().Dx()
	height := img.Bounds().Dy()

	fileExt := filepath.Ext(parsedURL.Path)
	if fileExt == "" {
		// Attempt to get a more accurate extension from the detected image format
		switch format {
		case "jpeg":
			fileExt = ".jpg"
		case "png":
			fileExt = ".png"
		case "gif":
			fileExt = ".gif"
		case "webp":
			fileExt = ".webp"
		case "avif":
			fileExt = ".avif"
		default:
			fileExt = ".jpg" // Fallback
		}
	}

	fileName := fmt.Sprintf("wishes/%d%s", time.Now().UnixNano(), fileExt)

	s3Path, err := a.s3.UploadFile(imageData, fileName)
	if err != nil {
		return 0, 0, "", terrors.InternalServer(err, "Error uploading image to S3")
	}

	return width, height, s3Path, nil
}

func (a *API) uploadPhotoFromData(imageData []byte, wishID string, position int) (db.WishImage, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return db.WishImage{}, terrors.BadRequest(err, "invalid image format")
	}

	width := img.Bounds().Dx()
	height := img.Bounds().Dy()

	fileExt := ".jpg"
	fileName := fmt.Sprintf("wishes/%s-%d%s", wishID, time.Now().UnixNano(), fileExt)

	s3Path, err := a.s3.UploadFile(imageData, fileName)
	if err != nil {
		return db.WishImage{}, terrors.InternalServer(err, "error uploading image to S3")
	}

	return db.WishImage{
		ID:       nanoid.Must(),
		WishID:   wishID,
		URL:      s3Path,
		Width:    width,
		Height:   height,
		Position: position,
	}, nil
}

func (a *API) uploadPhotosFromURLs(ctx context.Context, wishID string, imageURLs []string, startPosition int) ([]db.WishImage, error) {
	results := make([]db.WishImage, 0, len(imageURLs))

	for i, imgURL := range imageURLs {
		width, height, path, err := a.handlePhotoUpload(imgURL)
		if err != nil {
			return nil, err
		}

		newImage := db.WishImage{
			ID:       nanoid.Must(),
			WishID:   wishID,
			URL:      path,
			Width:    width,
			Height:   height,
			Position: startPosition + i,
		}

		savedImage, err := a.storage.CreateWishImage(ctx, newImage)
		if err != nil {
			return nil, terrors.InternalServer(err, "cannot save image to database")
		}

		results = append(results, savedImage)
	}

	return results, nil
}

func (a *API) CreateWishFromURLHandler(c echo.Context) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	var req contract.CreateWishRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	req.URL = strings.TrimSpace(req.URL)

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	// Call external service to extract content
	extractReq := map[string]string{"url": req.URL}
	reqBody, err := json.Marshal(extractReq)
	if err != nil {
		return terrors.InternalServer(err, "failed to marshal request")
	}

	parseResp, err := http.Post(a.cfg.ParserURL, "application/json", bytes.NewReader(reqBody))
	if err != nil {
		return terrors.InternalServer(err, "failed to extract content from URL")
	}
	defer parseResp.Body.Close()

	if parseResp.StatusCode != http.StatusOK {
		return terrors.InternalServer(nil, "failed to extract content from URL")
	}

	var extractResp ExtractContentResponse
	if err := json.NewDecoder(parseResp.Body).Decode(&extractResp); err != nil {
		return terrors.InternalServer(err, "failed to decode extract response")
	}

	wish := db.Wish{
		ID:     nanoid.Must(),
		UserID: userID,
		URL:    &req.URL,
	}

	var ogImage string
	if extractResp.Metadata != nil {
		if desc, ok := extractResp.Metadata["description"].(string); ok {
			if desc != "" {
				wish.Notes = &desc
			}
		}

		if extractResp.Metadata["og:image"] != nil {
			ogImage, _ = extractResp.Metadata["og:image"].(string)
		}
	}

	if len(extractResp.ImageURLs) == 0 && ogImage != "" {
		extractResp.ImageURLs = []string{ogImage}
	} else if len(extractResp.ImageURLs) == 0 {
		return terrors.BadRequest(nil, "no images found in the URL")
	}

	if extractResp.ProductName != nil {
		wish.Name = extractResp.ProductName
	}

	if extractResp.Price != nil {
		wish.Price = extractResp.Price
		if extractResp.Currency != nil {
			wish.Currency = extractResp.Currency
		}
	}

	// Create the wish in database
	err = a.storage.CreateWish(c.Request().Context(), wish, nil)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	resp := contract.CreateWishResponse{
		ID:        wish.ID,
		UserID:    userID,
		Name:      wish.Name,
		Notes:     wish.Notes,
		Currency:  wish.Currency,
		Price:     wish.Price,
		ImageURLs: extractResp.ImageURLs,
		URL:       wish.URL,
	}

	return c.JSON(http.StatusCreated, resp)
}

func (a *API) CreateWishHandler(c echo.Context) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	wish := db.Wish{
		ID:     nanoid.Must(),
		UserID: userID,
	}

	form, err := c.MultipartForm()
	if err != nil {
		return terrors.BadRequest(err, "failed to parse multipart form")
	}

	if form == nil || form.Value == nil {
		return terrors.BadRequest(nil, "no form data provided")
	}

	err = a.storage.CreateWish(c.Request().Context(), wish, nil)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	files := form.File["photos"]
	for i, file := range files {
		src, err := file.Open()
		if err != nil {
			return terrors.BadRequest(err, "failed to open uploaded file")
		}
		defer src.Close()

		buffer := new(bytes.Buffer)
		if _, err := io.Copy(buffer, src); err != nil {
			return terrors.InternalServer(err, "error reading uploaded file")
		}

		fileData := buffer.Bytes()

		newImage, err := a.uploadPhotoFromData(fileData, wish.ID, i)
		if err != nil {
			return err
		}

		if _, err := a.storage.CreateWishImage(c.Request().Context(), newImage); err != nil {
			return terrors.InternalServer(err, "cannot save image to database")
		}
	}

	res, err := a.storage.GetWishByID(c.Request().Context(), userID, wish.ID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusCreated, res)
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

	userID, err := getUserID(c)
	if err != nil {
		return err
	}
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
	uid, _ := getUserID(c) // auth not required for this endpoint

	item, err := a.storage.GetWishByID(c.Request().Context(), uid, itemID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wishlist item not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusOK, item)
}

func (a *API) ListUserWishes(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	res, err := a.storage.GetWishesByUserID(c.Request().Context(), uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist item")
	}

	return c.JSON(http.StatusOK, res)
}

func (a *API) CopyWishHandler(c echo.Context) error {
	sourceWishID := c.Param("id")
	targetUserID, err := getUserID(c)
	if err != nil {
		return err
	}

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
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

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

func (a *API) SearchFeed(c echo.Context) error {
	searchQuery := c.QueryParam("search")
	if searchQuery == "" {
		return terrors.BadRequest(nil, "search query cannot be empty")
	}

	suggestions, err := a.storage.GetWishAutocomplete(c.Request().Context(), searchQuery, 10)
	if err != nil {
		return terrors.InternalServer(err, "cannot fetch autocomplete suggestions")
	}

	return c.JSON(http.StatusOK, suggestions)
}

func (a *API) GetWishesFeed(c echo.Context) error {
	uid, _ := getUserID(c)

	searchQuery := c.QueryParam("search")

	wishes, err := a.storage.GetPublicWishesFeed(c.Request().Context(), uid, searchQuery)
	if err != nil {
		return terrors.InternalServer(err, "cannot fetch wishes feed")
	}

	resp := make([]contract.FeedItem, 0, len(wishes))
	for _, wish := range wishes {
		item := contract.ToFeedItem(wish)
		resp = append(resp, item)
	}

	return c.JSON(http.StatusOK, resp)
}

func (a *API) UploadWishPhoto(c echo.Context) error {
	wishID := c.Param("id")
	if wishID == "" {
		return terrors.BadRequest(nil, "wish ID is required")
	}

	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	wish, err := a.storage.GetWishByID(c.Request().Context(), userID, wishID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wish not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot get wish")
	}

	if wish.UserID != userID {
		return terrors.Forbidden(nil, "cannot upload photos to another user's wish")
	}

	file, _, err := c.Request().FormFile("photo")
	if err == nil {
		defer file.Close()

		buffer := new(bytes.Buffer)
		if _, err := io.Copy(buffer, file); err != nil {
			return terrors.InternalServer(err, "error reading uploaded file")
		}
		fileData := buffer.Bytes()

		newImage, err := a.uploadPhotoFromData(fileData, wishID, len(wish.Images))
		if err != nil {
			return err
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

	// Use the reusable function
	results, err := a.uploadPhotosFromURLs(c.Request().Context(), wishID, req.ImageURLs, len(wish.Images))
	if err != nil {
		return err
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

	userID, err := getUserID(c)
	if err != nil {
		return err
	}

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
