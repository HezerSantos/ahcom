package routes

import (
	"alhcom/identity/handlers"
	"alhcom/identity/middleware"

	"github.com/gin-gonic/gin"
)

func UsersRouter(api *gin.RouterGroup) {
	usersRouter := api.Group("/users")
	usersRouter.GET("/me", middleware.AuthMiddleware, handlers.GetUserProfile)
}
