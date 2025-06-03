package testutils

import (
	"context"
	"encoding/json"
	"fmt"
	telegram "github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"sacred/internal/api"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/middleware"
	"strings"
	"testing"
	"time"
)

type MockPhotoUploader struct {
	UploadedFiles map[string]string
}

type MockEmbeddingService struct {
	// Function implementation
	GenerateEmbeddingFunc func(ctx context.Context, text string) ([]float64, error)
	// Call tracking for testing
	GeneratedTexts []string
}

func (m *MockEmbeddingService) GenerateEmbedding(ctx context.Context, text string) ([]float64, error) {
	// Track the text that was sent for embedding
	m.GeneratedTexts = append(m.GeneratedTexts, text)

	if m.GenerateEmbeddingFunc != nil {
		return m.GenerateEmbeddingFunc(ctx, text)
	}

	// Return a default embedding vector for testing (1536 dimensions for text-embedding-3-small)
	embedding := make([]float64, 1536)
	for i := range embedding {
		embedding[i] = float64(i) * 0.001 // Simple pattern for testing
	}
	return embedding, nil
}

const (
	TestBotToken       = "test-bot-token"
	TelegramTestUserID = 927635965
)

type MockTelegramBot struct {
	mock.Mock
}

func (m *MockTelegramBot) Send(ctx context.Context, params *telegram.SendMessageParams) (*models.Message, error) {
	args := m.Called(ctx, params)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Message), args.Error(1)
}

func (m *MockTelegramBot) SetWebhook(ctx context.Context, params *telegram.SetWebhookParams) (bool, error) {
	args := m.Called(ctx, params)
	return args.Bool(0), args.Error(1)
}

type testSetup struct {
	Echo     *echo.Echo
	Storage  *db.Storage
	API      *api.API
	MockS3   *MockPhotoUploader
	MockBot  *MockTelegramBot
	Teardown func()
}

func SetupTestEnvironment(t *testing.T) *testSetup {
	t.Helper()

	hConfig := api.Config{
		JWTSecret: "test-jwt-secret",
		AssetsURL: "http://localhost/assets",
		WebAppURL: "http://localhost/webapp",
	}

	// Use a shared in-memory database for tests to avoid connection issues
	// The ?cache=shared ensures all connections see the same database
	storage, err := db.NewStorage("file::memory:?cache=shared")
	require.NoError(t, err, "Failed to create in-memory storage")

	err = storage.InitSchema()
	if err != nil {
		t.Logf("Schema initialization error: %v", err)
		require.NoError(t, err, "Failed to initialize DB schema")
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// 4. Mocks: TODO

	a := api.New(storage, hConfig, nil, nil)

	e := echo.New()
	middleware.Setup(e, logger)

	a.SetupRoutes(e) // Register all your application routes

	teardown := func() {
		err := storage.Close()
		assert.NoError(t, err, "Failed to close storage")
	}

	return &testSetup{
		Echo:     e,
		Storage:  storage,
		API:      a,
		Teardown: teardown,
	}
}

func PerformRequest(t *testing.T, e *echo.Echo, method, path, body, token string, expectedStatus int) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	if token != "" {
		req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)

	if rec.Code != expectedStatus {
		t.Errorf("Expected status %d, got %d, body: %s", expectedStatus, rec.Code, rec.Body.String())
	}
	return rec
}

func ParseResponse[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	var result T
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}
	return result
}

func AuthHelper(t *testing.T, e *echo.Echo, telegramID int64, username, firstName string) (contract.AuthResponse, error) {
	userJSON := fmt.Sprintf(
		`{"id":%d,"first_name":"%s","last_name":"","username":"%s","language_code":"ru","is_premium":true,"allows_write_to_pm":true,"photo_url":"https://t.me/i/userpic/320/test.svg"}`,
		telegramID, firstName, username,
	)

	initData := map[string]string{
		"query_id":  "AAH9mUo3AAAAAP2ZSjdVL00J",
		"user":      userJSON,
		"auth_date": fmt.Sprintf("%d", time.Now().Unix()),
		"signature": "W_7-jDZLl7iwW8Qr2IZARpIsseV6jJDU_6eQ3ti-XY5Nm58N1_9dkXuFf9xidDZ0aoY_Pv0kq2-clrbHeLMQBA",
	}

	sign := initdata.Sign(initData, TestBotToken, time.Now())
	initData["hash"] = sign

	var query string
	for k, v := range initData {
		query += fmt.Sprintf("%s=%s&", k, v)
	}

	reqBody := contract.AuthTelegramRequest{
		Query: query,
	}

	body, _ := json.Marshal(reqBody)

	rec := PerformRequest(t, e, http.MethodPost, "/auth/telegram", string(body), "", http.StatusOK)

	resp := ParseResponse[contract.AuthResponse](t, rec)

	return resp, nil
}
