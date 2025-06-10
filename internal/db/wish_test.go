package db

import (
	"testing"
)

func TestEscapeFTS5Query(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple query without special chars",
			input:    "hello world <3",
			expected: "hello world \"<\"3",
		},
		{
			name:     "query with parentheses",
			input:    "hello (world)",
			expected: "hello \"(\"world\")\"",
		},
		{
			name:     "query with quotes",
			input:    `hello "world"`,
			expected: `hello ""world""`,
		},
		{
			name:     "query with asterisk",
			input:    "hello*world",
			expected: "hello\"*\"world",
		},
		{
			name:     "query with colon",
			input:    "hello:world",
			expected: "hello\":\"world",
		},
		{
			name:     "query with period",
			input:    "hello.world",
			expected: "hello\".\"world",
		},
		{
			name:     "query with caret",
			input:    "hello^world",
			expected: "hello\"^\"world",
		},
		{
			name:     "query with multiple special chars",
			input:    `(hello) * "world" : test.com^2`,
			expected: `"("hello")" "*" ""world"" ":" test"."com"^"2`,
		},
		{
			name:     "empty query",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := escapeFTS5Query(tt.input)
			if result != tt.expected {
				t.Errorf("escapeFTS5Query(%q) = %q; want %q", tt.input, result, tt.expected)
			}
		})
	}
}
