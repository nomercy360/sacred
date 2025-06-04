package api_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/testutils"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetWishSaversHandler(t *testing.T) {
	t.Run("successful retrieval first page", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		// Create users
		ownerAuth, err := testutils.AuthHelper(t, ts.Echo, 1001, "owner", "Wish Owner")
		require.NoError(t, err)
		saver1Auth, err := testutils.AuthHelper(t, ts.Echo, 1002, "saver1", "Wish Saver One")
		require.NoError(t, err)
		saver2Auth, err := testutils.AuthHelper(t, ts.Echo, 1003, "saver2", "Wish Saver Two")
		require.NoError(t, err)

		// Create category
		categoryID := "cat_savers_1"
		catName := "Savers Category 1"
		err = ts.Storage.CreateCategory(context.Background(), db.Category{ID: categoryID, Name: catName, ImageURL: "url"})
		require.NoError(t, err)

		// Create wish
		wishID := "wish_savers_test_1"
		wishName := "My Test Wish For Savers (Page 1)"
		now := time.Now()
		err = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID:          wishID,
			UserID:      ownerAuth.User.ID,
			Name:        &wishName,
			PublishedAt: &now, // Ensure wish is published
			CreatedAt:   now,
			UpdatedAt:   now,
		}, []string{categoryID})
		require.NoError(t, err)

		// Create bookmarks (savers) - User saver2 bookmarks first, then saver1 to test ordering
		err = ts.Storage.SaveWishToBookmarks(context.Background(), saver2Auth.User.ID, wishID)
		require.NoError(t, err)
		time.Sleep(5 * time.Millisecond) // Ensure distinct created_at for ordering
		err = ts.Storage.SaveWishToBookmarks(context.Background(), saver1Auth.User.ID, wishID)
		require.NoError(t, err)

		// Perform request
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/wishes/"+wishID+"/savers", "", "", http.StatusOK)

		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 2, resp.Total)
		require.Len(t, resp.Users, 2)

		// Check order (assuming ORDER BY ub.created_at DESC, so latest saver is first)
		assert.Equal(t, saver1Auth.User.Username, resp.Users[0].Username)
		assert.Equal(t, saver1Auth.User.ID, resp.Users[0].ID)
		assert.Equal(t, saver2Auth.User.Username, resp.Users[1].Username)
		assert.Equal(t, saver2Auth.User.ID, resp.Users[1].ID)
		assert.Equal(t, 0, resp.Users[0].Followers) // Follower count not seeded
	})

	// Test case 2: Successful retrieval - pagination (e.g. 3 users, limit 2, page 2)
	t.Run("successful retrieval with pagination", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 2001, "owner2", "Owner")
		s1, _ := testutils.AuthHelper(t, ts.Echo, 2002, "s1", "S1")
		s2, _ := testutils.AuthHelper(t, ts.Echo, 2003, "s2", "S2")
		s3, _ := testutils.AuthHelper(t, ts.Echo, 2004, "s3", "S3")

		catID := "cat_pagination"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "Pag Cat", ImageURL: "url"})

		wishID := "wish_pagination"
		wishName := "Pagination Test Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		// Save bookmarks: s3 (latest), s2, s1 (oldest)
		_ = ts.Storage.SaveWishToBookmarks(context.Background(), s1.User.ID, wishID)
		time.Sleep(2 * time.Millisecond)
		_ = ts.Storage.SaveWishToBookmarks(context.Background(), s2.User.ID, wishID)
		time.Sleep(2 * time.Millisecond)
		_ = ts.Storage.SaveWishToBookmarks(context.Background(), s3.User.ID, wishID)

		page := 2
		limit := 1 // Request 1 user for page 2
		reqPath := fmt.Sprintf("/wishes/%s/savers?page=%d&limit=%d", wishID, page, limit)
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, reqPath, "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 3, resp.Total)                            // Total 3 savers
		require.Len(t, resp.Users, 1)                             // Limit 1 for this page
		assert.Equal(t, s2.User.Username, resp.Users[0].Username) // s3 was latest, s2 is second latest
	})

	// Test case 3: Wish with no savers
	t.Run("wish with no savers", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()
		apiHandler := ts.API

		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 3001, "owner_no_savers", "Owner")
		catID := "cat_no_savers"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "No Savers Cat", ImageURL: "url"})
		wishID := "wish_no_savers"
		wishName := "No Savers Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		req := httptest.NewRequest(http.MethodGet, "/wishes/"+wishID+"/savers", nil)
		rec := httptest.NewRecorder()
		c := ts.Echo.NewContext(req, rec)
		c.SetPath("/wishes/:id/savers")
		c.SetParamNames("id")
		c.SetParamValues(wishID)

		err := apiHandler.GetWishSaversHandler(c)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)

		var resp contract.WishSaversResponse
		_ = json.Unmarshal(rec.Body.Bytes(), &resp)
		assert.Equal(t, 0, resp.Total)
		assert.Len(t, resp.Users, 0)
	})

	t.Run("non-existent wish ID", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		wishID := "wish_does_not_exist"
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/wishes/"+wishID+"/savers", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 0, resp.Total)
		assert.Len(t, resp.Users, 0)
	})

	// Test case 5.1: Invalid pagination - page 0, defaults to 1
	t.Run("invalid pagination page 0", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		// Minimal data setup, as we are testing param handling not data retrieval accuracy here
		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 5001, "owner_page0", "Owner")
		catID := "cat_page0"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "Page0 Cat", ImageURL: "url"})
		wishID := "wish_page0_param_test"
		wishName := "Page0 Test Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})
		// Add one saver to ensure the query runs
		saverAuth, _ := testutils.AuthHelper(t, ts.Echo, 5002, "saver_page0", "Saver")
		_ = ts.Storage.SaveWishToBookmarks(context.Background(), saverAuth.User.ID, wishID)

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/wishes/"+wishID+"/savers?page=0", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 1, resp.Total) // One saver added
		assert.Len(t, resp.Users, 1)
	})

	// Test case 6: Invalid pagination - limit too high, capped at 100
	t.Run("invalid pagination limit too high", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 6001, "owner_limit_high", "Owner")
		catID := "cat_limit_high"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "LimitHigh Cat", ImageURL: "url"})
		wishID := "wish_limit_high_param_test"
		wishName := "Limit High Test Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})
		// Add one saver
		saverAuth, _ := testutils.AuthHelper(t, ts.Echo, 6002, "saver_limit_high", "Saver")
		_ = ts.Storage.SaveWishToBookmarks(context.Background(), saverAuth.User.ID, wishID)

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, fmt.Sprintf("/wishes/%s/savers?limit=200", wishID), "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 1, resp.Total)
		assert.Len(t, resp.Users, 1)
	})
}
