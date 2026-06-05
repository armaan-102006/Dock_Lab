from fastapi import FastAPI
import socketio

fapp = FastAPI()
sio = socketio.AsyncServer()
app = socketio.ASGIApp(sio,fapp)

@app.get("/")
def read_root():
    return {"status": "ok"}
