package handlers

import (
	"alhcom/identity/helpers"
	"alhcom/identity/models"
	"alhcom/identity/services"
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/gin-gonic/gin"
)

func GetUserProfile(c *gin.Context) {

	user, exist := c.Get("user")

	if !exist {
		helpers.AuthError(c, "PROPERTY USER DOES NOT EXIST IN CONTEXT", "/users")
		return
	}

	typedUser, ok := user.(models.UserModel)

	if !ok {
		helpers.NetworkError(c, "USER STRUCT NOT OF TYPE USER MODEL", "/users")
		return
	}

	userGetItemCommandInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", typedUser.ID)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
	}

	res, err := services.DynamoDB.GetItem(context.TODO(), userGetItemCommandInput)
}
