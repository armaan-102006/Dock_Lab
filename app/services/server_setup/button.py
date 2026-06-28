from tkinter import *
import keyring
import subprocess
import sys
import requests
import atexit
import re
from subprocess import TimeoutExpired
#kill the processess of popen on close
#add who the token is issued to in auth, host or user?
root=Tk()
root.title("server starter")

p=Entry(root,width=35)
p.grid(row=0,column=0,columnspan=3)

global server_startup,lt_process
def start_server():
    if connected:
        connected=False
        kill_process()
    else:
        #loc = os.getcwd()
        #server_path = os.path.join(loc,'session_service.py')
        token = keyring.get_password('dock_lab','access_token')
        lt_process = subprocess.Popen(
            ['ssh', '-R', f'80:localhost:{p.get()}', 'localhost.run'], 
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True )
        
        try:
            out,err=lt_process.communicate(timeout=1)
        except TimeoutExpired:
            lt_process.kill()
            outs, errs = lt_process.communicate()
            print("failed to start a server")
        else:
            run = keyring.get_password('dock_lab','first_run')
            if not run:
                out,err=lt_process.communicate(input='yes\n')
                keyring.set_password('dock_lab','first_run',"false")
            if err:
                try:
                    out,err=lt_process.communicate(input='ssh-keygen -t rsa -b 4096\n',timeout=1)
                except TimeoutExpired:
                    lt_process.kill()
                    outs, errs = lt_process.communicate()
                    print("failed to generate ssh key")
                for i in range(3):
                    out,err=lt_process.communicate(input='ssh-keygen -t rsa -b 4096\n',timeout=1)
                    if err:
                        lt_process.kill()
                        outs, errs = lt_process.communicate()
                        print("failed to final setup after key generation")

                outs, errs = lt_process.communicate(input='ssh -R 80:localhost:8080 localhost.run')
            
            pattern=r"https://.*?\.lhr\.life"
            url=re.search(pattern=pattern,string=out)

        response = requests.post(
            "server_url/auth/user_auth",
            headers={"Authorization": f"Bearer {token}"},
            json={'url': url}
        )
        server_startup = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--reload'])
        connected=True

def kill_process():#i am sorry
    lt_process.terminate()
    server_startup.terminate()


e=Button(root,text='connect',width=35,command=start_server).grid(row=1,column=0,columnspan=3)
root.mainloop()
atexit.register(kill_process)