#!/bin/bash 

# kill previous process if exists
fuser 7000/tcp -k

# start new session
node --inspect=7000 server.js
