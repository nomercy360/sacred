package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/nanoid"
	"sacred/internal/terrors"
)

func (a *API) AddWishlistItemHandler(c echo.Context) error {
	var req contract.CreateWishItemRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	userID := getUserID(c)

	wishlist, err := a.storage.GetWishlistByID(c.Request().Context(), req.WishlistID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist")
	}

	if wishlist.UserID != userID {
		return terrors.Forbidden(nil, "forbidden")
	}

	item := db.WishlistItem{
		ID:         nanoid.Must(),
		WishlistID: wishlist.ID,
		URL:        req.URL,
		Name:       req.Name,
		Price:      req.Price,
		ImageURL:   req.ImageURL,
		Notes:      req.Notes,
		IsPublic:   req.IsPublic,
	}

	res, err := a.storage.CreateWishlistItem(c.Request().Context(), item)
	if err != nil {
		return terrors.InternalServer(err, "cannot create wishlist item")
	}

	return c.JSON(http.StatusCreated, res)
}

func (a *API) GetUserWishlistHandler(c echo.Context) error {
	userID := getUserID(c)

	wishlist, err := a.storage.GetWishlistByUserID(c.Request().Context(), userID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist")
	}

	return c.JSON(http.StatusOK, wishlist)
}
