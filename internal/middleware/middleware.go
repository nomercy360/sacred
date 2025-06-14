package middleware

import (
	"context"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"log"
	"log/slog"
	"net/http"
	"sacred/internal/contract"
	"time"
)

const (
	ErrAuthInvalid = "invalid auth token"
)

func CustomHTTPErrorHandler(logger *slog.Logger) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}

		statusCode := http.StatusInternalServerError
		var message interface{} = "Internal Server Error"
		var internalErr error

		var he *echo.HTTPError
		if errors.As(err, &he) {
			statusCode = he.Code
			if he.Message != nil {
				message = he.Message
			}
			internalErr = he.Internal
		} else {
			internalErr = err
		}

		// Prepare log attributes
		logAttrs := []slog.Attr{
			slog.String("uri", c.Request().RequestURI),
			slog.Int("status", statusCode),
			slog.String("method", c.Request().Method),
		}

		if msgStr, ok := message.(string); ok {
			logAttrs = append(logAttrs, slog.String("message", msgStr))
			message = map[string]interface{}{"error": msgStr}
		}

		if internalErr != nil {
			logAttrs = append(logAttrs, slog.String("error", internalErr.Error()))
		}

		logger.LogAttrs(context.Background(), slog.LevelError, "REQUEST_ERROR", logAttrs...)

		var writeErr error
		if c.Request().Method == http.MethodHead {
			writeErr = c.NoContent(statusCode)
		} else {
			writeErr = c.JSON(statusCode, message)
		}

		if writeErr != nil {
			log.Printf("Error sending error response: %v", writeErr)
		}
	}
}

func Setup(e *echo.Echo, logger *slog.Logger) {
	// e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.PUT, echo.POST, echo.DELETE},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization, "X-API-Token"},
	}))
	e.Use(echoMiddleware.RequestLoggerWithConfig(echoMiddleware.RequestLoggerConfig{
		LogURI:       true,
		LogStatus:    true,
		LogMethod:    true,
		LogError:     true,
		LogRemoteIP:  true,
		LogUserAgent: true,
		HandleError:  true,
		LogValuesFunc: func(c echo.Context, v echoMiddleware.RequestLoggerValues) error {
			if v.Error == nil {
				logger.LogAttrs(c.Request().Context(), slog.LevelInfo, "REQUEST",
					slog.String("ip", v.RemoteIP),
					slog.String("method", v.Method),
					slog.String("uri", v.URI),
					slog.Int("status", v.Status),
					slog.String("user_agent", v.UserAgent),
				)
			}
			return nil
		},
	}))
	e.HTTPErrorHandler = CustomHTTPErrorHandler(logger)
	e.Use(echoMiddleware.TimeoutWithConfig(echoMiddleware.TimeoutConfig{
		Timeout: 30 * time.Second,
	}))
}

func GetUserAuthConfig(secret string) echojwt.Config {
	return echojwt.Config{
		NewClaimsFunc: func(_ echo.Context) jwt.Claims {
			return new(contract.JWTClaims)
		},
		SigningKey:             []byte(secret),
		ContinueOnIgnoredError: true,
		ErrorHandler: func(c echo.Context, err error) error {
			var extErr *echojwt.TokenExtractionError
			if !errors.As(err, &extErr) {
				// For non-extraction errors, return unauthorized
				return echo.NewHTTPError(http.StatusUnauthorized, "auth is invalid")
			}

			// For token extraction errors (missing token), just continue without setting user
			// This makes authentication optional
			return nil
		},
	}
}
