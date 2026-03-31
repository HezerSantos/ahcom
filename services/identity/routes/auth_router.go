package routes

import (
	"alhcom/identity/handlers"

	"github.com/gin-gonic/gin"
)

func AuthRouter(api *gin.RouterGroup) {
	authRouter := api.Group("/auth")
	authRouter.POST("/register", handlers.RegisterUser)
}
