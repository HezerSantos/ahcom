import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv'

dotenv.config()

const dynamodbClient = new DynamoDBClient({
    endpoint: "http://localhost:8000"
})

export default dynamodbClient