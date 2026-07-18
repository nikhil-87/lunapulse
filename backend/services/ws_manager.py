"""WebSocket connection manager for broadcasting messages to clients."""

import json
import logging
import asyncio
from dataclasses import dataclass, field
from fastapi import WebSocket
from utils.helpers import new_id

logger = logging.getLogger(__name__)


@dataclass
class Client:
    """Represents a connected WebSocket client."""
    id: str
    websocket: WebSocket
    connected_at: float = 0


class WSManager:
    """Manages WebSocket connections and message broadcasting."""

    def __init__(self):
        self.clients: dict[str, Client] = {}
        self._lock = asyncio.Lock()

    @property
    def client_count(self) -> int:
        return len(self.clients)

    async def connect(self, websocket: WebSocket) -> Client:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        import time
        client = Client(
            id=new_id(),
            websocket=websocket,
            connected_at=time.time(),
        )
        async with self._lock:
            self.clients[client.id] = client
        logger.info(f"Client {client.id[:8]} connected ({self.client_count} total)")
        return client

    async def disconnect(self, client_id: str):
        """Remove a client from the manager."""
        async with self._lock:
            self.clients.pop(client_id, None)
        logger.info(f"Client {client_id[:8]} disconnected ({self.client_count} total)")

    async def send(self, client_id: str, message: dict):
        """Send a message to a specific client."""
        client = self.clients.get(client_id)
        if not client:
            return

        try:
            await client.websocket.send_text(json.dumps(message))
        except Exception:
            await self.disconnect(client_id)

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        if not self.clients:
            return

        data = json.dumps(message)
        disconnected: list[str] = []

        for client_id, client in list(self.clients.items()):
            try:
                await client.websocket.send_text(data)
            except Exception:
                disconnected.append(client_id)

        # Clean up dead connections
        for client_id in disconnected:
            await self.disconnect(client_id)

    async def broadcast_to_others(self, sender_id: str, message: dict):
        """Broadcast to all clients except the sender."""
        if not self.clients:
            return

        data = json.dumps(message)
        disconnected: list[str] = []

        for client_id, client in list(self.clients.items()):
            if client_id == sender_id:
                continue
            try:
                await client.websocket.send_text(data)
            except Exception:
                disconnected.append(client_id)

        for client_id in disconnected:
            await self.disconnect(client_id)


# Singleton instance
ws_manager = WSManager()
