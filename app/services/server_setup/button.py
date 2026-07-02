from tkinter import *
import keyring
import subprocess
import sys
import requests
import time
import atexit
import re
import threading
from subprocess import TimeoutExpired
#kill the processess of popen on close
#add who the token is issued to in auth, host or user?
root=Tk()
root.title("server starter")

p=Entry(root,width=35)
p.grid(row=0,column=0,columnspan=3)

def start_server():#use pesudo terminal instead of subprocess for better results
    def start_background():
        global server_startup,lt_process,connected
        try:
            if connected:
                connected=False
                kill_process()
                sys.exit()
        except NameError:
            connected=False

        output = open('terminal_output.log','w+')
        token = keyring.get_password('dock_lab','access_token')
        lt_process = subprocess.Popen(
            ['ssh', '-R', f'80:localhost:{p.get()}', 'localhost.run'], 
            stdin=subprocess.PIPE,
            stdout=output, 
            stderr=subprocess.DEVNULL,
            text=True )
        time.sleep(1)
        output.seek(0)
        out = output.read()
        run = keyring.get_password('dock_lab','first_run')

        if not run:
            keyring.set_password('dock_lab','first_run',"false")
            lt_process.stdin.write("yes\n")
            lt_process.stdin.flush() 

        if not out:         
        
            lt_process.terminate()                
            key_gen = subprocess.Popen(
            ['ssh-keygen', '-t', 'rsa', '-b', '4096'], 
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL,
            text=True )
            time.sleep(1)

            key_gen.stdin.write("\n\n\n")
            key_gen.stdin.flush() 

            lt_process = subprocess.Popen(
            ['ssh', '-R', f'80:localhost:{p.get()}', 'localhost.run'], 
            stdin=subprocess.PIPE,
            stdout=output, 
            stderr=subprocess.DEVNULL,
            text=True )
            time.sleep(1)
            output.seek(0)
            key_gen.terminate()
            out = output.read()

        pattern = r"https://.*?\.lhr\.life"
        url = re.search(pattern=pattern,string=out)
        if not url:
            raise RuntimeError("Failed to start tunnel")

        response = requests.post(
            "server_url/auth/user_auth",
            headers={"Authorization": f"Bearer {token}"},
            json={'url': url[0]}
        )
        server_startup = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--reload'])
        connected=True
    threading.Thread(target=start_background, daemon=True).start()
    
def kill_process():#i am sorry
    global server_startup,lt_process
    lt_process.terminate()
    server_startup.terminate()


e=Button(root,text='connect',width=35,command=start_server).grid(row=1,column=0,columnspan=3)
atexit.register(kill_process)
root.mainloop()