from tkinter import *
import requests
import keyring
import subprocess
import sys

root=Tk()
root.title("server starter")

p=Entry(root,width=35)
p.grid(row=0,column=0,columnspan=3)

q=Entry(root,width=35)
q.grid(row=1,column=0,columnspan=3)

def get_credentials():
    credentials = {
        "username": p.get(),
        "password": q.get()
    }
    return credentials

def login():
    response=requests.post('server-url/auth/login',data=get_credentials())
    if response.ok:
        tokens=response.json()
        keyring.set_password('dock_lab', "access_token", tokens['access_token'])
        keyring.set_password('dock_lab', "refresh_token", tokens['refresh_token'])
        subprocess.Popen([sys.executable, 'button.py'])

def create():
    response=requests.post('server-url/auth/create',data=get_credentials())
    if response.ok:
        tokens=response.json()
        keyring.set_password('dock_lab', "access_token", tokens['access_token'])
        keyring.set_password('dock_lab', "refresh_token", tokens['refresh_token'])
        subprocess.Popen([sys.executable, 'button.py'])

e=Button(root,text='login',width=12,command=login).grid(row=2,column=1,columnspan=1)

a=Button(root,text='create account',width=12,command=create).grid(row=3,column=1,columnspan=1)
root.mainloop()