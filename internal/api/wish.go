package api

import (
	"bytes"
	"context"
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
	"mime/multipart"
	"net/http"
	"net/url"
	"path/filepath"
	"sacred/internal/contract"
	"sacred/internal/db"
	"strconv"
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
	decodedURL, err := url.QueryUnescape(imgURL)
	if err != nil {
		return 0, 0, "", echo.NewHTTPError(http.StatusBadRequest, "Invalid image URL").WithInternal(err)
	}

	parsedURL, err := url.ParseRequestURI(decodedURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		return 0, 0, "", echo.NewHTTPError(http.StatusBadRequest, "Invalid image URL")
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	req, err := http.NewRequest("GET", decodedURL, nil)
	if err != nil {
		return 0, 0, "", echo.NewHTTPError(http.StatusInternalServerError, "Error creating request").WithInternal(err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, "", echo.NewHTTPError(http.StatusInternalServerError, "Error downloading image").WithInternal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, "", echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("Invalid image URL or access denied, status: %d", resp.StatusCode))
	}

	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, "", echo.NewHTTPError(http.StatusInternalServerError, "Error reading image data").WithInternal(err)
	}

	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return 0, 0, "", echo.NewHTTPError(http.StatusInternalServerError, "Error decoding image").WithInternal(err)
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
		return 0, 0, "", echo.NewHTTPError(http.StatusInternalServerError, "Error uploading image to S3").WithInternal(err)
	}

	return width, height, s3Path, nil
}

func (a *API) uploadPhotoFromData(imageData []byte, wishID string, position int) (db.WishImage, error) {
	img, _, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return db.WishImage{}, echo.NewHTTPError(http.StatusBadRequest, "invalid image format").WithInternal(err)
	}

	width := img.Bounds().Dx()
	height := img.Bounds().Dy()

	fileExt := ".jpg"
	fileName := fmt.Sprintf("wishes/%s-%d%s", wishID, time.Now().UnixNano(), fileExt)

	s3Path, err := a.s3.UploadFile(imageData, fileName)
	if err != nil {
		return db.WishImage{}, echo.NewHTTPError(http.StatusInternalServerError, "Error uploading image to S3").WithInternal(err)
	}

	return db.WishImage{
		ID:        nanoid.Must(),
		WishID:    wishID,
		URL:       s3Path,
		Width:     width,
		Height:    height,
		Position:  position,
		CreatedAt: time.Now().UTC(),
	}, nil
}

func (a *API) uploadPhotosFromURLs(ctx context.Context, wishID string, imageURLs []string, startPosition int) ([]db.WishImage, error) {
	results := make([]db.WishImage, 0, len(imageURLs))
	now := time.Now().UTC()

	for i, imgURL := range imageURLs {
		width, height, path, err := a.handlePhotoUpload(imgURL)
		if err != nil {
			return nil, err
		}

		newImage := db.WishImage{
			ID:        nanoid.Must(),
			WishID:    wishID,
			URL:       path,
			Width:     width,
			Height:    height,
			Position:  startPosition + i,
			CreatedAt: now,
		}

		savedImage, err := a.storage.CreateWishImage(ctx, newImage)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusInternalServerError, "cannot save image to database").WithInternal(err)
		}

		results = append(results, savedImage)
	}

	return results, nil
}

func getFormString(form *multipart.Form, key string, trimSpace bool) *string {
	values := form.Value[key]
	if len(values) > 0 && values[0] != "" {
		val := values[0]
		if trimSpace {
			val = strings.TrimSpace(val)
		}
		if val != "" { // Check again after trim
			return &val
		}
	}
	return nil
}

func getFormFloat(form *multipart.Form, key string) (*float64, error) {
	values := form.Value[key]
	if len(values) > 0 && values[0] != "" {
		priceStr := strings.TrimSpace(values[0])
		if priceStr == "" { // Allow empty string to mean not provided
			return nil, nil
		}
		price, err := strconv.ParseFloat(priceStr, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid float value for '%s': %s", key, priceStr)
		}
		return &price, nil
	}
	return nil, nil
}

func getFormStringSlice(form *multipart.Form, key string) []string {
	var result []string
	values := form.Value[key]
	if len(values) > 0 {
		for _, val := range values {
			if strings.Contains(val, ",") {
				parts := strings.Split(val, ",")
				for _, p := range parts {
					trimmedP := strings.TrimSpace(p)
					if trimmedP != "" {
						result = append(result, trimmedP)
					}
				}
			} else {
				trimmedVal := strings.TrimSpace(val)
				if trimmedVal != "" {
					result = append(result, trimmedVal)
				}
			}
		}
	}
	return result
}

func (a *API) parseAndPopulateWish(form *multipart.Form, userID string) (wish db.Wish, categoryIDs []string, imageURLs []string, err error) {
	wish.ID = nanoid.Must()
	wish.UserID = userID

	wish.URL = getFormString(form, "url", true)
	wish.Name = getFormString(form, "name", true) // Trim name

	priceVal, parseErr := getFormFloat(form, "price")
	if parseErr != nil {
		err = echo.NewHTTPError(http.StatusBadRequest, parseErr.Error())
		return
	}
	wish.Price = priceVal

	wish.Currency = getFormString(form, "currency", true) // Trim currency
	wish.Notes = getFormString(form, "notes", true)       // Trim notes

	categoryIDs = getFormStringSlice(form, "category_ids")
	imageURLs = getFormStringSlice(form, "image_urls")

	return
}

func (a *API) validateWishCreation(wish *db.Wish, categoryIDs []string) error {
	// Name validation
	if wish.Name == nil || *wish.Name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required and cannot be empty")
	}
	if len(*wish.Name) > 200 {
		return echo.NewHTTPError(http.StatusBadRequest, "name cannot be longer than 200 characters")
	}

	// URL validation
	if wish.URL != nil && *wish.URL != "" {
		parsedURL, err := url.ParseRequestURI(*wish.URL) // More strict parsing for user inputs
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid URL format").WithInternal(err)
		}
		if parsedURL.Scheme == "" || parsedURL.Host == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "URL must include a scheme (e.g., http, https) and a host")
		}
	}

	// Price and Currency validation
	if wish.Price != nil {
		if *wish.Price < 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "price cannot be negative")
		}
		if wish.Currency == nil || *wish.Currency == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "currency is required when price is provided")
		}
		if len(*wish.Currency) != 3 { // Assuming 3-letter ISO code
			return echo.NewHTTPError(http.StatusBadRequest, "currency must be a 3-letter ISO code")
		}
	} else {
		// If price is not provided, currency should also not be provided or will be ignored.
		// The main handler will nil out wish.Currency if wish.Price is nil.
	}

	// Notes validation
	if wish.Notes != nil && len(*wish.Notes) > 1000 {
		return echo.NewHTTPError(http.StatusBadRequest, "notes cannot be longer than 1000 characters")
	}

	// Category IDs validation
	if len(categoryIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "category_ids cannot be empty")
	}
	// Add more specific category_ids validation if needed (e.g., format, existence)

	return nil
}

func (a *API) handlePhotoUploads(c echo.Context, form *multipart.Form, wishID string) error {
	files := form.File["photos"]
	const maxFileSize = 10 << 20 // 10MB limit per file (example)

	for i, fileHeader := range files {
		if fileHeader.Size > maxFileSize {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("file '%s' exceeds maximum size of %dMB", fileHeader.Filename, maxFileSize>>20))
		}

		src, err := fileHeader.Open()
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("failed to open uploaded file: %s", fileHeader.Filename)).WithInternal(err)
		}
		defer src.Close()

		buffer := new(bytes.Buffer)
		if _, err := io.Copy(buffer, src); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("error reading uploaded file: %s", fileHeader.Filename)).WithInternal(err)
		}
		fileData := buffer.Bytes()

		newImage, err := a.uploadPhotoFromData(fileData, wishID, i)
		if err != nil {
			return err
		}

		if _, err := a.storage.CreateWishImage(c.Request().Context(), newImage); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("cannot save image to database for file: %s", fileHeader.Filename)).WithInternal(err)
		}
	}
	return nil
}

func (a *API) CreateWishHandler(c echo.Context) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	form, err := c.MultipartForm() // Default is 32MB, use c.MultipartForm(maxMemoryBytes) if needed
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to parse multipart form").WithInternal(err)
	}

	wish, categoryIDs, imageURLs, err := a.parseAndPopulateWish(form, userID)
	if err != nil {
		return err
	}

	if err := a.validateWishCreation(&wish, categoryIDs); err != nil {
		return err
	}

	if wish.Price == nil {
		wish.Currency = nil
	}

	if len(form.File["photos"]) == 0 && len(imageURLs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "at least photos or image_urls must be provided")
	}

	now := time.Now().UTC()
	wish.PublishedAt = &now
	wish.CreatedAt = now
	wish.UpdatedAt = now

	if err := a.storage.CreateWish(c.Request().Context(), wish, categoryIDs); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot create wishlist item in database").WithInternal(err)
	}

	if err := a.handlePhotoUploads(c, form, wish.ID); err != nil {
		return err
	}

	filesUploadedCount := 0
	if photos, ok := form.File["photos"]; ok {
		filesUploadedCount = len(photos)
	}

	if len(imageURLs) > 0 {
		// startPosition ensures that if photos are uploaded via file and URL, their order/index is distinct.
		_, err := a.uploadPhotosFromURLs(c.Request().Context(), wish.ID, imageURLs, filesUploadedCount)
		if err != nil {
			return err
		}
	}

	finalWish, err := a.storage.GetWishByID(c.Request().Context(), userID, wish.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to retrieve created wishlist item").WithInternal(err)
	}

	return c.JSON(http.StatusCreated, finalWish)
}

func (a *API) UpdateWishHandler(c echo.Context) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}

	wishID := c.Param("id")
	if wishID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "wish ID is required")
	}

	existingWish, err := a.storage.GetWishByID(c.Request().Context(), userID, wishID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return echo.NewHTTPError(http.StatusNotFound, "wishlist item not found").WithInternal(err)
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist item").WithInternal(err)
	}

	form, err := c.MultipartForm()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to parse multipart form").WithInternal(err)
	}

	wish, categoryIDs, _, err := a.parseAndPopulateWish(form, userID)
	if err != nil {
		return err
	}

	if err := a.validateWishCreation(&wish, categoryIDs); err != nil {
		return err
	}

	if wish.Price == nil {
		wish.Currency = nil
	}

	// keep immutable fields from existing wish
	wish.ID = existingWish.ID
	wish.UserID = existingWish.UserID
	wish.PublishedAt = existingWish.PublishedAt
	// Update timestamps
	wish.UpdatedAt = time.Now().UTC()

	if err := a.storage.UpdateWish(c.Request().Context(), wish, categoryIDs); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot update wishlist item in database").WithInternal(err)
	}

	if err := a.handlePhotoUploads(c, form, wish.ID); err != nil {
		return err
	}

	deleteImageIDs := getFormStringSlice(form, "delete_image_ids")
	if len(deleteImageIDs) > 0 {
		// TODO: It should also trigger deletion of actual image files from S3/storage.
		if err := a.storage.DeleteWishImages(c.Request().Context(), wishID, deleteImageIDs); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete images").WithInternal(err)
		}
	}

	updatedWish, err := a.storage.GetWishByID(c.Request().Context(), userID, wishID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to retrieve updated wishlist item").WithInternal(err)
	}

	return c.JSON(http.StatusOK, updatedWish)
}

func (a *API) GetWishHandler(c echo.Context) error {
	itemID := c.Param("id")
	uid, _ := getUserID(c) // auth not required for this endpoint

	item, err := a.storage.GetWishByID(c.Request().Context(), uid, itemID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return echo.NewHTTPError(http.StatusNotFound, "wishlist item not found").WithInternal(err)
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist item").WithInternal(err)
	}

	savers, count, err := a.storage.GetUsersWhoSavedWish(c.Request().Context(), item.ID, 2, 0)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wish savers").WithInternal(err)
	}

	saverProfiles := make([]contract.ShortUserProfile, 0, len(savers))
	for _, saver := range savers {
		profile := contract.ToShortUserProfile(saver)
		saverProfiles = append(saverProfiles, profile)
	}

	saverInfo := contract.WishSaversResponse{
		Users: saverProfiles,
		Total: count,
	}

	res := contract.WishResponse{
		Wish:       item,
		SaversInfo: saverInfo,
	}

	return c.JSON(http.StatusOK, res)
}

func (a *API) ListUserWishes(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	res, err := a.storage.GetWishesByUserID(c.Request().Context(), uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist item").WithInternal(err)
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
		return echo.NewHTTPError(http.StatusNotFound, "source wish not found").WithInternal(err)
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot fetch source wish").WithInternal(err)
	}

	if sourceWish.CopyID != nil && *sourceWish.CopyID != "" {
		return echo.NewHTTPError(http.StatusConflict, "Wish was already copied")
	}

	var categoryIDs []string
	for _, cat := range sourceWish.Categories {
		categoryIDs = append(categoryIDs, cat.ID)
	}

	now := time.Now().UTC()

	newWish := db.Wish{
		ID:          nanoid.Must(),
		UserID:      targetUserID,
		Name:        sourceWish.Name,
		URL:         sourceWish.URL,
		Price:       sourceWish.Price,
		Currency:    sourceWish.Currency,
		Notes:       sourceWish.Notes,
		SourceID:    &sourceWish.ID,
		PublishedAt: &now,
		CreatedAt:   now,
		UpdatedAt:   now,
		IsFulfilled: false,
	}

	err = a.storage.CreateWish(c.Request().Context(), newWish, categoryIDs)
	if err != nil && errors.Is(err, db.ErrAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "Wish was already copied").WithInternal(err)
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Cannot create copied wish").WithInternal(err)
	}

	for _, img := range sourceWish.Images {
		newImage := db.WishImage{
			ID:        nanoid.Must(),
			WishID:    newWish.ID,
			URL:       img.URL,
			Width:     img.Width,
			Height:    img.Height,
			Position:  img.Position,
			CreatedAt: now,
		}

		if _, err := a.storage.CreateWishImage(c.Request().Context(), newImage); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "cannot copy images").WithInternal(err)
		}
	}

	copiedWish, err := a.storage.GetWishByID(c.Request().Context(), targetUserID, newWish.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot fetch copied wish").WithInternal(err)
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
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist item").WithInternal(err)
	}

	if wish.UserID != uid {
		return echo.NewHTTPError(http.StatusForbidden, "cannot delete other user's wish")
	}

	err = a.storage.DeleteWish(c.Request().Context(), uid, itemID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot delete wishlist item").WithInternal(err)
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) GetWishSaversHandler(c echo.Context) error {
	wishID := c.Param("id")
	if wishID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Wish ID is required")
	}

	pageStr := c.QueryParam("page")
	limitStr := c.QueryParam("limit")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20 // Default limit
	}
	// Cap limit to a max of 100
	if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit

	users, total, err := a.storage.GetUsersWhoSavedWish(c.Request().Context(), wishID, limit, offset)
	if err != nil {
		log.Printf("Error fetching wish savers for wishID %s: %v", wishID, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve users who saved the wish").WithInternal(err)
	}

	userProfiles := make([]contract.ShortUserProfile, 0, len(users))
	for _, user := range users {
		profile := contract.ToShortUserProfile(user)
		userProfiles = append(userProfiles, profile)
	}

	response := contract.WishSaversResponse{
		Users: userProfiles,
		Total: total,
	}

	return c.JSON(http.StatusOK, response)
}

func (a *API) SearchFeed(c echo.Context) error {
	searchQuery := c.QueryParam("search")
	if searchQuery == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "search query cannot be empty")
	}

	suggestions, err := a.storage.GetWishAutocomplete(c.Request().Context(), searchQuery, 10)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot fetch autocomplete suggestions").WithInternal(err)
	}

	return c.JSON(http.StatusOK, suggestions)
}

func (a *API) GetWishesFeed(c echo.Context) error {
	uid, _ := getUserID(c)

	searchQuery := c.QueryParam("search")

	wishes, err := a.storage.GetPublicWishesFeed(c.Request().Context(), uid, searchQuery)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot fetch wishes feed").WithInternal(err)
	}

	resp := make([]contract.FeedItem, 0, len(wishes))
	for _, wish := range wishes {
		item := contract.ToFeedItem(wish)
		resp = append(resp, item)
	}

	return c.JSON(http.StatusOK, resp)
}
