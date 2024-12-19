package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/terrors"
)

func (a *API) ListCategories(c echo.Context) error {
	categories, err := a.storage.ListCategories(c.Request().Context())

	if err != nil {
		return terrors.InternalServer(err, "cannot get categories")
	}

	return c.JSON(http.StatusOK, categories)
}
