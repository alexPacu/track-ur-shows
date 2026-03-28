FROM postgres:16-alpine

# defaults
ENV POSTGRES_USER=${POSTGRES_USER:-postgres}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
ENV POSTGRES_DB=${POSTGRES_DB:-track_ur_shows}

# initialization scripts
COPY ../../db/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY ../../db/seed.sql /docker-entrypoint-initdb.d/02-seed.sql

# postgreSQL port
EXPOSE 5432
