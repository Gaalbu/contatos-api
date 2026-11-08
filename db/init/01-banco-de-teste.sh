docker_process_sql <<SQL
CREATE DATABASE IF NOT EXISTS contatos_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON contatos_test.* TO '${MYSQL_USER}'@'%';
SQL
