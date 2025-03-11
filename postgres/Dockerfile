FROM postgres:15

COPY conf/init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres"]
