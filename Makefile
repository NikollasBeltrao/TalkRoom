DOCKER_COMP = docker compose

build:
	$(DOCKER_COMP) build

up:
	$(DOCKER_COMP) up -d

down:
	$(DOCKER_COMP) down

restart: down up

logs:
	$(DOCKER_COMP) logs -f
