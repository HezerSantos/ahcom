FROM golang:1.25.3

WORKDIR /app

COPY go.mod ./
RUN go mod download

RUN go install github.com/air-verse/air@latest
COPY . .

# RUN go build -o server

EXPOSE 3001

CMD ["air"]