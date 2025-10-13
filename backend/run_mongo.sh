#!/usr/bin/env bash
set -euo pipefail

# Name, image and host port can be overridden:
NAME=${1:-mongo}
IMAGE=${2:-mongo:6.0}
HOST_PORT=${3:-27017}
FORCE_REMOVE=${FORCE_REMOVE:-0}

echo "Using NAME=${NAME} IMAGE=${IMAGE} HOST_PORT=${HOST_PORT}"

# Helper: check if a host port is already listening
port_in_use() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${HOST_PORT}" -sTCP:LISTEN -P -n >/dev/null 2>&1 && return 0 || return 1
  else
    # fallback to netstat for macOS / BSD
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
    echo "Container '${NAME}' is already running."
    echo "Tailing logs (ctrl+C to stop):"
    docker logs -f "${NAME}"
    exit 0
  else
    echo "Container '${NAME}' exists with status '${STATUS}'."
    if [ "${FORCE_REMOVE}" = "1" ]; then
      echo "FORCE_REMOVE=1 set — removing and recreating container '${NAME}'."
      docker rm -f "${NAME}"
    else
      echo "Starting existing container '${NAME}'..."
      docker start "${NAME}"
      echo "Tailing logs (ctrl+C to stop):"
      docker logs -f "${NAME}"
      exit 0
    fi
  fi
fi

# If container does not exist, check if host port is free
if port_in_use; then
  echo "ERROR: Host port ${HOST_PORT} appears to be in use."
  echo "Containers with port mappings (look for ${HOST_PORT}):"
  docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}' | grep "${HOST_PORT}" || true
  echo
  echo "Options to resolve:"
  echo "  1) Start the existing container that uses the port, or remove it:"
  echo "       docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' | grep ${HOST_PORT}"
  echo "       docker rm -f <container-id-or-name>  # careful: removes container"
  echo "  2) Run this script with a different host port, e.g.:"
  echo "       ./backend/run_mongo.sh ${NAME} ${IMAGE} 27018"
  echo "  3) If you want to force remove any existing container named '${NAME}', set env:"
  echo "       FORCE_REMOVE=1 ./backend/run_mongo.sh ${NAME} ${IMAGE} ${HOST_PORT}"
  exit 1
fi

# Run new container
echo "Creating and starting container '${NAME}' mapping host ${HOST_PORT}->27017 ..."
docker run -d --name "${NAME}" -p "${HOST_PORT}":27017 "${IMAGE}"
echo "Container started. Tailing logs (ctrl+C to stop):"
docker logs -f "${NAME}"
