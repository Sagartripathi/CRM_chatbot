#!/usr/bin/env bash
# ============================================================================
# MongoDB with Authentication Setup Script
# ============================================================================
# This script runs MongoDB with authentication enabled in Docker
# 
# Usage:
#   ./backend/run_mongo_auth.sh
#   ./backend/run_mongo_auth.sh custom-name mongo:7.0 27018 myuser mypass
#
# Arguments (all optional):
#   1. Container name (default: mongo-auth)
#   2. MongoDB image (default: mongo:6.0)
#   3. Host port (default: 27017)
#   4. Root username (default: admin)
#   5. Root password (default: password)
# ============================================================================

set -euo pipefail

# Configuration with defaults
NAME=${1:-mongo-auth}
IMAGE=${2:-mongo:6.0}
HOST_PORT=${3:-27017}
ROOT_USER=${4:-admin}
ROOT_PASSWORD=${5:-password}
FORCE_REMOVE=${FORCE_REMOVE:-0}

echo "============================================================================"
echo "MongoDB with Authentication"
echo "============================================================================"
echo "Container: ${NAME}"
echo "Image: ${IMAGE}"
echo "Port: ${HOST_PORT}"
echo "Username: ${ROOT_USER}"
echo "Password: ${ROOT_PASSWORD}"
echo "============================================================================"
echo

# Helper: check if a host port is already listening
port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${HOST_PORT}" -sTCP:LISTEN -P -n >/dev/null 2>&1 && return 0 || return 1
  else
    if command -v netstat >/dev/null 2>&1; then
      netstat -an | grep LISTEN | grep -q "\.${HOST_PORT} " && return 0 || return 1
    fi
    return 1
  fi
}

# If container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${NAME}$"; then
  STATUS=$(docker inspect -f '{{.State.Status}}' "${NAME}" 2>/dev/null || echo "unknown")
  if [ "${STATUS}" = "running" ]; then
    echo "✅ Container '${NAME}' is already running."
    echo
    echo "Connection string:"
    echo "mongodb://${ROOT_USER}:${ROOT_PASSWORD}@localhost:${HOST_PORT}"
    echo
    echo "Tailing logs (ctrl+C to stop):"
    docker logs -f "${NAME}"
    exit 0
  else
    echo "⚠️  Container '${NAME}' exists with status '${STATUS}'."
    if [ "${FORCE_REMOVE}" = "1" ]; then
      echo "🗑️  FORCE_REMOVE=1 — removing and recreating container '${NAME}'."
      docker rm -f "${NAME}"
    else
      echo "▶️  Starting existing container '${NAME}'..."
      docker start "${NAME}"
      echo
      echo "Connection string:"
      echo "mongodb://${ROOT_USER}:${ROOT_PASSWORD}@localhost:${HOST_PORT}"
      echo
      echo "Tailing logs (ctrl+C to stop):"
      docker logs -f "${NAME}"
      exit 0
    fi
  fi
fi

# Check if host port is free
if port_in_use; then
  echo "❌ ERROR: Host port ${HOST_PORT} appears to be in use."
  echo
  echo "Containers using port ${HOST_PORT}:"
  docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}' | grep "${HOST_PORT}" || true
  echo
  echo "Options to resolve:"
  echo "  1) Stop/remove the existing container:"
  echo "     docker rm -f <container-name>"
  echo "  2) Use a different port:"
  echo "     ./backend/run_mongo_auth.sh ${NAME} ${IMAGE} 27018"
  echo "  3) Force remove existing '${NAME}' container:"
  echo "     FORCE_REMOVE=1 ./backend/run_mongo_auth.sh"
  exit 1
fi

# Run new container with authentication
echo "🚀 Creating MongoDB container with authentication..."
docker run -d \
  --name "${NAME}" \
  -p "${HOST_PORT}":27017 \
  -e MONGO_INITDB_ROOT_USERNAME="${ROOT_USER}" \
  -e MONGO_INITDB_ROOT_PASSWORD="${ROOT_PASSWORD}" \
  "${IMAGE}"

echo "✅ Container started successfully!"
echo
echo "============================================================================"
echo "📝 Connection Details"
echo "============================================================================"
echo "Host: localhost"
echo "Port: ${HOST_PORT}"
echo "Username: ${ROOT_USER}"
echo "Password: ${ROOT_PASSWORD}"
echo
echo "Connection String:"
echo "mongodb://${ROOT_USER}:${ROOT_PASSWORD}@localhost:${HOST_PORT}"
echo
echo "For your .env file:"
echo "MONGO_URL=mongodb://${ROOT_USER}:${ROOT_PASSWORD}@localhost:${HOST_PORT}"
echo "============================================================================"
echo
echo "Tailing logs (ctrl+C to stop):"
docker logs -f "${NAME}"
