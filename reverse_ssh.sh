#!/bin/bash

# trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
source $HOME/credentials/credentials

if [ -z "$1" ] && [ -z "$2" ]; then
    LOCAL_PORT=22
    REMOTE_PORT=2222
else
    LOCAL_PORT=$1
    REMOTE_PORT=$2
fi

echo "Setting local port to $LOCAL_PORT and remote port to $REMOTE_PORT"
echo "Remote host: $MODEL_SUPERVISOR_HOST"
MONITOR_PORT=$(( ( RANDOM % 16000 )  + 49152 ))

autossh  -N -M $MONITOR_PORT -N -o "PubkeyAuthentication=yes" -o "PasswordAuthentication=no" -i $HOME/credentials/ec2_model_supervisor_key.pem -4 -R $REMOTE_PORT:localhost:$LOCAL_PORT ubuntu@$MODEL_SUPERVISOR_HOST
