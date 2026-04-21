package helpers

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func printError(errorMessage string, path string, status int, c *gin.Context) {
	fmt.Printf("\nERROR: %d\n", status)
	fmt.Printf("	Path: @%s\n", path)
	fmt.Printf("	Message: %s\n", errorMessage)
	fmt.Printf("	Origin: %s", c.Request.URL)
}

func NetworkError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 500, c)
	c.JSON(500, gin.H{
		"success": false,
		"message": "Oops! Looks like an error occured on our end.",
		"code":    "INVALID_SERVER_ERROR",
	})
}

func AuthError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 401, c)
	c.JSON(401, gin.H{
		"message": "Authentication required. Please log in or provide a valid token.",
		"code":    "INVALID_AUTHORIZATION_ERROR",
	})
}

func BadRequestBodyError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 400, c)
	c.JSON(400, gin.H{
		"success": false,
		"message": "Invalid request body. Please check the data you provided.",
		"code":    "INVALID_REQUEST_BODY",
	})
}

func BadRequestParamsError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 400, c)
	c.JSON(400, gin.H{
		"success": false,
		"message": "Invalid URL parameters. Please verify the request path.",
		"code":    "INVALID_REQUEST_PARAMS",
	})
}

func BadRequestQueryError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 500, c)
	c.JSON(400, gin.H{
		"success": false,
		"message": "Invalid query parameters. Please check your query values.",
		"code":    "INVALID_REQUEST_QUERY",
	})
}

func ForbiddenError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 403, c)
	c.JSON(403, gin.H{
		"success": false,
		"message": "Access denied. You do not have permission to perform this action.",
		"code":    "FORBIDDEN",
	})
}

func NotFoundError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path, 404, c)
	c.JSON(404, gin.H{
		"success": false,
		"message": "The requested resource could not be found.",
		"code":    "NOT_FOUND",
	})
}
