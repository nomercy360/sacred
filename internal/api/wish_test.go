package api_test

import (
	"context"
	"fmt"
	"net/http"
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

		// Create copied wishes (savers) - User saver2 copies first, then saver1 to test ordering
		copyName1 := "Copied wish by saver2"
		err = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID:          "copy1_" + wishID,
			UserID:      saver2Auth.User.ID,
			Name:        &copyName1,
			SourceID:    &wishID,
			PublishedAt: &now,
			CreatedAt:   now,
			UpdatedAt:   now,
		}, []string{categoryID})
		require.NoError(t, err)
		time.Sleep(5 * time.Millisecond) // Ensure distinct created_at for ordering
		copyName2 := "Copied wish by saver1"
		err = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID:          "copy2_" + wishID,
			UserID:      saver1Auth.User.ID,
			Name:        &copyName2,
			SourceID:    &wishID,
			PublishedAt: &now,
			CreatedAt:   now.Add(5 * time.Millisecond),
			UpdatedAt:   now.Add(5 * time.Millisecond),
		}, []string{categoryID})
		require.NoError(t, err)

		// Perform request
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/v1/wishes/"+wishID+"/savers", "", ownerAuth.Token, http.StatusOK)

		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 3, resp.Total) // Original creator + 2 copiers
		require.Len(t, resp.Users, 3)

		// Check order: original creator first, then copiers by created_at DESC
		assert.Equal(t, ownerAuth.User.Username, resp.Users[0].Username) // Original creator first
		assert.Equal(t, ownerAuth.User.ID, resp.Users[0].ID)
		assert.Equal(t, saver1Auth.User.Username, resp.Users[1].Username) // Latest copier second
		assert.Equal(t, saver1Auth.User.ID, resp.Users[1].ID)
		assert.Equal(t, saver2Auth.User.Username, resp.Users[2].Username) // First copier last
		assert.Equal(t, saver2Auth.User.ID, resp.Users[2].ID)
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

		// Create copied wishes: s1 (oldest), s2, s3 (latest)
		copyName1 := "Copy by s1"
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: "copy_s1_" + wishID, UserID: s1.User.ID, Name: &copyName1, SourceID: &wishID,
			PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})
		time.Sleep(2 * time.Millisecond)
		copyName2 := "Copy by s2"
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: "copy_s2_" + wishID, UserID: s2.User.ID, Name: &copyName2, SourceID: &wishID,
			PublishedAt: &now, CreatedAt: now.Add(2 * time.Millisecond), UpdatedAt: now.Add(2 * time.Millisecond),
		}, []string{catID})
		time.Sleep(2 * time.Millisecond)
		copyName3 := "Copy by s3"
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: "copy_s3_" + wishID, UserID: s3.User.ID, Name: &copyName3, SourceID: &wishID,
			PublishedAt: &now, CreatedAt: now.Add(4 * time.Millisecond), UpdatedAt: now.Add(4 * time.Millisecond),
		}, []string{catID})

		page := 2
		limit := 1 // Request 1 user for page 2
		reqPath := fmt.Sprintf("/v1/wishes/%s/savers?page=%d&limit=%d", wishID, page, limit)
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, reqPath, "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 4, resp.Total)                            // Original creator + 3 copiers
		require.Len(t, resp.Users, 1)                             // Limit 1 for this page
		assert.Equal(t, s3.User.Username, resp.Users[0].Username) // Page 2 shows s3 (latest copier)
	})

	// Test case 3: Wish with no copiers (but has original creator)
	t.Run("wish with no copiers", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 3001, "owner_no_savers", "Owner")
		catID := "cat_no_savers"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "No Savers Cat", ImageURL: "url"})
		wishID := "wish_no_savers"
		wishName := "No Savers Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/v1/wishes/"+wishID+"/savers", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 1, resp.Total) // Only the original creator
		require.Len(t, resp.Users, 1)
		assert.Equal(t, ownerAuth.User.Username, resp.Users[0].Username)
		assert.Equal(t, ownerAuth.User.ID, resp.Users[0].ID)
	})

	t.Run("non-existent wish ID", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		wishID := "wish_does_not_exist"
		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/v1/wishes/"+wishID+"/savers", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 0, resp.Total)
		assert.Len(t, resp.Users, 0)
	})

	// Test case 4: Verify original creator always appears first even when not copied
	t.Run("original creator appears first even with no copies", func(t *testing.T) {
		ts := testutils.SetupTestEnvironment(t)
		defer ts.Teardown()

		ownerAuth, _ := testutils.AuthHelper(t, ts.Echo, 4001, "owner_only", "Owner Only")
		catID := "cat_owner_only"
		_ = ts.Storage.CreateCategory(context.Background(), db.Category{ID: catID, Name: "Owner Only Cat", ImageURL: "url"})
		wishID := "wish_owner_only"
		wishName := "Owner Only Test Wish"
		now := time.Now()
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: wishID, UserID: ownerAuth.User.ID, Name: &wishName, PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/v1/wishes/"+wishID+"/savers", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 1, resp.Total) // Only the original creator
		require.Len(t, resp.Users, 1)
		assert.Equal(t, ownerAuth.User.Username, resp.Users[0].Username)
		assert.Equal(t, ownerAuth.User.ID, resp.Users[0].ID)
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
		copyName := "Copy by saver"
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: "copy_page0_" + wishID, UserID: saverAuth.User.ID, Name: &copyName, SourceID: &wishID,
			PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, "/v1/wishes/"+wishID+"/savers?page=0", "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 2, resp.Total) // Original creator + 1 copier
		assert.Len(t, resp.Users, 2)
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
		copyName := "Copy by saver"
		_ = ts.Storage.CreateWish(context.Background(), db.Wish{
			ID: "copy_limit_high_" + wishID, UserID: saverAuth.User.ID, Name: &copyName, SourceID: &wishID,
			PublishedAt: &now, CreatedAt: now, UpdatedAt: now,
		}, []string{catID})

		req := testutils.PerformRequest(t, ts.Echo, http.MethodGet, fmt.Sprintf("/v1/wishes/%s/savers?limit=200", wishID), "", "", http.StatusOK)
		resp := testutils.ParseResponse[contract.WishSaversResponse](t, req)

		assert.Equal(t, 2, resp.Total) // Original creator + 1 copier
		assert.Len(t, resp.Users, 2)   // Both should be returned even with high limit
	})
}
