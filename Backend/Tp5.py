from tkinter import *
from tkinter import ttk
from tkinter.ttk import Combobox, Treeview

import pymysql


class DbConnect(object):
    def __init__(self):
        self.dbconnection = pymysql.connect(host='localhost', port=3306, user="root", passwd="", db="dbComptoire")
        self.cursor = self.dbconnection.cursor()

    def commit_db(self):
        self.dbconnection.commit()

    def close_db(self):
        self.cursor.close()
        self.dbconnection.close()


db = DbConnect()
db.cursor.execute("SELECT * FROM clients LIMIT 10")
results = db.cursor.fetchall()
print(results[0])



db.cursor.execute("SELECT NEmployé, Nom, Prénom, Fonction FROM employés LIMIT 1")
first_emp = db.cursor.fetchall()[0]  # Get the first row
N = first_emp[0]  # Access columns from the row
nom = first_emp[1]
prenom = first_emp[2]
Fonction = first_emp[3]

window = Tk()
window.title("Consultration des employés")
menubar = Menu(window)
menuInfo = Menu(menubar, tearoff=0)
menubar.add_cascade(menu=menuInfo, label="Infos société")
window.config(menu=menubar)
frame1 = Frame(window)
frame1.pack(fill=BOTH)

label1 = Label(frame1, text="N employé")
label1.pack()

input1 = Entry(frame1)
input1.insert(END, N)
input1.pack()

label2 = Label(frame1, text="Nom")
label2.pack()

input2 = Entry(frame1)
input2.insert(END, nom)
input2.pack()

label3 = Label(frame1, text="Prenom")
label3.pack()

input3 = Entry(frame1)
input3.insert(END, prenom)
input3.pack()

label4 = Label(frame1, text="Fonction")
label4.pack()

input4 = Entry(frame1)
input4.insert(END, Fonction)
input4.pack()

def change(N,nom,prenom,fonction):
    # Update the entry fields
    input1.delete(0, END)
    input1.insert(END, N)
    input2.delete(0, END)
    input2.insert(END, nom)
    input3.delete(0, END)
    input3.insert(END, prenom)
    input4.delete(0, END)
    input4.insert(END, Fonction)

def next_emp():
    global N, prenom, Fonction, nom
    next = N + 1
    sql = "SELECT NEmployé, Nom, Prénom, Fonction FROM employés WHERE NEmployé=" + str(next) + ";"
    db.cursor.execute(sql)
    results = db.cursor.fetchall()

    if results:
        N = results[0][0]
        nom = results[0][1]
        prenom = results[0][2]
        Fonction = results[0][3]

    change(N,nom,prenom,Fonction)

def prev_emp():
    global N, prenom, Fonction, nom
    next = N -1
    sql = "SELECT NEmployé, Nom, Prénom, Fonction FROM employés WHERE NEmployé=" + str(next) + ";"
    db.cursor.execute(sql)
    results = db.cursor.fetchall()

    if results:
        N = results[0][0]
        nom = results[0][1]
        prenom = results[0][2]
        Fonction = results[0][3]

    change(N, nom, prenom, Fonction)

def go_first():
    global first_emp , N, prenom, Fonction, nom
    N = first_emp[0]
    nom = first_emp[1]
    prenom = first_emp[2]
    Fonction = first_emp[3]

    change(N, nom, prenom, Fonction)

def go_last():
    global first_emp , N, prenom, Fonction, nom
    db.cursor.execute("SELECT COUNT * FROM employés")
    last =  db.cursor.fetchall()[0]


buttons = Frame(frame1)
btn1 = Button(buttons, text="|<",command=go_first)
btn1.pack(side=LEFT, pady=10, padx=10)
btn2 = Button(buttons, text="<",command=prev_emp)
btn2.pack(side=LEFT, pady=10, padx=10)
btn3 = Button(buttons, text=">", command=next_emp)
btn3.pack(side=LEFT, pady=10, padx=10)
btn4 = Button(buttons, text=">|")
btn4.pack(side=LEFT, pady=10, padx=10)

buttons.pack()
window.geometry("300x300")
window.mainloop()

window2 = Tk()
window2.title("Consultation des Commandes")

frameinfo = Frame(window2)
frameinfo.pack()

labelinfo = LabelFrame(frameinfo, text="Infos Commande")
labelinfo.pack()

Ncommande = Label(labelinfo, text="NCommande")
Ncommande.pack()

db.cursor.execute("SELECT NCommande FROM commandes")
listvaleur = db.cursor.fetchall()
combo = ttk.Combobox(labelinfo, values=listvaleur)
combo.pack()

labelDateC = Label(labelinfo, text="Datecommande")
labelDateC.pack()
ShowDateC = Entry(labelinfo)
ShowDateC.pack()

labelAliv = Label(labelinfo, text="Alivecommande")
labelAliv.pack()
ShowAliv = Entry(labelinfo)
ShowAliv.pack()

labelDateE = Label(labelinfo, text="DateEnvoie")
labelDateE.pack()
ShowDateE = Entry(labelinfo)
ShowDateE.pack()

labelCodeC = Label(labelinfo, text="CodeClient")
labelCodeC.pack()
ShowCodeC = Entry(labelinfo)
ShowCodeC.pack()

labelSoci = Label(labelinfo, text="Société")
labelSoci.pack()
ShowSoc = Entry(labelinfo)
ShowSoc.pack()


def changeInfo(event):
    selected = combo.get()
    if selected:
        sql = "SELECT c.DateCommande, c.AlivrerAvant, c.DateEnvoi, c.CodeClient, cl.Société FROM commandes c INNER JOIN clients cl ON cl.CodeClient = c.CodeClient WHERE c.NCommande=" + str(
            selected)
        db.cursor.execute(sql)
        results = db.cursor.fetchall()

        if results:
            ShowDateC.delete(0, END)
            ShowDateC.insert(END, results[0][0])
            ShowAliv.delete(0, END)
            ShowAliv.insert(END, results[0][1])
            ShowDateE.delete(0, END)
            ShowDateE.insert(END, results[0][2])
            ShowCodeC.delete(0, END)
            ShowCodeC.insert(END, results[0][3])
            ShowSoc.delete(0, END)
            ShowSoc.insert(END, results[0][4])


combo.bind("<<ComboboxSelected>>", changeInfo)


framedetail =Frame(window2)
framedetail.pack()
framedetails = LabelFrame(framedetail, text="Detail commande")
framedetails.pack()
tree = Treeview(framedetails,(1,2,3),height=4,show="headings")
tree.place(x=50,y=50,width=300)
tree.column(1,width=50)
tree.column(2,width=50)
tree.column(3,width=50)
tree.heading(1,text="Ref produit")
tree.heading(2,text="nomProduit")
tree.heading(3,text="qt com")
def comboAction (event):
    req=""
    self.db.dbcursor.execute(req )
    results = self.db.dbcursor.fetchall()
    for it in self.tree.get_children():
    self.tree.delete(it)
    for row in results:
    self.tree.insert('','end', values=(row[0], row[1], row[2]))
window2.mainloop()

window3 = Tk()
window3.title("Statistiques des employés")
framegraph = Frame(window3)
framegraph.pack()
labelemploye = Label(framegraph,text="Employés")
labelemploye.pack()
db.cursor.execute("SELECT Nom FROM employés")
resultats = db.cursor.fetchall()
comboemp = Combobox(framegraph,values=resultats)
comboemp.set(resultats[0])
comboemp.pack()



window3.mainloop()


