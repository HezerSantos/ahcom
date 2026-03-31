package services

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

var DynamoDB *dynamodb.Client

func RegisterDynamoDBClient() {
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithBaseEndpoint("http://dynamodb:8000"),
	)

	if err != nil {
		panic("FAILED TO PROCESS AWS DYNAMODB")
	}

	fmt.Println("LOADING DYNAMODB CLIENT...")
	DynamoDB = dynamodb.NewFromConfig(cfg)
	fmt.Println("COMPLETED LOADING DYNAMODB CLIENT...")
}
