package routes

import (
	"gateway/handlers"
	"gateway/middleware"

	"github.com/gin-gonic/gin"
)

func ProcessRoutes(api *gin.RouterGroup) {
	api.Any("/*route", middleware.LoggingMiddleware, handlers.AnyHandler)
}
