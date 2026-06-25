from tkinter import *
import keyring
import subprocess
import sys
import requests
#kill the processess of popen on close
#add who the token is issued to in auth, host or user?
root=Tk()
root.title("server starter")

p=Entry(root,width=35)
p.grid(row=0,column=0,columnspan=3)


def start_server():
    if connected:
        connected=False
    else:
        port=str(p.get())
        #loc = os.getcwd()
        #server_path = os.path.join(loc,'session_service.py')
        token=keyring.get_password('dock_lab','access_token')
        lt_process = subprocess.Popen(
            ['lt', '--port', str(port)], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True )
        output_line = lt_process.stdout.readline()
        url = output_line.replace("your url is: ", "").strip()
        response = requests.post(
            "server_url/auth/user_auth",
            headers={"Authorization": f"Bearer {token}"},#get saved tokens issued by backend
            json={'url': url}
        )
        subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--reload'])
        connected=True

e=Button(root,text='connect',width=35,command=start_server).grid(row=1,column=0,columnspan=3)
root.mainloop()