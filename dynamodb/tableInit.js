const { DynamoDBClient, CreateTableCommand, AttributeDefinition$, BillingMode } = require("@aws-sdk/client-dynamodb")

const initTable = () => {
    const client = new DynamoDBClient({region: "us-east-1", endpoint: "http://localhost:8000"})
    const params = {
        AttributeDefinitions: [
            {
                AttributeName: "PK",
                AttributeType: "S"
            },
            {
                AttributeName: "SK",
                AttributeType: "S"
            }
        ],
        TableName: "AHCOM",
        KeySchema: [
            {
                AttributeName: "PK",
                KeyType: "HASH"
            },
            {
                AttributeName: "SK",
                KeyType: "RANGE"
            }
        ],
        BillingMode: "PAY_PER_REQUEST"
    }
    const createTableCommand = new CreateTableCommand(params)
}