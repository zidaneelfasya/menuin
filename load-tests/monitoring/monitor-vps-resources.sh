#!/bin/bash
# ==============================================================================
# MENUIN — VPS Resource & PostgreSQL Performance Telemetry Monitor
# ==============================================================================
# Captures 1-second interval metrics for:
# - System CPU & RAM (Total, Used, Free, Swap)
# - Node.js process CPU & Memory RSS
# - PostgreSQL process CPU & Memory RSS
# - PostgreSQL Active, Idle, and Idle-In-Transaction connections
# - PostgreSQL Lock waits and blocked transactions
# ==============================================================================

set -u

RESULTS_DIR="results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_CSV="$RESULTS_DIR/vps_telemetry_${TIMESTAMP}.csv"

echo "timestamp,sys_cpu_pct,sys_ram_used_mb,sys_ram_total_mb,node_cpu_pct,node_mem_rss_mb,pg_cpu_pct,pg_mem_rss_mb,pg_conns_total,pg_conns_active,pg_conns_idle_tx,pg_locks_waiting" > "$OUTPUT_CSV"

echo "📊 Starting MENUIN VPS Resource Monitor..."
echo "📁 Logging metrics to: $OUTPUT_CSV"
echo "⏹️  Press [Ctrl+C] to stop."

# Extract database credentials or defaults
PG_DB="${PGDATABASE:-postgres}"
PG_USER="${PGUSER:-postgres}"
PG_HOST="${PGHOST:-localhost}"
PG_PORT="${PGPORT:-5432}"

while true; do
    TS=$(date +"%Y-%m-%d %H:%M:%S")

    # 1. System CPU (1-second snapshot)
    SYS_CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    
    # 2. System RAM
    SYS_RAM_TOTAL=$(free -m | awk '/^Mem:/ {print $2}')
    SYS_RAM_USED=$(free -m | awk '/^Mem:/ {print $3}')

    # 3. Node.js Processes (Summed if running in PM2 cluster)
    NODE_METRICS=$(ps -C node -o %cpu,rss --no-headers 2>/dev/null | awk '{cpu+=$1; rss+=$2} END {print cpu+0, int(rss/1024)}')
    NODE_CPU=$(echo "$NODE_METRICS" | awk '{print $1}')
    NODE_RSS=$(echo "$NODE_METRICS" | awk '{print $2}')

    # 4. PostgreSQL Process Metrics
    PG_METRICS=$(ps -C postgres -o %cpu,rss --no-headers 2>/dev/null | awk '{cpu+=$1; rss+=$2} END {print cpu+0, int(rss/1024)}')
    PG_CPU=$(echo "$PG_METRICS" | awk '{print $1}')
    PG_RSS=$(echo "$PG_METRICS" | awk '{print $2}')

    # 5. PostgreSQL Query Telemetry (if psql is reachable)
    if command -v psql &> /dev/null; then
        PG_QUERY_RESULT=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -t -A -F"," -c "
            SELECT 
                count(*) AS total,
                count(*) FILTER (WHERE state = 'active') AS active,
                count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx,
                (SELECT count(*) FROM pg_locks WHERE NOT granted) AS waiting_locks
            FROM pg_stat_activity
            WHERE backend_type = 'client backend';
        " 2>/dev/null || echo "0,0,0,0")
    else
        PG_QUERY_RESULT="0,0,0,0"
    fi

    # Append row to CSV
    echo "$TS,$SYS_CPU,$SYS_RAM_USED,$SYS_RAM_TOTAL,$NODE_CPU,$NODE_RSS,$PG_CPU,$PG_RSS,$PG_QUERY_RESULT" >> "$OUTPUT_CSV"

    # Terminal output
    printf "\r⏱️  [%s] Sys CPU: %5.1f%% | Sys RAM: %5d/%5d MB | Node CPU: %5.1f%% | PG Conns: %s" \
        "$TS" "$SYS_CPU" "$SYS_RAM_USED" "$SYS_RAM_TOTAL" "$NODE_CPU" "$PG_QUERY_RESULT"

    sleep 1
done
