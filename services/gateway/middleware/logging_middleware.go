package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

type Loggger struct {
	TimeStamp        string
	RequestIP        string
	UserAgent        string
	Host             string
	RequestPath      string
	RequestMethod    string
	ResponseDuration int64
	StatusCode       int
	Message          *string
	Referer          string
	Origin           string
}

func printLog(l Loggger) {
	statusColor := "32" // Green
	if l.StatusCode >= 400 {
		statusColor = "31" // Red
	}

	// \033[...m are ANSI color codes
	fmt.Printf("--- RESPONSE ---\n")
	fmt.Printf("TIME:       %s\n", l.TimeStamp)
	fmt.Printf("STATUS:     \033[%sm%d\033[0m\n", statusColor, l.StatusCode)
	fmt.Printf("METHOD:     %s\n", l.RequestMethod)
	fmt.Printf("HOST:       %s\n", l.Host)
	fmt.Printf("PATH:       %s\n", l.RequestPath)
	fmt.Printf("DURATION:   %dms\n", l.ResponseDuration)
	fmt.Printf("IP:         %s\n", l.RequestIP)
	fmt.Printf("USER-AGENT: %s\n", l.UserAgent)
	// fmt.Printf("REFERER:    %s\n", l.Referer)
	// fmt.Printf("ORIGIN:     %s\n", l.Origin)
	if l.Message != nil {
		fmt.Printf("Message:    %s\n", *l.Message)
	}
	fmt.Printf("----------------\n\n")
}

func LoggingMiddleware(c *gin.Context) {
	requestIp := c.RemoteIP()
	userAgent := c.Request.UserAgent()
	requestPath := c.Request.RequestURI
	requestHost := c.Request.Host
	requestMethod := c.Request.Method
	startTme := time.Now()
	c.Next()

	responseDuration := time.Since(startTme)

	var typedErrorMessage *string
	errorMessage, ok := c.Get("errorMessage")

	if !ok {
		typedErrorMessage = nil
	} else {
		stringErrorMessage, ok := errorMessage.(string)
		if !ok {
			typedErrorMessage = nil
		} else {
			typedErrorMessage = &stringErrorMessage
		}
	}
	refererDomain := c.Request.Header.Get("Referer")
	originDomain := c.Request.Header.Get("Origin")

	newLog := Loggger{
		TimeStamp:        time.Now().Format(time.RFC3339),
		Host:             requestHost,
		RequestIP:        requestIp,
		UserAgent:        userAgent,
		RequestPath:      requestPath,
		RequestMethod:    requestMethod,
		ResponseDuration: responseDuration.Milliseconds(),
		StatusCode:       c.Writer.Status(),
		Message:          typedErrorMessage,
		Referer:          refererDomain,
		Origin:           originDomain,
	}

	printLog(newLog)
}
