package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
)

func (a *API) Health(c echo.Context) error {
	stats, err := a.storage.Health()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get health stats")
	}

	return c.JSON(http.StatusOK, stats)
}
