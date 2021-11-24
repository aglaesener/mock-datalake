FROM postgres:14.1-alpine

ENV POSTGRES_USER lakeuser
ENV POSTGRES_PASSWORD sys
ENV POSTGRES_DB medas_datalake

# in container: psql medas_datalake -U lakeuser

ADD set_db.sql /docker-entrypoint-initdb.d/

# Expose network port:
EXPOSE 5432

# create image: docker build -t mock-datalake-db:1.0 .