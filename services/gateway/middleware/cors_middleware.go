package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/rs/cors"
)

var allowedHeaders = []string{
	"Content-Type",
	"Authorization",
	"Cookie",
	"csrfToken",
	"Server-Id",
}

var CorsHandler = cors.New(cors.Options{
	AllowedOrigins:   []string{"http://localhost:5173"},
	AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
	AllowedHeaders:   allowedHeaders,
	AllowCredentials: true,
})

func CorsMiddleware(c *gin.Context) {
	CorsHandler.HandlerFunc(c.Writer, c.Request)
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}
	c.Next()
}
