package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func (a *API) ListCategories(c echo.Context) error {
	categories, err := a.storage.ListCategories(c.Request().Context())

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get categories")
	}

	return c.JSON(http.StatusOK, categories)
}
