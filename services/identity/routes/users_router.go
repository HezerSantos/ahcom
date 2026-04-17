package routes

import (
	"alhcom/identity/handlers"
	"alhcom/identity/middleware"

	"github.com/gin-gonic/gin"
)

func UsersRouter(api *gin.RouterGroup) {
	usersRouter := api.Group("/users")
	usersRouter.GET("/me", middleware.AuthMiddleware, handlers.GetUserProfile)
	usersRouter.GET("/:id", middleware.AuthMiddleware, handlers.GetProfileByUserID)
	usersRouter.PATCH("/me/profile", middleware.AuthMiddleware, handlers.UpdateUserProfile)
	usersRouter.PATCH("/me/settings", middleware.AuthMiddleware, handlers.UpdateUserSettings)
}
