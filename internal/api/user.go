package api

import (
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/terrors"
)

type UpdateUserRequest struct {
	Interests []int  `json:"interests" validate:"required"`
	Email     string `json:"email" validate:"required,email"`
}

func (a *API) UpdateUserPreferences(c echo.Context) error {
	uid := getUserID(c)

	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := c.Validate(req); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	if len(req.Interests) == 0 {
		return terrors.BadRequest(nil, "interests cannot be empty")
	}

	user, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get user")
	}

	user.Email = &req.Email

	if err := a.storage.UpdateUser(c.Request().Context(), user, req.Interests); err != nil {
		return terrors.InternalServer(err, "cannot update user")
	}

	updated, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get updated user")
	}

	resp := contract.UserResponse{
		ID:           updated.ID,
		FirstName:    updated.FirstName,
		LastName:     updated.LastName,
		Username:     updated.Username,
		ChatID:       updated.ChatID,
		LanguageCode: updated.LanguageCode,
		CreatedAt:    updated.CreatedAt,
		Email:        updated.Email,
		ReferralCode: updated.ReferralCode,
		ReferredBy:   updated.ReferredBy,
		Interests:    updated.Interests,
	}

	return c.JSON(http.StatusOK, resp)
}
