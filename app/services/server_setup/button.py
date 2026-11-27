from tkinter import *
import keyring
import subprocess
import sys
import requests
import atexit
import uvicorn, httpx
from session_service import app
import re,os,shutil
import threading
from pathlib import Path
#kill the processess of popen on close
#add who the token is issued to in auth, host or user?

root=Tk()
root.title("server starter")

p=Entry(root,width=35)
p.grid(row=0,column=0,columnspan=3)

def run_server():#AI made me do it | because uvicorn runs in main thread and if i offload it to some other thread, there will be errors so it needs to be stopped from trying to install signal handlers
    global uv_server
    config = uvicorn.Config(app, host="127.0.0.1", port=int(p.get()), log_level="info")
    uv_server = uvicorn.Server(config)
    uv_server.install_signal_handlers = lambda: None
    uv_server.run()


def start_server():
    def start_background():
        global server_startup,lt_process,connected
        try:
            if connected:
                connected=False
                kill_process()
                sys.exit()
        except NameError:
            connected=False

        base_dir = os.path.dirname(sys.executable)
        if not os.path.exists(os.path.join(base_dir,'cloudflared.exe')) and not shutil.which('cloudflared.exe'):
            subprocess.run(
                    ["winget", "install", "--id", "Cloudflare.cloudflared", "-e",
                    "--accept-package-agreements", "--accept-source-agreements"],
                    check=True,
                )
            kill_process()
            
        token = keyring.get_password('dock_lab','access_token')
   
        lt_process = subprocess.Popen(
        ["cloudflared.exe", "tunnel", "--url", f"http://localhost:{p.get()}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
        lines = []
        match= None
        output_text=""

        app_dir = os.path.join(os.getenv('LOCALAPPDATA'), 'DOCK_LAB')
        os.makedirs(app_dir, exist_ok=True)
        output_path = os.path.join(app_dir, 'output.txt')

        while True:#write a loop to save logs in a log.txt to keep stdout clean
            line = lt_process.stdout.readline()
            if not line:
                if lt_process.poll() is not None:
                    break
                continue
            lines.append(line)
            with open(output_path,"a") as file:
                file.write(line)
            output_text = "".join(lines)
            match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", output_text)
            if match:
                break

        if match is None:
            lt_process.terminate()
            raise RuntimeError(
                f"SSH tunnel exited without providing a URL:\n{output_text}"
            )

        url = match.group(0)

        response = requests.post(
            "https://testproduct.tech/session/register",
            headers={"Authorization": f"Bearer {token}"},
            json={'url': url}
        )
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        connected=True
        while True:
            line = lt_process.stdout.readline()
            if lt_process.poll() is not None:
                print(f"SSH tunnel process exited with code {lt_process.returncode}")
                with open("output.txt","a") as file:
                    file.write(line)
                break
            with open(output_path,"a") as file:
                file.write(line)
    threading.Thread(target=start_background, daemon=True).start()

def kill_process():#i am sorry
    global uv_server,lt_process
    host_token = keyring.get_password('dock_lab', 'access_token')
    response = requests.post(
        "https://testproduct.tech/session/remove_host",
        headers={"Authorization": f"Bearer {host_token}"}
    )
    if response.status_code != 200:
        raise ConnectionRefusedError("removal of url failed")
    lt_process.terminate()
    if uv_server:
        uv_server.should_exit = True


e=Button(root,text='connect',width=35,command=start_server).grid(row=1,column=0,columnspan=3)
atexit.register(kill_process)
root.mainloop()