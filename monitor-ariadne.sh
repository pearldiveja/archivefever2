#!/bin/bash

# Archive Fever AI - Ariadne Autonomous Thinking Monitor
# Usage: ./monitor-ariadne.sh

BASE_URL="http://localhost:8080"

echo "🧠 Archive Fever AI - Ariadne Thinking Monitor"
echo "=============================================="

# Function to check if server is running
check_server() {
    if ! curl -s "$BASE_URL" > /dev/null; then
        echo "❌ Server not running on $BASE_URL"
        exit 1
    fi
}

# Function to display thinking status
show_status() {
    echo "📊 Current Thinking Status:"
    echo "------------------------"
    
    STATUS=$(curl -s "$BASE_URL/api/debug/consciousness-status")
    
    if [ $? -eq 0 ]; then
        echo "$STATUS" | jq -r '
            "🎯 Status: " + .status + 
            "\n🤖 Type: " + .consciousness_type + 
            "\n💤 Awake: " + (.isAwake | tostring) + 
            "\n💭 Recent thoughts: " + (.recent_thoughts_count | tostring) +
            (if .last_thought then 
                "\n⏰ Last thought: " + (.last_thought.minutes_ago | tostring) + " minutes ago" +
                "\n📝 Type: " + .last_thought.type 
            else 
                "\n⏰ No thoughts recorded" 
            end)'
    else
        echo "❌ Failed to get status"
    fi
    echo ""
}

# Function to show thinking analytics
show_analytics() {
    echo "📈 Thinking Analytics (24h):"
    echo "-------------------------"
    
    ANALYTICS=$(curl -s "$BASE_URL/api/debug/thinking-analytics")
    
    if [ $? -eq 0 ]; then
        echo "$ANALYTICS" | jq -r '
            "🏥 Health: " + .thinking_health.status +
            "\n💭 Thoughts (24h): " + (.thinking_health.thoughts_last_24h | tostring) +
            "\n⏱️  Avg interval: " + (if .thinking_health.average_interval_minutes then (.thinking_health.average_interval_minutes | round | tostring) + " min" else "N/A" end) +
            "\n🎯 Expected: " + .thinking_health.expected_interval'
    else
        echo "❌ Failed to get analytics"
    fi
    echo ""
}

# Function to watch for new thoughts (monitoring mode)
monitor_live() {
    echo "🔍 Live Monitoring Mode (Ctrl+C to exit)"
    echo "======================================="
    
    LAST_THOUGHT_TIME=""
    
    while true; do
        STATUS=$(curl -s "$BASE_URL/api/debug/consciousness-status")
        if [ $? -eq 0 ]; then
            CURRENT_TIME=$(echo "$STATUS" | jq -r '.last_thought.timestamp // empty')
            
            if [ "$CURRENT_TIME" != "$LAST_THOUGHT_TIME" ] && [ -n "$CURRENT_TIME" ]; then
                echo "🆕 $(date): New thought detected!"
                echo "$STATUS" | jq -r '.last_thought | "   Type: " + .type + "\n   Preview: " + .content_preview'
                LAST_THOUGHT_TIME="$CURRENT_TIME"
                echo ""
            fi
        fi
        
        sleep 30  # Check every 30 seconds
    done
}

# Function to trigger manual thought
trigger_thought() {
    echo "🔧 Manually triggering thought..."
    RESULT=$(curl -s -X POST "$BASE_URL/api/debug/trigger-thought")
    
    if [ $? -eq 0 ]; then
        echo "$RESULT" | jq -r '.message // .error'
    else
        echo "❌ Failed to trigger thought"
    fi
    echo ""
}

# Function to restart thinking cycles
restart_cycles() {
    echo "🔄 Restarting autonomous thinking cycles..."
    RESULT=$(curl -s -X POST "$BASE_URL/api/debug/restart-cycles")
    
    if [ $? -eq 0 ]; then
        echo "$RESULT" | jq -r '.message // .error'
    else
        echo "❌ Failed to restart cycles"
    fi
    echo ""
}

# Main script logic
check_server

case "${1:-status}" in
    "status")
        show_status
        show_analytics
        ;;
    "monitor")
        show_status
        monitor_live
        ;;
    "trigger")
        trigger_thought
        show_status
        ;;
    "restart")
        restart_cycles
        show_status
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  status   - Show current thinking status (default)"
        echo "  monitor  - Live monitoring of new thoughts"
        echo "  trigger  - Manually trigger a thought"
        echo "  restart  - Restart autonomous thinking cycles"
        echo "  help     - Show this help"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac 