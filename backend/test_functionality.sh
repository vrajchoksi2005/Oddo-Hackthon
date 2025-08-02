#!/bin/bash

# CivicTrack Backend Functionality Verification Script
echo "🧪 CivicTrack Backend Functionality Verification"
echo "================================================"

BASE_URL="http://localhost:3000/api"
HEALTH_URL="http://localhost:3000/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_status="$3"
    
    echo -n "Testing $test_name... "
    
    response=$(eval "$curl_command" 2>/dev/null)
    status=$?
    
    if [ $status -eq 0 ]; then
        if echo "$response" | grep -q "success.*true" 2>/dev/null; then
            echo -e "${GREEN}✅ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAILED (Response issue)${NC}"
            echo "Response: $response"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ FAILED (Connection issue)${NC}"
        ((FAILED++))
    fi
}

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing Health Check${NC}"
run_test "Health Endpoint" "curl -s $HEALTH_URL" "200"

# Test 2: API Root
echo -e "\n${YELLOW}2. Testing API Root${NC}"
run_test "API Root" "curl -s http://localhost:3000/" "200"

# Test 3: User Registration
echo -e "\n${YELLOW}3. Testing Authentication${NC}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_USERNAME="testuser${TIMESTAMP}"
REGISTER_DATA="{\"username\":\"$TEST_USERNAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"Test@123\",\"phone\":\"9876543210\"}"
run_test "User Registration" "curl -s -X POST -H 'Content-Type: application/json' -d '$REGISTER_DATA' $BASE_URL/auth/register" "201"

# Test 4: User Login
LOGIN_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"Test@123\"}"
login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$BASE_URL/auth/login" 2>/dev/null)
if echo "$login_response" | grep -q "token" 2>/dev/null; then
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "Login Test: ${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "Login Test: ${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Test 5: Protected Route (Get Profile)
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${YELLOW}4. Testing Protected Routes${NC}"
    run_test "Get Profile" "curl -s -H 'Authorization: Bearer $TOKEN' $BASE_URL/auth/profile" "200"
fi

# Test 6: Issue Creation (Anonymous)
echo -e "\n${YELLOW}5. Testing Issue Management${NC}"
ISSUE_DATA='{"title":"Test Pothole","description":"Test description for pothole","category":"Road","coordinates":[72.5714,23.0225],"isAnonymous":true}'
run_test "Create Anonymous Issue" "curl -s -X POST -H 'Content-Type: application/json' -d '$ISSUE_DATA' $BASE_URL/issues" "201"

# Test 7: Get Issues
run_test "Get Issues" "curl -s $BASE_URL/issues" "200"

# Test 8: Get Nearby Issues
run_test "Get Nearby Issues" "curl -s '$BASE_URL/issues/nearby?lat=23.0225&lng=72.5714&distance=5000'" "200"

# Test 9: Database Connection Test
echo -e "\n${YELLOW}6. Testing Database Connectivity${NC}"
echo -n "Testing MongoDB Connection... "
if curl -s "$HEALTH_URL" | grep -q "running" 2>/dev/null; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "==============="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! CivicTrack backend is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the server logs.${NC}"
    exit 1
fi
