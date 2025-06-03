package api_test

import (
	"encoding/json"
	"net/http"
	"sacred/internal/api"
	"sacred/internal/contract"
	"sacred/internal/testutils"
	"testing"
)

func TestTelegramAuth_Success(t *testing.T) {
	ts := testutils.SetupTestEnvironment(t)
	defer ts.Teardown()

	resp, err := testutils.AuthHelper(t, ts.Echo, testutils.TelegramTestUserID, "mkkksim", "Maksim")
	if err != nil {
		t.Fatalf("Failed to authenticate: %v", err)
	}

	if resp.Token == "" {
		t.Error("Expected non-empty JWT token")
	}
	if resp.User.ChatID != testutils.TelegramTestUserID {
		t.Errorf("Expected ChatID %d, got %d", testutils.TelegramTestUserID, resp.User.ChatID)
	}
	if resp.User.Username != "mkkksim" {
		t.Errorf("Expected username 'mkkksim', got '%s'", resp.User.Username)
	}
	if resp.User.Name == nil || *resp.User.Name != "Maksim" {
		t.Errorf("Expected Name 'Maksim', got '%v'", resp.User.Name)
	}
	if resp.User.LanguageCode != "ru" {
		t.Errorf("Expected LanguageCode 'ru', got '%v'", resp.User.LanguageCode)
	}
}

func TestTelegramAuth_InvalidInitData(t *testing.T) {
	ts := testutils.SetupTestEnvironment(t)
	defer ts.Teardown()

	reqBody := contract.AuthTelegramRequest{
		Query: "invalid-init-data",
	}
	body, _ := json.Marshal(reqBody)

	rec := testutils.PerformRequest(t, ts.Echo, http.MethodPost, "/auth/telegram", string(body), "", http.StatusUnauthorized)

	resp := testutils.ParseResponse[contract.ErrorResponse](t, rec)
	if resp.Error != api.ErrInvalidInitData {
		t.Errorf("Expected error '%s', got '%s'", api.ErrInvalidInitData, resp.Error)
	}
}

func TestTelegramAuth_MissingQuery(t *testing.T) {
	ts := testutils.SetupTestEnvironment(t)
	defer ts.Teardown()

	reqBody := contract.AuthTelegramRequest{}
	body, _ := json.Marshal(reqBody)

	rec := testutils.PerformRequest(t, ts.Echo, http.MethodPost, "/auth/telegram", string(body), "", http.StatusBadRequest)

	resp := testutils.ParseResponse[contract.ErrorResponse](t, rec)
	if resp.Error != api.ErrInvalidRequest {
		t.Errorf("Expected error '%s', got '%s'", api.ErrInvalidRequest, resp.Error)
	}
}
