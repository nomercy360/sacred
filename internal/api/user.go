package api

import (
	"errors"
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/terrors"
)

func (a *API) UpdateUserPreferences(c echo.Context) error {
	uid := getUserID(c)

	var req contract.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	user, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get user")
	}

	user.Email = &req.Email

	if req.Name != nil {
		user.Name = req.Name
	}

	if req.Username != nil {
		user.Username = *req.Username
	}

	if err := a.storage.UpdateUser(c.Request().Context(), user, req.Interests); err != nil {
		return terrors.InternalServer(err, "cannot update user")
	}

	updated, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get updated user")
	}

	return c.JSON(http.StatusOK, updated)
}

func (a *API) UpdateUserInterests(c echo.Context) error {
	uid := getUserID(c)

	var interests []string
	if err := c.Bind(&interests); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if len(interests) == 0 {
		return terrors.BadRequest(errors.New("interests cannot be empty"), "failed to validate request")
	}

	user, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get user")
	}

	if err := a.storage.UpdateUser(c.Request().Context(), user, interests); err != nil {
		return terrors.InternalServer(err, "cannot update user")
	}

	updated, err := a.storage.GetUserByID(uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot get updated user")
	}

	return c.JSON(http.StatusOK, updated)
}

func (a *API) GetUserProfile(c echo.Context) error {
	profileID := c.Param("id")
	if profileID == "" {
		return terrors.BadRequest(nil, "user id cannot be empty")
	}

	currentUserID := getUserID(c)

	user, err := a.storage.GetUserByID(profileID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get user")
	}

	items, err := a.storage.GetWishesByUserID(c.Request().Context(), profileID)
	if err != nil {
		return terrors.InternalServer(err, "cannot get wishlist items")
	}

	isFollowing, err := a.storage.IsFollowing(c.Request().Context(), currentUserID, profileID)
	if err != nil {
		return terrors.InternalServer(err, "cannot check following status")
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
	uid := getUserID(c)

	users, err := a.storage.ListUsers(c.Request().Context(), uid)
	if err != nil {
		return terrors.InternalServer(err, "cannot list profiles")
	}

	resp := make([]contract.UserProfileResponse, 0, len(users))
	for _, user := range users {
		items, err := a.storage.GetWishesByUserID(c.Request().Context(), user.ID)
		if err != nil {
			return terrors.InternalServer(err, "cannot get wishlist items")
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
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	uid := getUserID(c)

	if err := a.storage.UnfollowUser(c.Request().Context(), uid, req.FollowingID); err != nil {
		return terrors.InternalServer(err, "could not unfollow user")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) FollowUser(c echo.Context) error {
	var req contract.FollowUserRequest
	if err := c.Bind(&req); err != nil {
		return terrors.BadRequest(err, "failed to bind request")
	}

	if err := req.Validate(); err != nil {
		return terrors.BadRequest(err, "failed to validate request")
	}

	uid := getUserID(c)

	isFollowing, _ := a.storage.IsFollowing(c.Request().Context(), uid, req.FollowingID)
	if isFollowing {
		return terrors.Conflict(nil, "already following this user")
	}

	if err := a.storage.FollowUser(c.Request().Context(), uid, req.FollowingID); err != nil {
		return terrors.InternalServer(err, "could not follow user")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) SaveWishToBookmarks(c echo.Context) error {
	uid := getUserID(c)
	wid := c.Param("id")

	if wid == "" {
		return terrors.BadRequest(nil, "wish id cannot be empty")
	}

	wish, err := a.storage.GetWishByID(c.Request().Context(), uid, wid)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		return terrors.NotFound(err, "wish not found")
	} else if err != nil {
		return terrors.InternalServer(err, "cannot get wish")
	}

	if wish.UserID == uid {
		return terrors.BadRequest(nil, "cannot bookmark own wish")
	}

	err = a.storage.SaveWishToBookmarks(c.Request().Context(), uid, wid)

	if err != nil && errors.Is(err, db.ErrAlreadyExists) {
		return terrors.Conflict(err, "Wish was already copied")
	} else if err != nil {
		return terrors.InternalServer(err, "Cannot create copied wish")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) RemoveWishFromBookmarks(c echo.Context) error {
	uid := getUserID(c)
	wid := c.Param("id")

	if wid == "" {
		return terrors.BadRequest(nil, "wish id cannot be empty")
	}

	if err := a.storage.RemoveWishFromBookmarks(c.Request().Context(), uid, wid); err != nil {
		return terrors.InternalServer(err, "could not remove wish from bookmarks")
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "OK"})
}

func (a *API) ListBookmarkedWishes(c echo.Context) error {
	uid := getUserID(c)

	items, err := a.storage.ListBookmarkedWishes(c.Request().Context(), uid)
	if err != nil {
		return terrors.InternalServer(err, "could not list bookmarked wishes")
	}

	return c.JSON(http.StatusOK, items)
}
