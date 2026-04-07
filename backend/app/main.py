from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import get_db, init_db
from .models import Booking, BookingCreate, Dog, Groomer, Parent, Service

app = FastAPI(title="wagtopia-api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── health ────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root() -> dict[str, str]:
    return {"service": "wagtopia-api", "status": "ok"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy"}


# ── parents ───────────────────────────────────────────────────────────────────

@app.get("/api/parents", response_model=list[Parent])
def list_parents():
    conn = get_db()
    rows = conn.execute(
        "SELECT parent_id, parent_name, phone FROM parents ORDER BY parent_name"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/parents/{parent_id}/dogs", response_model=list[Dog])
def list_dogs(parent_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT dog_id, parent_id, dog_name, breed FROM dogs WHERE parent_id = ? ORDER BY dog_name",
        (parent_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── groomers ──────────────────────────────────────────────────────────────────

@app.get("/api/groomers", response_model=list[Groomer])
def list_groomers():
    conn = get_db()
    rows = conn.execute(
        "SELECT groomer_id, groomer_name FROM groomers ORDER BY groomer_name"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/groomers/{groomer_id}/bookings", response_model=list[Booking])
def groomer_bookings(groomer_id: int):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT
            b.booking_id,
            b.parent_id,  p.parent_name,
            b.dog_id,     d.dog_name,
            b.service_id, s.service_name,
            b.groomer_id, g.groomer_name,
            b.start_time,
            b.end_time,
            b.created_at
        FROM bookings b
        JOIN parents  p ON p.parent_id  = b.parent_id
        JOIN dogs     d ON d.dog_id     = b.dog_id
        JOIN services s ON s.service_id = b.service_id
        JOIN groomers g ON g.groomer_id = b.groomer_id
        WHERE b.groomer_id = ?
        ORDER BY b.start_time
        """,
        (groomer_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── services ──────────────────────────────────────────────────────────────────

@app.get("/api/services", response_model=list[Service])
def list_services():
    conn = get_db()
    rows = conn.execute(
        "SELECT service_id, service_name, duration_minutes FROM services"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── bookings ──────────────────────────────────────────────────────────────────

@app.post("/api/bookings", response_model=Booking, status_code=201)
def create_booking(payload: BookingCreate):
    conn = get_db()

    if not conn.execute(
        "SELECT 1 FROM parents WHERE parent_id = ?", (payload.parent_id,)
    ).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Parent not found")

    if not conn.execute(
        "SELECT 1 FROM dogs WHERE dog_id = ? AND parent_id = ?",
        (payload.dog_id, payload.parent_id),
    ).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Dog not found for this parent")

    if not conn.execute(
        "SELECT 1 FROM services WHERE service_id = ?", (payload.service_id,)
    ).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Service not found")

    if not conn.execute(
        "SELECT 1 FROM groomers WHERE groomer_id = ?", (payload.groomer_id,)
    ).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Groomer not found")

    # Normalise to "YYYY-MM-DD HH:MM" and compute end time (always 60 min)
    start_time = conn.execute(
        "SELECT strftime('%Y-%m-%d %H:%M', ?)", (payload.start_time,)
    ).fetchone()[0]

    # Validate business hours: slots on the hour, 09:00–16:00 (last slot ends 17:00)
    time_part = start_time[11:]  # "HH:MM"
    hour, minute = int(time_part[:2]), int(time_part[3:])
    if minute != 0 or not (9 <= hour <= 16):
        conn.close()
        raise HTTPException(
            status_code=422,
            detail="Appointments must start on the hour between 09:00 and 16:00.",
        )

    end_time = conn.execute(
        "SELECT strftime('%Y-%m-%d %H:%M', datetime(?, '+60 minutes'))",
        (start_time,),
    ).fetchone()[0]

    # Reject overlapping bookings: new interval (start, end) overlaps existing if
    # existing.start_time < new.end_time AND existing.end_time > new.start_time
    overlap = conn.execute(
        """
        SELECT COUNT(*) FROM bookings
        WHERE groomer_id = ?
          AND start_time < ?
          AND end_time   > ?
        """,
        (payload.groomer_id, end_time, start_time),
    ).fetchone()[0]

    if overlap > 0:
        conn.close()
        raise HTTPException(
            status_code=409,
            detail="Groomer already has a booking that overlaps with this time slot.",
        )

    with conn:
        booking_id = conn.execute(
            """
            INSERT INTO bookings (parent_id, dog_id, groomer_id, service_id, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (payload.parent_id, payload.dog_id, payload.groomer_id, payload.service_id, start_time, end_time),
        ).lastrowid

    row = conn.execute(
        """
        SELECT
            b.booking_id,
            b.parent_id,  p.parent_name,
            b.dog_id,     d.dog_name,
            b.service_id, s.service_name,
            b.groomer_id, g.groomer_name,
            b.start_time,
            b.end_time,
            b.created_at
        FROM bookings b
        JOIN parents  p ON p.parent_id  = b.parent_id
        JOIN dogs     d ON d.dog_id     = b.dog_id
        JOIN services s ON s.service_id = b.service_id
        JOIN groomers g ON g.groomer_id = b.groomer_id
        WHERE b.booking_id = ?
        """,
        (booking_id,),
    ).fetchone()
    conn.close()
    return dict(row)
