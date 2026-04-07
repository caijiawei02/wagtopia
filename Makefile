.PHONY: install install-backend install-frontend dev backend frontend stop clean

# ── Install ────────────────────────────────────────────────────────────────
install: install-backend install-frontend

install-backend:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

install-frontend: use-node
	cd frontend && npm install

# ── Node version ───────────────────────────────────────────────────────────
use-node:
	@export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	nvm use 20 2>/dev/null || (nvm install 20 && nvm use 20)

# ── Stop any running servers ───────────────────────────────────────────────
stop:
	@echo "Stopping servers on ports 8000 and 5173..."
	@-fuser -k 8000/tcp 2>/dev/null; true
	@-fuser -k 5173/tcp 2>/dev/null; true
	@echo "Done."

# ── Dev (both servers) ─────────────────────────────────────────────────────
dev: stop use-node
	@trap 'kill 0' INT; \
	cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 & \
	cd frontend && npm run dev & \
	wait

# ── Individual servers ─────────────────────────────────────────────────────
backend: stop
	cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend: stop use-node
	cd frontend && npm run dev

# ── Cleanup ────────────────────────────────────────────────────────────────
clean:
	rm -f backend/wagtopia.db
	rm -rf backend/.venv
	rm -rf frontend/node_modules
