package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/terrors"
)

func (a *API) ListIdeas(c echo.Context) error {
	ideas, err := a.storage.ListIdeas(c.Request().Context(), "uid")
	if err != nil {
		return terrors.InternalServer(err, "failed to list ideas")
	}

	return c.JSON(http.StatusOK, ideas)
}
