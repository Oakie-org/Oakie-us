# MySQL init scripts

Place `.sql` or `.sh` files in this directory to customize the database on container start.

- Files ending in `.sql` run in lexical order with the `dada_island` schema pre-created.
- Use this to seed reference data (tags, demo users) or adjust permissions for local development.
