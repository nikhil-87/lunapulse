"""SQLAlchemy ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="active")

    readings: Mapped[list["SensorReading"]] = relationship(back_populates="session")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="session")

    def __repr__(self) -> str:
        return f"<Session {self.id} [{self.status}]>"


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), index=True
    )
    heart_rate: Mapped[float] = mapped_column(Float)
    spo2: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float] = mapped_column(Float)
    resp_rate: Mapped[float] = mapped_column(Float)
    hrv: Mapped[float] = mapped_column(Float)
    accel_x: Mapped[float] = mapped_column(Float)
    accel_y: Mapped[float] = mapped_column(Float)
    accel_z: Mapped[float] = mapped_column(Float)
    accel_magnitude: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )

    session: Mapped["Session"] = relationship(back_populates="readings")

    def __repr__(self) -> str:
        return f"<Reading HR={self.heart_rate} SpO2={self.spo2}>"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), index=True
    )
    reading_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sensor_readings.id")
    )
    confidence: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(Text)
    affected_metrics: Mapped[str] = mapped_column(String(200))
    llm_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    llm_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )

    session: Mapped["Session"] = relationship(back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert {self.severity} conf={self.confidence}>"
