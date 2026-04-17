# AHCOM DOCUMENTATION

## DESCRIPTION

AHCOM is a backend API that provides restaurant discovery, user authentication, and review management. It integrates with the HERE API to fetch nearby restaurant data based on location, while also allowing users to save restaurants and create reviews.

The system is split into two main services:

- **Content Service**: Handles restaurant data, reviews, and saved favorites
- **Identity Service**: Handles user authentication, including registration, login, and logout with JWT-based sessions

The API is designed to support location-based queries, user-generated content, and secure authentication in a structured and scalable way.

# API GUIDE

### Content Service

| METHOD | PATH | DESCRIPTION |
| --- | --- | --- |
| GET | /restaurants?lat&lon | Get restaurants using position from HERE API |
| GET | /restaurants/:id/reviews | Get restaurant reviews by restaurant id (UUID or HERE ID) |
| POST | /restaurants/:id/save | Save restaurant to favorites by restaurant id (HERE ID) |
| POST | /restaurants/:id/reviews | Create review for restaurant by restaurant id (UUID or HERE ID) |
| DELETE | /reviews/:id | Delete review using review id |
---

## Get Restaurants
```http
GET /restaurants?lat=35.22038824078856&lon=-89.77516194987392
```

#### Response
```json
{
    "success":true,
    "message":"Restaurants retrieved successfully",
    "poiResults":{
        "best": [...],
        "explore": [...],
        "quick": [...]
    }
}
```

---

## Get Reviews (UUID)
```http
GET /restaurants/12765292-4fa5-570d-b769-822a344bed36/reviews
```

#### Response
```json
{
    "id":"12765292-4fa5-570d-b769-822a344bed36",
    "message":"Restaurant Reviews Found",
    "restaurantReviews":[
        {
            "id":"REVIEW#019d881f-3e63-76a8-9086-9e6f17fdcc6b",
            "review":"Test with UUID",
            "userId":"019d69af-d764-7765-a787-707d958766dd"
        },
        {
            "id":"REVIEW#019d881e-1f08-7708-a3b1-f183972b7db2",
            "review":"Test with Here Id",
            "userId":"019d69af-d764-7765-a787-707d958766dd"
        }
    ],
    "success":true
}
```

---

## Get Reviews (HERE ID)
```http
GET /restaurants/here:pds:place:276u0vhj-b0bace6448ae4b0fbc1d5e323998a7d2/reviews
```

#### Response
```json
{
    "id":"12765292-4fa5-570d-b769-822a344bed36",
    "message":"Restaurant Reviews Found",
    "restaurantReviews":[
        {
            "id":"REVIEW#019d881f-3e63-76a8-9086-9e6f17fdcc6b",
            "review":"Test with UUID",
            "userId":"019d69af-d764-7765-a787-707d958766dd"
        },
        {
            "id":"REVIEW#019d881e-1f08-7708-a3b1-f183972b7db2",
            "review":"Test with Here Id",
            "userId":"019d69af-d764-7765-a787-707d958766dd"
        }
    ],
    "success":true
}
```

---

## Save Restaurant (HERE ID)
```http
POST /restaurants/here:pds:place:276u0vhj-b0bace6448ae4b0fbc1d5e323998a7d2/save
```

#### Response
```json
{
    "id":"12765292-4fa5-570d-b769-822a344bed36",
    "message":"Hahn Airport has been added to your list",
    "progress":"DYNAMODB Ran",
    "success":true
}
```

---

## Create Review (HERE ID)
```http
POST /restaurants/here:pds:place:276u0vhj-b0bace6448ae4b0fbc1d5e323998a7d2/reviews
```

#### Request Body
```json
{
    "reviewMessage": "I am a new review",
    "rating": 3
}
```

#### Response
```json
{
    "message":"Created Review For Restaurant 12765292-4fa5-570d-b769-822a344bed36",
    "rating":"3",
    "reviewMessage":"I am a new review",
    "success":true
}
```

---

## Create Review (UUID)
```http
POST /restaurants/12765292-4fa5-570d-b769-822a344bed36/reviews
```

#### Request Body
```json
{
    "reviewMessage": "I am a new review",
    "rating": 3
}
```

#### Response
```json
{
    "message":"Created Review For Restaurant 12765292-4fa5-570d-b769-822a344bed36",
    "rating":"3",
    "reviewMessage":"I am a new review",
    "success":true
}
```

---

## Delete Review (UUID)
```http
DELETE /reviews/12765292-4fa5-570d-b769-822a344bed36
```

### Response
```json
{
    "attributes":{...},
    "message":"Review successfully deleted",
    "success":true
}
```

---

## Identity Service

| METHOD | PATH | DESCRIPTION |
| --- | --- | --- |
| POST | /auth/register | Creates a new user |
| POST | /auth/login | Issues JWT to user |
| POST | /auth/logout | Deletes JWT from user |
| GET | /users/me | Gets Current User info |
| GET | /users/:id | Get User By ID |


## Login User
```http
POST /auth/login
```

#### Request Body
```json
{
    "email": "email@email.com",
    "password": "password",
}
```

#### Response
```json
{
    "message": "Login Successful",
    "success": true,
}
```

#### Cookies
```json
{
    "__Secure-auth.access": ...
}
```

---

## Create User
```http
POST /auth/register
```

#### Request Body
```json
{
    "email": "email@email.com",
    "pasword": "password",
    "confirmPassword": "password"
}
```

#### Response
```json
{
    "success": true,
    "message": "USER SUCCESSFULLY CREATED",
    "id": "019d69af-d764-7765-a787-707d958766dd",
    "email": "email@email.com",
}
```

---

## Logout User
```http
POST /auth/logout
```

#### Response
```json
{
    "success": true,
    "message": "User logged out",
}
```

---

## Get Current User Profile & Settings & Info
```http
GET /users/me
```

#### Response
```json
{
    "success":true,
    "user":{
        "email":"tree@email.com",
        "pk":"USER#019d8dba-51eb-7d22-b90e-1c044040f9a9",
        "profile":{
            "avatarUrl":null,
            "displayName":"tree@email.com",
            "reviewCount":0,
            "totalSavedPlaces":0
        },
        "settings":{
            "distanceUnit":"miles",
            "publicProfile":true
        },
        "sk":"METADATA"
    }
}
```

---

## Get User Profile & Settings & Info By ID
```http
GET /users/019d8dba-51eb-7d22-b90e-1c044040f9a9
```

#### Response (Public = `true`)
```json
{
    "success":true,
    "user":{
        "email":"tree@email.com",
        "pk":"USER#019d8dba-51eb-7d22-b90e-1c044040f9a9",
        "profile":{
            "avatarUrl":null,
            "displayName":"tree@email.com",
            "reviewCount":0,
            "totalSavedPlaces":0
        },
        "settings":{
            "distanceUnit":"miles",
            "publicProfile":true
        },
        "sk":"METADATA"
    }
}
```

#### Response (Public = `false`)
```json
{
    "success": true,
    "public":  false,
    "user":    null,
}
```

---

## Update User Profile
```http
PATCH /users/me/profile
```

#### Request Body
```json
{
    "displayName": "sads"
}
```

#### Response (No Data)
```json
{
    "success": true,
    "message": "Nothing New To Update",
}
```

#### Response (Yes Data)
```json
{
    "success":true,
    "updatedProfile":{
        "profile":{
            "avatarUrl":null,
            "displayName":"sads",
            "reviewCount":0,
            "totalSavedPlaces":0
        }
    }
}
```

---

## Update User Settings
```http
PATCH /users/me/settings
```

#### Request Body
```json
{
    "publicProfile": true,
    "distanceUnit": "miles"
}
```

#### Response (No Data)
```json
{
    "success": true,
    "message": "Nothing New To Update",
}
```

#### Response (Yes Data)
```json
{
    "success":true,
    "updatedProfile":{
        "settings":{
            "distanceUnit":"miles",
            "publicProfile":true
        }
    }
}
```

---

# DYNAMODB

## Table: AHCOM

This application uses a single DynamoDB table to store all entities (users, restaurants, reviews, saved items). Data is modeled using composite keys and entity prefixes.

---

## Key Pattern

- PK (Partition Key): `ENTITY#<id>`
- SK (Sort Key): defines type and relationship

---

## Entity Types

## Email (PK=`EMAIL#<userId>`)

All email data is stored under ONE partition key

---

| Item Type | PK | SK | Required Attributes |
| --- | --- | --- | --- |
| Metadata | `EMAIL#<userId>` | `METADATA` | `userId` |

---

### Sort Key Types

- METADATA
    - SK: `METADATA`
    - Description: `Email metadata`
```json
{
  "SK": "METADATA",
  "userId": "019d8dba-51eb-7d22-b90e-1c044040f9a9",
  "PK": "EMAIL#tree@email.com"
}
```
## User (PK=`USER#<userId>`)

All user data is stored under the same partition key

---

| Item Type | PK | SK | Required Attributes |
| --- | --- | --- | --- |
| Metadata | `USER#<userId>` | `METADATA` | `email`, `password` |
| Restaurant | `USER#<userId>` | `RESTAURANT#<restaurantId>` | |

---

### Sort Key Types

- METADATA
    - SK: `METADATA`
    - Description: `User metadata`
```json
{
  "SK": "METADATA",
  "settings": {
    "publicProfile": true,
    "distanceUnit": "miles"
  },
  "password": "$argon2id$v=19$m=65536,t=3,p=2$HQaviOX2dBj1HQHnguPIBA$Jqbf5NA7qEMmO1lueaUXdSZJj1WCZJQjAMnqDlVYE6k",
  "PK": "USER#019d8d55-d4b3-7e2c-b0c8-b20cd04348f2",
  "email": "tree@email.com",
  "profile": {
    "avatarUrl": null,
    "reviewCount": 0,
    "displayName": "tree@email.com",
    "totalSavedPlaces": 0
  }
}
```
- RESTAURANT
    - SK: `RESTAURANT#<restaurantId>`
    - Description: `A restaurant saved by the user`
```json
{
  "SK": "RESTAURANT#12765292-4fa5-570d-b769-822a344bed36",
  "PK": "USER#019d69af-d764-7765-a787-707d958766dd"
}
```

---

## RESTAURANT (PK = `RESTAURANT#<restaurantId>`)

All restaurant data is stored under the same partition key.

---

| Item Type | PK | SK | Required Attributes |
| --- | --- | --- | --- |
| Metadata | `RESTAURANT#<restaurantId>` | `METADATA` | `GSI1_PK`, `GSI1_SK`, `info` |
| Review | `RESTAURANT#<restaurantId>` | `REVIEW#<reviewId>` | `GSI1_PK`, `GSI1_SK`, `GSI2_PK`, `GSI2_SK`, `GSI3_PK`, `GSI3_SK`, `rating`, `review`, `userid` |

--- 

### Sort Key Types

- METADATA
  - SK: `METADATA`
  - Description: Restaurant metadata
```json
{
  "SK": "METADATA",
  "GSI1_SK": "TIMESTAMP#12765292-4fa5-570d-b769-822a344bed36",
  "PK": "RESTAURANT#12765292-4fa5-570d-b769-822a344bed36",
  "GSI1_PK": "HERE#here:pds:place:276u0vhj-b0bace6448ae4b0fbc1d5e323998a7d2",
  "info": {
    "address": "Hahn Airport, 55483 Lautzenhausen, Deutschland",
    "lng": "7.27153",
    "hereId": "here:pds:place:276u0vhj-b0bace6448ae4b0fbc1d5e323998a7d2",
    "name": "Hahn Airport",
    "id": "12765292-4fa5-570d-b769-822a344bed36",
    "categories": [
      "Flughafen"
    ],
    "lat": "49.94802"
  }
}
```
- REVIEW
  - SK: `REVIEW#<reviewId>`
  - Description: A review belonging to the restaurant
```json
{
  "review": "I am a new review",
  "SK": "REVIEW#019d8d20-9f13-76ca-b168-d52b2fab441f",
  "GSI3_SK": "USER#019d69af-d764-7765-a787-707d958766dd",
  "rating": 3,
  "GSI1_SK": "REVIEW#019d8d20-9f13-76ca-b168-d52b2fab441f",
  "PK": "RESTAURANT#12765292-4fa5-570d-b769-822a344bed36",
  "GSI2_SK": "REVIEW#019d8d20-9f13-76ca-b168-d52b2fab441f",
  "GSI2_PK": "USER#019d69af-d764-7765-a787-707d958766dd",
  "GSI3_PK": "REVIEW#019d8d20-9f13-76ca-b168-d52b2fab441f",
  "userId": "019d69af-d764-7765-a787-707d958766dd",
  "GSI1_PK": "REVIEWSHARD#6"
}
```

---

### GSIs

#### HERE ID Query
Used to query Restaurant by HERE ID
- Index Name: GSI1-index (Overloaded)
- GSI1_PK: `HERE#<hereId>`
- GSI1_SK: `TIMESTAMP#<restaurantId (UUIDv7)>`

#### Scope
This GSI only includes RESTAURANT metadata items where:
- PK = `RESTAURANT#<restaurantId>`
- SK = `METADATA`

---

#### Hot Partition Shard Bucket
Used to query ALL reviews and avoid Hot Partition
-Index Name: GSI1-index (Overloaded)
- GSI1_PK: `REVIEWSHARD#<shardNumber>`
- GSI1_SK: `REVIEW#<reviewId>`

#### User Reviews
Used to query ALL reviews by USER Id
- Index Name: GSI2-index
- GSI2_PK: `USER#<userId>`
- GSI2_SK: `REVIEW#<reviewId>`

#### Reviews Verification
Useed to query a SPECIFIC review
- Index Name: GSI3-index
- GSI3_PK: `REVIEW#<reviewId>`
- GSI3_SK: `USER#<userId>`

#### Scope
This GSI only includes RESTAURANT review items where:
- PK = `RESTAURANT#<restaurantId>`
- SK = `REVIEW#<reviewId>`

---