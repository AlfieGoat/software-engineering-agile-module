#!/bin/sh

npx prisma db push

# Run CMD from Dockerfile
exec "$@"