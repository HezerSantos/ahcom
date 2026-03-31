package handlers

import (
	"alhcom/identity/helpers"
	"alhcom/identity/services"
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"os"
)

type RegisterUserBodyJSON struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=Password"`
}

func RegisterUser(c *gin.Context) {
	var ReqBody RegisterUserBodyJSON

	err := c.ShouldBindJSON(&ReqBody)

	if err != nil {
		helpers.BadRequestBodyError(c, "FAILED TO BIND BODY FOR REGISTER USER", "/auth/register")
		return
	}

	getItemInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("EMAIL#%s", ReqBody.Email)},
			"SK": &types.AttributeValueMemberS{Value: "EMAIL"},
		},
	}

	getItemOutput, err := services.DynamoDB.GetItem(context.TODO(), getItemInput)

	if err != nil {
		helpers.NetworkError(c, "FAILED TO PROCESS GET ITEM INPUT", "/auth/register")
		return
	}
	if len(getItemOutput.Item) != 0 {
		helpers.BadRequestBodyError(c, "FAILED TO CREATE EXISTING USER", "/auth/register")
		return
	}

	passwordHash, err := helpers.HashPassword(ReqBody.Password)

	if err != nil {
		helpers.NetworkError(c, "FAILED TO HASH USER PASSWORD", "/auth/register")
		return
	}

	newUserId, err := uuid.NewV7()

	if err != nil {
		helpers.NetworkError(c, "FAILED TO CREATE NEW USER UUID", "/auth/register")
		return
	}
	putItemInputUser := &types.Put{
		TableName: aws.String("AHCOM"),
		Item: map[string]types.AttributeValue{
			"PK":       &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", newUserId)},
			"SK":       &types.AttributeValueMemberS{Value: "PROFILE"},
			"password": &types.AttributeValueMemberS{Value: passwordHash},
			"email":    &types.AttributeValueMemberS{Value: ReqBody.Email},
		},
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	}
	putItemInputEmail := &types.Put{
		TableName: aws.String("AHCOM"),
		Item: map[string]types.AttributeValue{
			"PK":     &types.AttributeValueMemberS{Value: fmt.Sprintf("EMAIL#%s", ReqBody.Email)},
			"SK":     &types.AttributeValueMemberS{Value: "EMAIL"},
			"userId": &types.AttributeValueMemberS{Value: fmt.Sprint(newUserId)},
		},
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	}

	transactionWriteItemsInput := &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{Put: putItemInputEmail},
			{Put: putItemInputUser},
		},
	}

	_, err = services.DynamoDB.TransactWriteItems(context.TODO(), transactionWriteItemsInput)

	if err != nil {
		helpers.NetworkError(c, "FAILED TO PROCESS DYNAMODB TRANSACTION", "/auth/register")
		return
	}

	c.JSON(200, gin.H{
		"msg":   "USER SUCCESSFULLY CREATED",
		"id":    newUserId,
		"email": ReqBody.Email,
	})
}

// type LoginUserBodyJSON struct {
// 	Email    string `json:"email" binding:"required"`
// 	Password string `json:"password" binding:"required"`
// }

func LoginUser(c *gin.Context) {
	var ReqBody helpers.LoginUserBodyJSON

	err := c.ShouldBindJSON(&ReqBody)

	if err != nil {
		helpers.BadRequestBodyError(c, "FAILED TO BIND BODY FOR LOGIN USER", "/auth/login")
		return
	}

	userData, err := helpers.AuthenticateUser(&ReqBody)

	if err != nil {
		helpers.NetworkError(c, err.Error(), "/auth/login")
		return
	}

	if userData == nil {
		helpers.AuthError(c, "UNAUTHORIZED USER", "/auth/login")
		return
	}

	userJwt, err := helpers.GenerateUserJWT(userData.ID, userData.Email, 15)

	if err != nil {
		helpers.NetworkError(c, "ERROR PARSING USER JWT", "/auth/login")
		return
	}

	domain := ""

	if os.Getenv("GO_ENV") == "production" {
		domain = ".hallowedvisions.com"
	}
	c.SetCookie(
		"__Secure-secure-auth.access",
		userJwt,
		60*1000*60,
		"/",
		domain,
		true,
		true,
	)

	c.JSON(200, gin.H{
		"msg": "Login Successful",
	})
}
