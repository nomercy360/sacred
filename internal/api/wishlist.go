package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/nanoid"
	"sacred/internal/terrors"
)

func (a *API) AddWishHandler(c echo.Context) error {
	var req contract.CreateWishRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	userID := getUserID(c)

	item := db.Wish{
		ID:       nanoid.Must(),
		UserID:   userID,
		URL:      req.URL,
		Name:     req.Name,
		Price:    req.Price,
		ImageURL: req.ImageURL,
		Notes:    req.Notes,
		IsPublic: req.IsPublic,
	}

	res, err := a.storage.CreateWish(c.Request().Context(), item)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
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
