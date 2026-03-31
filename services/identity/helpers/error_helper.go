package helpers

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func printError(errorMessage string, path string) {
	fmt.Printf("ERROR OCCURED: %s @ %s\n", errorMessage, path)
}

func NetworkError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(500, gin.H{
		"msg":  "Oops! Looks like an error occured on our end.",
		"code": "INVALID_SERVER_ERROR",
	})
}

func AuthError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(401, gin.H{
		"msg":  "Authentication required. Please log in or provide a valid token.",
		"code": "INVALID_AUTHORIZATION_ERROR",
	})
}

func BadRequestBodyError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(400, gin.H{
		"msg":  "Invalid request body. Please check the data you provided.",
		"code": "INVALID_REQUEST_BODY",
	})
}

func BadRequestParamsError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(400, gin.H{
		"msg":  "Invalid URL parameters. Please verify the request path.",
		"code": "INVALID_REQUEST_PARAMS",
	})
}

func BadRequestQueryError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(400, gin.H{
		"msg":  "Invalid query parameters. Please check your query values.",
		"code": "INVALID_REQUEST_QUERY",
	})
}

func ForbiddenError(c *gin.Context, errorMessage string, path string) {
	printError(errorMessage, path)
	c.JSON(403, gin.H{
		"msg":  "Access denied. You do not have permission to perform this action.",
		"code": "FORBIDDEN",
	})
}
