package middleware

import (
	"alhcom/identity/helpers"
	"alhcom/identity/models"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func AuthMiddleware(c *gin.Context) {
	var SECURE_AUTH_SECRET = []byte(os.Getenv("SECURE_AUTH_SECRET"))
	authCookie, err := c.Cookie("__Secure-auth.access")

	if err != nil {
		helpers.AuthError(c, "SECURE AUTH COOKIE MISSING FROM HEADERS", "/AuthMiddleware")
		c.Abort()
		return
	}

	cookieMap, err := helpers.VerifyUserJWT(authCookie, SECURE_AUTH_SECRET)

	if err != nil {
		helpers.AuthError(c, "ERROR VERIFYING SECURE AUTH JWT", "/AuthMiddleware")
		c.Abort()
		return
	}

	userId, ok := cookieMap["sub"]

	if !ok {
		helpers.NetworkError(c, "SUB FIELD ON JWT COOKIE IS MISSING", "/AuthMiddleware")
		c.Abort()
		return
	}

	assertedUserId, ok := userId.(string)

	if !ok {
		helpers.NetworkError(c, "SUB FIELD ON JWT COOKIE IS NOT STRING", "/AuthMiddleware")
		c.Abort()
		return
	}

	parsedUserId, err := uuid.Parse(assertedUserId)

	if err != nil {
		helpers.NetworkError(c, "SUB FIELD ON JWT COOKIE IS NOT UUID", "/AuthMiddleware")
		c.Abort()
		return
	}

	email, ok := cookieMap["email"]

	if !ok {
		helpers.NetworkError(c, "EMAIL FIELD ON JWT COOKIE IS MISSING", "/AuthMiddleware")
		c.Abort()
		return
	}

	assertedEmail, ok := email.(string)

	if !ok {
		helpers.NetworkError(c, "EMAIL FIELD IS NOT STRING", "/AuthMiddleware")
		c.Abort()
		return
	}

	user := models.UserModel{
		ID:    parsedUserId,
		Email: assertedEmail,
	}

	c.Set("user", user)
	c.Next()
}
