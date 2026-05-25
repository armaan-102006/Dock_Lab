from fastapi import APIRouter, WebSocket

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await ws.send_text("connected")
    await ws.close()
