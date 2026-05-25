class WebsocketService:
    def __init__(self):
        pass

    async def send(self, websocket, message: str):
        await websocket.send_text(message)
