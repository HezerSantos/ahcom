package helpers

import (
	"alhcom/identity/models"
	"alhcom/identity/services"
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GenerateUserJWT(userId uuid.UUID, email string, exp int) (string, error) {
	var SECURE_AUTH_SECRET = []byte(os.Getenv("SECURE_AUTH_SECRET"))
	claims := jwt.MapClaims{
		"sub":   userId,
		"email": email,
		"exp":   time.Now().Add(time.Duration(exp) * time.Minute).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SECURE_AUTH_SECRET)
}

func VerifyUserJWT(cookie string, TOKEN_SECRET []byte) (map[string]interface{}, error) {
	token, err := jwt.Parse(cookie, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return TOKEN_SECRET, nil
	})

	if err != nil {
		return nil, fmt.Errorf("Unauthorized Token")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("Unauthorized Token")
	}
}

type LoginUserBodyJSON struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func AuthenticateUser(reqBody *LoginUserBodyJSON) (*models.UserModel, error) {
	getEmailInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("EMAIL#%s", reqBody.Email)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
	}

	userEmailData, err := services.DynamoDB.GetItem(context.TODO(), getEmailInput)

	if err != nil {
		return nil, fmt.Errorf("FAILED TO QUERY USER EMAIL DATA")
	}

	if len(userEmailData.Item) == 0 {
		return nil, nil
	}
	userId, ok := userEmailData.Item["userId"]

	if !ok {
		return nil, fmt.Errorf("PROPERTY USERID DOES NOT EXIST ON RETRIEVED USER")
	}

	sMember, ok := userId.(*types.AttributeValueMemberS)

	if !ok {
		return nil, fmt.Errorf("USERID IS NOT OF TYPE ATTRIBUTE VALUE MEMBER S")
	}
	parsedUUID, err := uuid.Parse(sMember.Value)

	if err != nil {
		return nil, fmt.Errorf("USERID IS NOT A UUID")
	}

	getUserInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", parsedUUID)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
	}

	userOutputData, err := services.DynamoDB.GetItem(context.TODO(), getUserInput)

	if err != nil {
		return nil, fmt.Errorf("FAILED TO QUERY USER DATA")
	}

	userPassword, ok := userOutputData.Item["password"]

	if !ok {
		return nil, fmt.Errorf("PROPERTY PASSWORD DOES NOT EXIST ON USER")
	}

	typedPassword, ok := userPassword.(*types.AttributeValueMemberS)

	if !ok {
		return nil, fmt.Errorf("PROPERTY PASSWORD IS NOT OF TYPE ATTRIBUTE VALUE MEMBER S")
	}

	match, err := ComparePasswordAndHash(reqBody.Password, typedPassword.Value)
	if err != nil {
		return nil, err
	}

	if match {
		return &models.UserModel{ID: parsedUUID, Email: reqBody.Email}, nil
	} else {
		return nil, nil
	}

}
