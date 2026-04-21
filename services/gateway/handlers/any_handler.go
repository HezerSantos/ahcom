package handlers

import (
	"fmt"
	"gateway/helpers"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

var hopByHop = []string{
	"Connection",
	"Keep-Alive",
	"Proxy-Authenticate",
	"Proxy-Authorization",
	"Te",
	"Trailers",
	"Transfer-Encoding",
	"Upgrade",
}

var microServiceMap = map[string]string{
	"content":  "http://content:3001",
	"identity": "http://identity:3000",
}

func parseMicroServiceUrl(path string) *string {

	splitPaths := strings.Split(path[1:], "/")
	if len(splitPaths) <= 2 {
		return nil
	}

	if splitPaths[2] == "" {
		return nil
	}

	service := splitPaths[1]
	serviceUrl, ok := microServiceMap[service]

	if !ok {
		return nil
	}

	microServicePath := strings.Join(splitPaths[2:], "/")
	finalUrl := fmt.Sprint(serviceUrl, "/", service, "/", microServicePath)
	return &finalUrl
}
func AnyHandler(c *gin.Context) {
	microServiceUrl := parseMicroServiceUrl(c.Request.URL.Path)
	if microServiceUrl == nil {
		helpers.NotFoundError(c, "PATH NOT FOUND", "/api")
		return
	}

	incomingRequestHeaders := c.Request.Header
	incomingRequestBody := c.Request.Body

	newRequest, err := http.NewRequest(c.Request.Method, *microServiceUrl, incomingRequestBody)

	if err != nil {
		helpers.NetworkError(c, "ERROR CREATING PROXY REQUEST", "/api")
		return
	}

	for k, v := range incomingRequestHeaders {
		isHop := false
		for _, h := range hopByHop {
			if strings.EqualFold(k, h) {
				isHop = true
				break
			}
		}

		if !isHop {
			newRequest.Header[k] = v
		}
	}
	userIP := c.RemoteIP() //MAKE SURE TO LATER CHECK IF USER IP IS CLOUDFLARE OR USER
	newRequest.Header.Set("X-Forwarded-For", userIP)
	newRequest.Header.Set("X-Real-IP", userIP)

	microServiceResponse, err := http.DefaultClient.Do(newRequest)

	if err != nil {
		helpers.NetworkError(c, "ERROR SENDING RESPONSE", "/api")
		return
	}
	defer microServiceResponse.Body.Close()
	microServiceResponseHeaders := microServiceResponse.Header
	cResponseHeaders := c.Writer.Header()
	for k, v := range microServiceResponseHeaders {
		cResponseHeaders[k] = v
	}

	cResponseBodyBytes, err := io.ReadAll(microServiceResponse.Body)

	if err != nil {
		helpers.NetworkError(c, "ERROR READING BODY BYTES", "/api")
		return
	}

	c.Writer.WriteHeader(microServiceResponse.StatusCode)
	c.Writer.Write(cResponseBodyBytes)
}
