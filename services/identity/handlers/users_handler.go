package handlers

import (
	"alhcom/identity/helpers"
	"alhcom/identity/models"
	"alhcom/identity/services"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type User struct {
	PK       string `dynamodbav:"PK" json:"pk"`
	SK       string `dynamodbav:"SK" json:"sk"`
	Email    string `dynamodbav:"email" json:"email"`
	Settings struct {
		PublicProfile bool   `dynamodbav:"publicProfile" json:"publicProfile"`
		DistanceUnit  string `dynamodbav:"distanceUnit" json:"distanceUnit"`
	} `dynamodbav:"settings" json:"settings"`
	Profile struct {
		AvatarUrl        *string `dynamodbav:"avatarUrl" json:"avatarUrl"`
		ReviewCount      int     `dynamodbav:"reviewCount" json:"reviewCount"`
		DisplayName      string  `dynamodbav:"displayName" json:"displayName"`
		TotalSavedPlaces int     `dynamodbav:"totalSavedPlaces" json:"totalSavedPlaces"`
	} `dynamodbav:"profile" json:"profile"`
}

func GetUserProfile(c *gin.Context) {

	user, exist := c.Get("user")

	if !exist {
		helpers.AuthError(c, "PROPERTY USER DOES NOT EXIST IN CONTEXT", "/users/me")
		return
	}

	typedUser, ok := user.(models.UserModel)

	if !ok {
		helpers.NetworkError(c, "USER STRUCT NOT OF TYPE USER MODEL", "/users/me")
		return
	}

	userGetItemCommandInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", typedUser.ID)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
	}

	userData, err := services.DynamoDB.GetItem(context.TODO(), userGetItemCommandInput)

	if err != nil {
		helpers.NetworkError(c, "DYNAMO DB GET USER FAILED", "/users/me")
		return
	}

	if userData.Item == nil {
		helpers.NotFoundError(c, "USER NOT FOUND", "/users/me")
		return
	}

	var userMapped User

	err = attributevalue.UnmarshalMap(userData.Item, &userMapped)

	if err != nil {
		helpers.NetworkError(c, "ERROR UNMARSHALLING USER MAP", "/users/me")
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"user":    userMapped,
	})

}

func GetProfileByUserID(c *gin.Context) {
	userId, ok := c.Params.Get("id")

	if !ok {
		helpers.BadRequestParamsError(c, "USER ID IS MISSING", "/users/:id")
		return
	}

	parsedUserId, err := uuid.Parse(userId)

	if err != nil {
		helpers.BadRequestParamsError(c, "USER ID IS NOT OF TYPE UUID", "/users/:id")
		return
	}

	userGetItemInput := &dynamodb.GetItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", parsedUserId)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
	}

	userData, err := services.DynamoDB.GetItem(context.TODO(), userGetItemInput)

	if err != nil {
		helpers.NetworkError(c, "DYNAMO DB GET FAILED FOR USER", "/users/:id")
		return
	}

	if userData.Item == nil {
		helpers.NotFoundError(c, "USER NOT FOUND", "/users/me")
		return
	}

	var userMapped User

	err = attributevalue.UnmarshalMap(userData.Item, &userMapped)

	if err != nil {
		helpers.NetworkError(c, "FAILED TO UNMARSHAL USER MAP", "/users/:id")
		return
	}

	if userMapped.Settings.PublicProfile == false {
		c.JSON(200, gin.H{
			"success": true,
			"public":  false,
			"user":    nil,
		})
	} else {
		c.JSON(200, gin.H{
			"success": true,
			"public":  true,
			"user":    userMapped,
		})
	}
}

// type UserProfileJSON struct {
// 	Profile struct {
// 		DisplayName *string `json:"displayName"`
// 	} `json:"profile"`
// }

type UserProfileJSON struct {
	DisplayName *string `json:"displayName"`
}

type UnmarshalProfile struct {
	Profile struct {
		AvatarUrl        *string `dynamodbav:"avatarUrl" json:"avatarUrl"`
		ReviewCount      int     `dynamodbav:"reviewCount" json:"reviewCount"`
		DisplayName      string  `dynamodbav:"displayName" json:"displayName"`
		TotalSavedPlaces int     `dynamodbav:"totalSavedPlaces" json:"totalSavedPlaces"`
	} `dynamodbav:"profile" json:"profile"`
}

func UpdateUserProfile(c *gin.Context) {
	var updateUserProfileJSON UserProfileJSON

	err := c.ShouldBindJSON(&updateUserProfileJSON)

	if err == io.EOF {
		c.JSON(200, gin.H{
			"success": true,
			"message": "Nothing New To Update",
		})
		return
	}

	if err != nil {
		helpers.BadRequestBodyError(c, "ERROR BINDING BODY", "/users/me")
		return
	}

	user, ok := c.Get("user")

	if !ok {
		helpers.AuthError(c, "PROPERTY USER IS MISSING IN CONTEXT", "/users/me")
		return
	}

	typedUser, ok := user.(models.UserModel)

	if !ok {
		helpers.NetworkError(c, "PROPERTY USER IS NOT OF TYPE UserModel", "/users/me")
		return
	}

	updateExpression := ""
	expressionAttributeValues := map[string]types.AttributeValue{}

	if updateUserProfileJSON.DisplayName != nil {
		if updateExpression == "" {
			updateExpression = fmt.Sprint("SET profile.displayName = :newDisplayName")
		} else {
			updateExpression = fmt.Sprintf("%s, SET profile.displayName = :newDisplayName", updateExpression)
		}

		expressionAttributeValues[":newDisplayName"] = &types.AttributeValueMemberS{Value: *updateUserProfileJSON.DisplayName}
	}

	if updateExpression == "" {
		c.JSON(200, gin.H{
			"success": true,
			"message": "Nothing New To Update",
		})
		return
	}

	updateProfileInput := &dynamodb.UpdateItemInput{
		TableName: aws.String("AHCOM"),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("USER#%s", typedUser.ID)},
			"SK": &types.AttributeValueMemberS{Value: "METADATA"},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues:              "UPDATED_NEW",
	}

	updateRes, err := services.DynamoDB.UpdateItem(context.TODO(), updateProfileInput)

	if err != nil {
		helpers.NetworkError(c, "ERROR UPDATING USER PROFILE", "/users/me/profile")
		return
	}

	var unmarshalledProfile UnmarshalProfile
	err = attributevalue.UnmarshalMap(updateRes.Attributes, &unmarshalledProfile)

	if err != nil {
		helpers.NetworkError(c, "ERROR UNMARSHALLING UPDATE RESPONSE", "/users/me/profile")
		return
	}

	c.JSON(200, gin.H{
		"success":        true,
		"updatedProfile": unmarshalledProfile,
	})
}
