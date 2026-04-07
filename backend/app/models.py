from pydantic import BaseModel


class Parent(BaseModel):
    parent_id: int
    parent_name: str
    phone: str | None


class Dog(BaseModel):
    dog_id: int
    parent_id: int
    dog_name: str
    breed: str | None


class Groomer(BaseModel):
    groomer_id: int
    groomer_name: str


class Service(BaseModel):
    service_id: int
    service_name: str
    duration_minutes: int


class BookingCreate(BaseModel):
    parent_id: int
    dog_id: int
    service_id: int
    groomer_id: int
    start_time: str  # "YYYY-MM-DD HH:MM"


class Booking(BaseModel):
    booking_id: int
    parent_id: int
    parent_name: str
    dog_id: int
    dog_name: str
    service_id: int
    service_name: str
    groomer_id: int
    groomer_name: str
    start_time: str
    end_time: str
    created_at: str
