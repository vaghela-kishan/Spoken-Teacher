# ============================================================
#  Developer convenience commands
# ============================================================
.PHONY: help up down logs be fe migrate revision test lint fmt seed

help:            ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n",$$1,$$2}'

up:              ## Start full stack (docker)
	docker compose up --build

down:            ## Stop full stack
	docker compose down

logs:            ## Tail all logs
	docker compose logs -f

be:              ## Run backend locally
	cd backend && uvicorn app.main:app --reload --port 8000

fe:              ## Run frontend locally
	cd frontend && npm run dev

migrate:         ## Apply DB migrations
	cd backend && alembic upgrade head

revision:        ## Create a new migration (use m="message")
	cd backend && alembic revision --autogenerate -m "$(m)"

seed:            ## Seed demo data (admin + sample user)
	cd backend && python -m app.scripts.seed

test:            ## Run backend tests
	cd backend && pytest -q

lint:            ## Lint everything
	cd backend && ruff check app && cd ../frontend && npm run lint

fmt:             ## Format everything
	cd backend && ruff format app && cd ../frontend && npm run format
