from tkinter import *
import keyring
import subprocess
import sys
import requests
import time
import atexit
import uvicorn
from session_service import app
import re
import threading
from subprocess import TimeoutExpired
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

        key_path = Path.home() / ".ssh" / "dock_lab_host"
        key_path.parent.mkdir(exist_ok=True)
        token = keyring.get_password('dock_lab','access_token')
        
        if not has_valid_ssh_key(key_path):

            key_path.unlink(missing_ok=True)
            key_path.with_suffix(".pub").unlink(missing_ok=True)
            
            ssh_out= open('ssh_output.log','w+')
            ssh_error= open('ssh_error.log','w+')

            subprocess.run([
                        "ssh-keygen",
                        "-q",
                        "-t", "rsa",
                        "-b", "4096",
                        "-f", str(key_path),
                        "-N", "",
                    ],
                    stdin=subprocess.DEVNULL,
                    check=True,
                    stderr= ssh_error,
                    stdout= ssh_out,
                )

        lt_process = subprocess.Popen(
                    ["ssh", "-T","-i", str(key_path), "-R", f"80:localhost:{p.get()}",
                "-o", "StrictHostKeyChecking=accept-new",
                "-o", "BatchMode=yes",
                "-o", "ConnectTimeout=15",
                "nokey@localhost.run",
            ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT,
                bufsize=1,
                text=True, )
        
        lines = []
        match= None
        output_text=""

        while True:
            line = lt_process.stdout.readline()
            if not line:
                if lt_process.poll() is not None:
                    break
                continue

            lines.append(line)
            output_text = "".join(lines)

            match = re.search(r"https://.*?\.lhr\.life", output_text)
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
    threading.Thread(target=start_background, daemon=True).start()

def has_valid_ssh_key(key_path: Path) -> bool:
    pub_key = key_path.with_suffix(".pub")

    if not key_path.is_file() or key_path.stat().st_size == 0:
        return False

    result = subprocess.run(
        ["ssh-keygen", "-y", "-P", "", "-f", str(key_path)],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0

def kill_process():#i am sorry
    global uv_server,lt_process
    lt_process.terminate()
    if uv_server:
        uv_server.should_exit = True


e=Button(root,text='connect',width=35,command=start_server).grid(row=1,column=0,columnspan=3)
atexit.register(kill_process)
root.mainloop()