const { DynamoDBClient, CreateTableCommand, UpdateTableCommand } = require("@aws-sdk/client-dynamodb")
const dotenv = require('dotenv')

dotenv.config()
const client = new DynamoDBClient({region: "us-east-1", endpoint: "http://localhost:8000"})
const initTable = async() => {
    
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

    try{
        await client.send(createTableCommand)
    } catch(e) {
        console.error(e)
    }
} 

// initTable()

const updateTable = async() => {
    console.log("UPDATING TABLE")
    const updateTable = {
        AttributeDefinitions: [
            {
                AttributeName: "PK",
                AttributeType: "S"
            },
            {
                AttributeName: "SK",
                AttributeType: "S"
            },
            {
                AttributeName: "GSI1_PK",
                AttributeType: "S"
            },
            {
                AttributeName: "GSI1_SK",
                AttributeType: "S"
            }
        ],
        TableName: "AHCOM",
        GlobalSecondaryIndexUpdates: [
        {
            Create: {
                IndexName: "GSI1-index",
                KeySchema: [
                    { AttributeName: "GSI1_PK", KeyType: "HASH" },
                    { AttributeName: "GSI1_SK", KeyType: "RANGE" }
                ],
                Projection: { ProjectionType: "ALL" }
            }
        }
    ]
    }

    const res = await client.send(new UpdateTableCommand(updateTable))
    console.log("UPDATED TABLE")
}

updateTable()