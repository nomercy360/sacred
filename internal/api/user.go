package api

import (
	"errors"
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
)

func (a *API) UpdateUserPreferences(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	var req contract.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to validate request")
	}

	user, err := a.storage.GetUserByID(uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get user")
	}

	user.Email = &req.Email

	if req.Name != nil {
		user.Name = req.Name
	}

	if req.Username != nil {
		user.Username = *req.Username
	}

	if err := a.storage.UpdateUser(c.Request().Context(), user, req.Interests); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot update user")
	}

	updated, err := a.storage.GetUserByID(uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get updated user")
	}

	return c.JSON(http.StatusOK, updated)
}

func (a *API) UpdateUserInterests(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	var interests []string
	if err := c.Bind(&interests); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to bind request")
	}

	if len(interests) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "interests cannot be empty")
	}

	user, err := a.storage.GetUserByID(uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get user")
	}

	if err := a.storage.UpdateUser(c.Request().Context(), user, interests); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot update user")
	}

	updated, err := a.storage.GetUserByID(uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get updated user")
	}

	return c.JSON(http.StatusOK, updated)
}

func (a *API) GetUserProfile(c echo.Context) error {
	profileID := c.Param("id")
	if profileID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "user id cannot be empty")
	}

	currentUserID, err := getUserID(c)
	if err != nil {
		return err
	}

	user, err := a.storage.GetUserByID(profileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get user")
	}

	items, err := a.storage.GetWishesByUserID(c.Request().Context(), profileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist items")
	}

	isFollowing, err := a.storage.IsFollowing(c.Request().Context(), currentUserID, profileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot check following status")
	}

	resp := contract.UserProfileResponse{
		ID:          user.ID,
		Name:        user.Name,
		Username:    user.Username,
		CreatedAt:   user.CreatedAt,
		Interests:   user.Interests,
		AvatarURL:   user.AvatarURL,
		Followers:   user.Followers,
		SavedItems:  items,
		IsFollowing: isFollowing,
	}

	return c.JSON(http.StatusOK, resp)
}

func (a *API) ListProfiles(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	users, err := a.storage.ListUsers(c.Request().Context(), uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot list profiles")
	}

	resp := make([]contract.UserProfileResponse, 0, len(users))
	for _, user := range users {
		items, err := a.storage.GetWishesByUserID(c.Request().Context(), user.ID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wishlist items")
		}

		resp = append(resp, contract.UserProfileResponse{
			ID:          user.ID,
			Name:        user.Name,
			Username:    user.Username,
			CreatedAt:   user.CreatedAt,
			Interests:   user.Interests,
			AvatarURL:   user.AvatarURL,
			Followers:   user.Followers,
			SavedItems:  items,
			IsFollowing: user.IsFollowing,
		})
	}

	return c.JSON(http.StatusOK, resp)
}

func (a *API) UnfollowUser(c echo.Context) error {
	var req contract.FollowUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to validate request")
	}

	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	if err := a.storage.UnfollowUser(c.Request().Context(), uid, req.FollowingID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "could not unfollow user")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) FollowUser(c echo.Context) error {
	var req contract.FollowUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to validate request")
	}

	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	isFollowing, _ := a.storage.IsFollowing(c.Request().Context(), uid, req.FollowingID)
	if isFollowing {
		return echo.NewHTTPError(http.StatusConflict, "already following this user")
	}

	if err := a.storage.FollowUser(c.Request().Context(), uid, req.FollowingID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "could not follow user")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) SaveWishToBookmarks(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	wid := c.Param("id")

	if wid == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "wish id cannot be empty")
	}

	wish, err := a.storage.GetWishByID(c.Request().Context(), uid, wid)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return echo.NewHTTPError(http.StatusNotFound, "wish not found")
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot get wish")
	}

	if wish.UserID == uid {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot bookmark own wish")
	}

	err = a.storage.SaveWishToBookmarks(c.Request().Context(), uid, wid)

	if err != nil && errors.Is(err, db.ErrAlreadyExists) {
		return echo.NewHTTPError(http.StatusConflict, "Wish was already copied")
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Cannot create copied wish")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) RemoveWishFromBookmarks(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	wid := c.Param("id")

	if wid == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "wish id cannot be empty")
	}

	if err := a.storage.RemoveWishFromBookmarks(c.Request().Context(), uid, wid); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "could not remove wish from bookmarks")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) ListBookmarkedWishes(c echo.Context) error {
	uid, err := getUserID(c)
	if err != nil {
		return err
	}

	items, err := a.storage.ListBookmarkedWishes(c.Request().Context(), uid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "could not list bookmarked wishes")
	}

	return c.JSON(http.StatusOK, items)
}
