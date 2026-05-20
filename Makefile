SHELL := /bin/bash
VENV  := venv/bin
NVM   := export NVM_DIR="$$HOME/.nvm" && [ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && nvm use 20 --silent

.DEFAULT_GOAL := help

# ── Help ───────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  IDRAKIYA — Online Courses Platform"
	@echo ""
	@echo "  Setup"
	@echo "    make setup          Full first-time setup (env + deps + db + migrate)"
	@echo "    make install        Install backend and frontend dependencies"
	@echo "    make env            Copy .env.example → .env (skip if exists)"
	@echo ""
	@echo "  Dev servers"
	@echo "    make dev            Start backend + frontend together (split output)"
	@echo "    make backend        Start FastAPI dev server only"
	@echo "    make frontend       Start Vite dev server only"
	@echo ""
	@echo "  Database"
	@echo "    make db-up          Start Postgres + Redis via Docker"
	@echo "    make db-down        Stop Docker services"
	@echo "    make migrate        Apply all pending Alembic migrations"
	@echo "    make migration m=   Create a new migration  (m=\"describe change\")"
	@echo "    make downgrade      Roll back the last migration"
	@echo ""
	@echo "  Build & deploy"
	@echo "    make build          Build the frontend for production"
	@echo "    make docker-up      Build and start all services via docker compose"
	@echo "    make docker-down    Stop all docker compose services"
	@echo "    make docker-logs    Tail logs from all docker compose services"
	@echo ""
	@echo "  Utilities"
	@echo "    make clean          Remove venv, node_modules, and build artefacts"
	@echo "    make secret         Generate a secure SECRET_KEY value"
	@echo ""

# ── Setup ──────────────────────────────────────────────────────────────────────
.PHONY: setup
setup: env install db-up
	@sleep 3
	@$(MAKE) migrate
	@echo ""
	@echo "  Setup complete. Run 'make dev' to start."
	@echo ""

.PHONY: env
env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "  .env created from .env.example — fill in your SECRET_KEY and Stripe keys."; \
	else \
		echo "  .env already exists, skipping."; \
	fi

.PHONY: install
install: install-backend install-frontend

.PHONY: install-backend
install-backend:
	@echo "  Installing backend dependencies…"
	@python3 -m venv venv
	@$(VENV)/pip install -r requirements.txt --quiet
	@echo "  Backend dependencies installed."

.PHONY: install-frontend
install-frontend:
	@echo "  Installing frontend dependencies…"
	@$(NVM) && cd frontend && npm install --silent
	@echo "  Frontend dependencies installed."

# ── Dev servers ────────────────────────────────────────────────────────────────
.PHONY: dev
dev:
	@echo "  Starting backend on :8000 and frontend on :3000 …"
	@trap 'kill 0' INT; \
	$(VENV)/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | sed 's/^/[API] /' & \
	( $(NVM) && cd frontend && npm run dev 2>&1 | sed 's/^/[UI]  /' ) & \
	wait

.PHONY: backend
backend:
	@echo "  Starting FastAPI on http://localhost:8000 …"
	@$(VENV)/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: frontend
frontend:
	@echo "  Starting Vite on http://localhost:3000 …"
	@$(NVM) && cd frontend && npm run dev

# ── Database ───────────────────────────────────────────────────────────────────
.PHONY: db-up
db-up:
	@echo "  Starting Postgres + Redis…"
	@docker compose up db redis -d
	@echo "  Waiting for Postgres to be ready…"
	@until docker compose exec db pg_isready -U idrakiya -q 2>/dev/null; do sleep 1; done
	@echo "  Database is ready."

.PHONY: db-down
db-down:
	@docker compose stop db redis

.PHONY: migrate
migrate:
	@echo "  Running migrations…"
	@$(VENV)/alembic upgrade head
	@echo "  Migrations applied."

.PHONY: migration
migration:
	@[ -n "$(m)" ] || (echo "  Usage: make migration m=\"describe your change\"" && exit 1)
	@$(VENV)/alembic revision --autogenerate -m "$(m)"

.PHONY: downgrade
downgrade:
	@$(VENV)/alembic downgrade -1

# ── Build & deploy ─────────────────────────────────────────────────────────────
.PHONY: build
build:
	@echo "  Building frontend for production…"
	@$(NVM) && cd frontend && npm run build
	@echo "  Build complete → frontend/dist/"

.PHONY: docker-up
docker-up:
	@docker compose up --build -d
	@echo "  All services started. API → http://localhost:8000/api/docs"

.PHONY: docker-down
docker-down:
	@docker compose down

.PHONY: docker-logs
docker-logs:
	@docker compose logs -f

# ── Utilities ──────────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	@echo "  Cleaning up…"
	@rm -rf venv frontend/node_modules frontend/dist __pycache__ .pytest_cache
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "  Done."

.PHONY: secret
secret:
	@python3 -c "import secrets; print(secrets.token_hex(64))"
