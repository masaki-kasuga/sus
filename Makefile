.PHONY: help install clean lint build test dev docker-dev docker-prod docker-down docker-clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Sustainability IoT Monorepo$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "$(YELLOW)Usage:$(NC)\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

clean: ## Clean build artifacts and dependencies
	@echo "$(RED)Cleaning...$(NC)"
	rm -rf node_modules apps/*/node_modules apps/*/dist apps/dashboard/dist
	@echo "$(GREEN)✓ Cleaned$(NC)"

dev-api: ## Start API development server
	@echo "$(BLUE)Starting API dev server...$(NC)"
	npm run dev --workspace=apps/api

dev-dashboard: ## Start Dashboard development server
	@echo "$(BLUE)Starting Dashboard dev server...$(NC)"
	npm run dev --workspace=apps/dashboard

##@ Quality

lint: ## Run linter on all workspaces
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Lint passed$(NC)"

lint-api: ## Run linter on API only
	@echo "$(BLUE)Linting API...$(NC)"
	npm run lint:api
	@echo "$(GREEN)✓ API lint passed$(NC)"

lint-dashboard: ## Run linter on Dashboard only
	@echo "$(BLUE)Linting Dashboard...$(NC)"
	npm run lint:dashboard
	@echo "$(GREEN)✓ Dashboard lint passed$(NC)"

lint-fix: ## Auto-fix linting issues
	@echo "$(BLUE)Auto-fixing lint issues...$(NC)"
	npm run lint -- --fix --workspaces
	@echo "$(GREEN)✓ Lint fixes applied$(NC)"

##@ Build

build: ## Build all applications
	@echo "$(BLUE)Building all applications...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-api: ## Build API only
	@echo "$(BLUE)Building API...$(NC)"
	npm run build:api
	@echo "$(GREEN)✓ API build complete$(NC)"

build-dashboard: ## Build Dashboard only
	@echo "$(BLUE)Building Dashboard...$(NC)"
	npm run build:dashboard
	@echo "$(GREEN)✓ Dashboard build complete$(NC)"

##@ Docker - Development

docker-dev: ## Start development environment with Docker Compose
	@echo "$(BLUE)Starting development environment...$(NC)"
	cd deployment/dev && docker compose up -d
	@echo "$(GREEN)✓ Development environment started$(NC)"
	@echo "$(YELLOW)API: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Dashboard: http://localhost:5173$(NC)"
	@echo "$(YELLOW)PostgreSQL: localhost:5432$(NC)"

docker-dev-logs: ## View development environment logs
	cd deployment/dev && docker compose logs -f

docker-dev-build: ## Rebuild development Docker images
	@echo "$(BLUE)Rebuilding development images...$(NC)"
	cd deployment/dev && docker compose build --no-cache
	@echo "$(GREEN)✓ Development images rebuilt$(NC)"

##@ Docker - Production

docker-prod: ## Start production environment with Docker Compose
	@echo "$(BLUE)Starting production environment...$(NC)"
	cd deployment/dashboard/compose && docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@echo "$(YELLOW)Dashboard: http://localhost:80$(NC)"

docker-prod-logs: ## View production environment logs
	cd deployment/dashboard/compose && docker compose -f docker-compose.prod.yml logs -f

docker-prod-build: ## Rebuild production Docker images
	@echo "$(BLUE)Rebuilding production images...$(NC)"
	cd deployment/dashboard/compose && docker compose -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)✓ Production images rebuilt$(NC)"

##@ Docker - Management

docker-down: ## Stop all Docker containers
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	-cd deployment/dev && docker compose down 2>/dev/null || true
	-cd deployment/dashboard/compose && docker compose -f docker-compose.prod.yml down 2>/dev/null || true
	@echo "$(GREEN)✓ Containers stopped$(NC)"

docker-clean: ## Remove all Docker containers, volumes, and images
	@echo "$(RED)Cleaning Docker resources...$(NC)"
	-cd deployment/dev && docker compose down -v 2>/dev/null || true
	-cd deployment/dashboard/compose && docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

docker-ps: ## Show running Docker containers
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

##@ Testing

test: ## Run tests (placeholder)
	@echo "$(YELLOW)No tests configured yet$(NC)"

##@ CI/CD

ci: lint build ## Run CI checks locally
	@echo "$(GREEN)✓ All CI checks passed$(NC)"

##@ Database

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	cd apps/api && npm run migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	cd apps/api && npm run seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

##@ Utilities

update-deps: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	npm audit
