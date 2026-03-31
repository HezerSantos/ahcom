package routes

import "github.com/gin-gonic/gin"

func ProcessRoutes(api *gin.RouterGroup) {
	AuthRouter(api)
}
