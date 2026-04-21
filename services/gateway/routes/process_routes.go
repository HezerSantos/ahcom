package routes

import (
	"gateway/handlers"

	"github.com/gin-gonic/gin"
)

func ProcessRoutes(api *gin.RouterGroup) {
	api.Any("/*route", handlers.AnyHandler)
}
